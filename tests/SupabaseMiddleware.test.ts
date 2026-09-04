const mockGetUser = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockCreateClient = jest.fn();

export {};

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

async function loadSessionAuth() {
  jest.resetModules();
  process.env.SUPABASE_HOST = "https://example.supabase.co";
  process.env.SUPABASE_PASSWORD = "anon-key";
  process.env.SUPABASE_PASSWORD_ADMIN = "service-key";

  return import("../src/middleware/supabaseMidleware");
}

describe("sessionAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    });
    mockEq.mockResolvedValue({
      data: [{ usuario_id: 10, auth_id: "auth-user-id" }],
      error: null,
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 with a generic response when token is missing", async () => {
    const { sessionAuth } = await loadSessionAuth();
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
    expect(JSON.stringify((res.json as jest.Mock).mock.calls)).not.toContain(
      "No token provided"
    );
  });

  it("returns 401 with a generic response when Supabase rejects the token", async () => {
    const { sessionAuth } = await loadSessionAuth();
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("JWT expired"),
    });
    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
    expect(JSON.stringify((res.json as jest.Mock).mock.calls)).not.toContain(
      "JWT expired"
    );
  });

  it("returns 500 with a generic response when server configuration is missing", async () => {
    jest.resetModules();
    delete process.env.SUPABASE_HOST;
    process.env.SUPABASE_PASSWORD = "anon-key";
    process.env.SUPABASE_PASSWORD_ADMIN = "service-key";
    const { sessionAuth } = await import("../src/middleware/supabaseMidleware");
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Error interno del servidor",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("keeps request context and calls next for a valid session", async () => {
    const adminClient = {
      auth: { getUser: mockGetUser },
      from: mockFrom,
      __key: "service-key",
    };
    const userClient = {
      auth: { getUser: mockGetUser },
      __key: "anon-key",
    };
    mockCreateClient.mockImplementation((_url: string, key: string) =>
      key === "service-key" ? adminClient : userClient
    );

    const { sessionAuth } = await loadSessionAuth();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-id" } },
      error: null,
    });
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(req).toMatchObject({
      creado_por: 10,
      actualizado_por: 10,
      user: { usuario_id: 10, auth_id: "auth-user-id" },
    });
    expect((req as any).supabase).toBe(userClient);
    expect((req as any).supabaseAdmin).toBe(adminClient);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("accepts x-almaia-access as an auth token fallback", async () => {
    const adminClient = {
      auth: { getUser: mockGetUser },
      from: mockFrom,
      __key: "service-key",
    };
    const userClient = {
      auth: { getUser: mockGetUser },
      __key: "anon-key",
    };
    mockCreateClient.mockImplementation((_url: string, key: string) =>
      key === "service-key" ? adminClient : userClient
    );

    const { sessionAuth } = await loadSessionAuth();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-id" } },
      error: null,
    });
    const req = { headers: { "x-almaia-access": "valid-token" } };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows high privilege users without verified MFA factors", async () => {
    mockCreateClient.mockImplementation((_url: string, key: string) => {
      if (key === "service-key") {
        return {
          auth: {
            getUser: mockGetUser,
            admin: {
              mfa: {
                listFactors: jest.fn().mockResolvedValue({
                  data: { factors: [] },
                  error: null,
                }),
              },
            },
          },
          from: mockFrom,
        };
      }

      return {
        auth: {
          getUser: mockGetUser,
          mfa: {
            getAuthenticatorAssuranceLevel: jest.fn().mockResolvedValue({
              data: { currentLevel: "aal1", nextLevel: "aal2" },
              error: null,
            }),
          },
        },
      };
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-id" } },
      error: null,
    });
    mockEq.mockResolvedValue({
      data: [{ usuario_id: 10, auth_id: "auth-user-id", rol_id: 6 }],
      error: null,
    });

    const { sessionAuth } = await loadSessionAuth();
    const req = {
      path: "/perfil",
      headers: { authorization: "Bearer valid-token" },
    };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows high privilege users to reach MFA enrollment routes before aal2", async () => {
    mockCreateClient.mockImplementation((_url: string, key: string) => {
      if (key === "service-key") {
        return {
          auth: {
            getUser: mockGetUser,
            admin: {
              mfa: {
                listFactors: jest.fn().mockResolvedValue({
                  data: {
                    factors: [{ id: "factor-1", status: "verified" }],
                  },
                  error: null,
                }),
              },
            },
          },
          from: mockFrom,
        };
      }

      return {
        auth: {
          getUser: mockGetUser,
          mfa: {
            getAuthenticatorAssuranceLevel: jest.fn().mockResolvedValue({
              data: { currentLevel: "aal1", nextLevel: "aal2" },
              error: null,
            }),
          },
        },
      };
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-id" } },
      error: null,
    });
    mockEq.mockResolvedValue({
      data: [{ usuario_id: 10, auth_id: "auth-user-id", rol_id: 6 }],
      error: null,
    });

    const { sessionAuth } = await loadSessionAuth();
    const req = {
      path: "/mfa/enroll",
      headers: { authorization: "Bearer valid-token" },
    };
    const res = createResponse();
    const next = jest.fn();

    await sessionAuth(req as any, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
