import { Request, Response } from "express";

const mockSignInWithPassword = jest.fn();
const mockFrom = jest.fn();
const mockAuditSave = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
    from: mockFrom,
  })),
}));

jest.mock("../src/infrestructure/server/auth/AuditoriaService", () => ({
  AuditoriaesService: {
    guardar: mockAuditSave,
  },
}));

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: jest.fn((res: Response, code: number, data: unknown) =>
    res.status(code).json(data)
  ),
}));

jest.mock("../src/helpers/ErrorResponse", () => ({
  errorHandler: {
    handleError: jest.fn((error: Error, res: Response) =>
      res.status(500).json({ message: error.message })
    ),
  },
}));

jest.mock(
  "../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/getUsuarioAndSolicitud",
  () => ({
    getUsuarioAndSolicitud: jest.fn(),
  })
);

jest.mock(
  "../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/ActulizarPassworClaveDInamicaFunction",
  () => ({
    getAlumnoEmailById: jest.fn(),
    getAuthIdByEmail: jest.fn(),
    updateAuthPassword: jest.fn(),
  })
);

jest.mock(
  "../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/validateCurrentPasswordFuntion",
  () => ({
    updateUserPasswordById: jest.fn(),
  })
);

jest.mock("../src/core/services/EmailService", () => ({
  EmailService: jest.fn(),
}));

jest.mock("../src/helpers/supabase-client", () => ({
  client: {},
}));

jest.mock("../src/helpers/user-auth-supabase", () => ({
  verificarExistencia: jest.fn(),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

function mockUsuarioSelectOnce(data: Record<string, unknown> | null) {
  const single = jest.fn().mockResolvedValue({ data, error: null });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));
  return { select, eq, single };
}

function mockUsuarioUpdateOnce() {
  const eq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn(() => ({ eq }));
  return { update, eq };
}

describe("AuthService login attempts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments failed attempts without using historical successful-login counts", async () => {
    const { AuthService } = await import(
      "../src/infrestructure/server/auth/AuthService"
    );
    const stateLookup = mockUsuarioSelectOnce({
      usuario_id: 7,
      intentos_inicio_sesion: 12,
      estado_usuario: "activo",
    });
    const failedUpdate = mockUsuarioUpdateOnce();

    mockFrom
      .mockReturnValueOnce({ ...stateLookup, update: failedUpdate.update })
      .mockReturnValueOnce({ update: failedUpdate.update });
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: new Error("Invalid credentials"),
    });

    const req = {
      body: { email: "user@example.com", password: "bad-password" },
      ip: "127.0.0.1",
    } as Partial<Request>;
    const res = createResponse();

    await AuthService.login(req as Request, res as any);

    expect(failedUpdate.update).toHaveBeenCalledWith({
      intentos_inicio_sesion: 1,
      estado_usuario: "fallido_login",
      fecha_actualizacion: expect.any(Date),
    });
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("blocks the account on the fifth consecutive failed login", async () => {
    const { AuthService } = await import(
      "../src/infrestructure/server/auth/AuthService"
    );
    const stateLookup = mockUsuarioSelectOnce({
      usuario_id: 7,
      intentos_inicio_sesion: 4,
      estado_usuario: "fallido_login",
    });
    const failedUpdate = mockUsuarioUpdateOnce();

    mockFrom
      .mockReturnValueOnce({ ...stateLookup, update: failedUpdate.update })
      .mockReturnValueOnce({ update: failedUpdate.update });
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: new Error("Invalid credentials"),
    });

    const req = {
      body: { email: "user@example.com", password: "bad-password" },
      ip: "127.0.0.1",
    } as Partial<Request>;
    const res = createResponse();

    await AuthService.login(req as Request, res as any);

    expect(failedUpdate.update).toHaveBeenCalledWith({
      intentos_inicio_sesion: 5,
      estado_usuario: "bloqueado",
      fecha_actualizacion: expect.any(Date),
    });
  });

  it("does not call Supabase auth when account is already locked", async () => {
    const { AuthService } = await import(
      "../src/infrestructure/server/auth/AuthService"
    );
    const stateLookup = mockUsuarioSelectOnce({
      usuario_id: 7,
      intentos_inicio_sesion: 5,
      estado_usuario: "bloqueado",
    });
    mockFrom.mockReturnValueOnce(stateLookup);

    const req = {
      body: { email: "user@example.com", password: "correct-password" },
      ip: "127.0.0.1",
    } as Partial<Request>;
    const res = createResponse();

    await AuthService.login(req as Request, res as any);

    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 401,
      message: "Cuenta bloqueada por intentos fallidos",
    });
  });

  it("resets failed attempts on successful login", async () => {
    const { AuthService } = await import(
      "../src/infrestructure/server/auth/AuthService"
    );
    const stateLookup = mockUsuarioSelectOnce({
      usuario_id: 7,
      intentos_inicio_sesion: 3,
      estado_usuario: "fallido_login",
    });
    const userDataLookup = mockUsuarioSelectOnce({
      usuario_id: 7,
      email: "user@example.com",
      intentos_inicio_sesion: 3,
      estado_usuario: "fallido_login",
    });
    const rolLookup = {
      select: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
    const successUpdate = mockUsuarioUpdateOnce();

    mockFrom
      .mockReturnValueOnce(stateLookup)
      .mockReturnValueOnce(userDataLookup)
      .mockReturnValueOnce(rolLookup)
      .mockReturnValueOnce({ update: successUpdate.update });
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: "token" },
        user: { id: "auth-user-id" },
      },
      error: null,
    });

    const req = {
      body: { email: "user@example.com", password: "correct-password" },
      ip: "127.0.0.1",
    } as Partial<Request>;
    const res = createResponse();

    await AuthService.login(req as Request, res as any);

    expect(successUpdate.update).toHaveBeenCalledWith({
      intentos_inicio_sesion: 0,
      estado_usuario: "activo",
      ultimo_inicio_sesion: expect.any(Date),
      fecha_actualizacion: expect.any(Date),
      activo: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
