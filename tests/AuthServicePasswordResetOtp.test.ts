import { Request, Response } from "express";

const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn();
const mockGetUsuarioAndSolicitud = jest.fn();
const mockEnviarEmailRestorePassword = jest.fn();
const mockRandomInt = jest.fn();

jest.mock("crypto", () => ({
  randomInt: (...args: unknown[]) => mockRandomInt(...args),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: () => ({
      from: mockFrom,
      auth: {
        signInWithPassword: jest.fn(),
      },
    }),
  })),
}));

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: jest.fn((res: Response, code: number, data: unknown) =>
    res.status(code).json(data)
  ),
}));

jest.mock("../src/core/services/EmailService", () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    enviarEmailRestorePassword: mockEnviarEmailRestorePassword,
  })),
}));

jest.mock(
  "../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/getUsuarioAndSolicitud",
  () => ({
    getUsuarioAndSolicitud: mockGetUsuarioAndSolicitud,
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

jest.mock("../src/infrestructure/server/auth/AuditoriaService", () => ({
  AuditoriaesService: {
    guardar: jest.fn(),
  },
}));

jest.mock("../src/helpers/supabase-client", () => ({
  client: {
    auth: {
      admin: {
        updateUserById: jest.fn(),
      },
    },
  },
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

describe("AuthService password reset OTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomInt.mockReturnValue(123456);
    mockEnviarEmailRestorePassword.mockResolvedValue(true);

    mockFrom.mockImplementation((table: string) => {
      if (table === "view_auth_users") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: "auth-user-id" },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "solicitudes_cambio_password") {
        return {
          update: mockUpdate,
          insert: mockInsert,
          delete: mockDelete,
        };
      }

      return {};
    });

    mockUpdate.mockReturnValue({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              solicitud_id: 1,
              user_auth_id: "auth-user-id",
              authorization_pass: "123456",
              used_pass: false,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
    });

    mockInsert.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: {
            solicitud_id: 1,
            user_auth_id: "auth-user-id",
            authorization_pass: "123456",
            used_pass: false,
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      })),
    });

    mockDelete.mockReturnValue({
      eq: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    });
  });

  it("uses crypto OTP and does not return the authorization code in the response", async () => {
    const { AuthService } = await import(
      "../src/infrestructure/server/auth/AuthService"
    );
    const req = { body: { email: "user@example.com" } } as Partial<Request>;
    const res = createResponse();

    await AuthService.solicitar_cambio_password(req as Request, res as any);

    expect(mockRandomInt).toHaveBeenCalledWith(100000, 1000000);
    expect(mockEnviarEmailRestorePassword).toHaveBeenCalledWith(
      "user@example.com",
      "123456"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain("authorization_pass");
    expect(JSON.stringify(payload)).not.toContain("123456");
  });

  it("does not return reset code or pass after restoring the password", async () => {
    const { AuthService } = await import(
      "../src/infrestructure/server/auth/AuthService"
    );
    mockGetUsuarioAndSolicitud.mockResolvedValue({
      usuarioId: "auth-user-id",
      solicitud: {
        authorization_pass: "123456",
        used_pass: false,
        created_at: new Date().toISOString(),
      },
    });
    const req = {
      body: {
        email: "user@example.com",
        pass: "123456",
        newPassword: "NewPassword!2026",
      },
    } as Partial<Request>;
    const res = createResponse();

    await AuthService.RestorePassword(req as Request, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain("authorization_pass");
    expect(JSON.stringify(payload)).not.toContain("123456");
    expect(JSON.stringify(payload)).not.toContain("NewPassword!2026");
  });
});
