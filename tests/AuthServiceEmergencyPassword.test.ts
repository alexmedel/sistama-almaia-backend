import { Request, Response } from "express";

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockSignInWithPassword = jest.fn();

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: jest.fn(),
}));

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: () => ({
      from: mockFrom,
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    }),
  })),
}));

jest.mock("../src/helpers/supabase-client", () => ({
  client: {},
}));

jest.mock("../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/getUsuarioAndSolicitud", () => ({
  getUsuarioAndSolicitud: jest.fn(),
}));

jest.mock("../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/ActulizarPassworClaveDInamicaFunction", () => ({
  getAlumnoEmailById: jest.fn(),
  getAuthIdByEmail: jest.fn(),
  updateAuthPassword: jest.fn(),
}));

jest.mock("../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/validateCurrentPasswordFuntion", () => ({
  validateCurrentPassword: jest.fn(),
  updateUserPasswordById: jest.fn(),
}));

jest.mock("../src/core/services/EmailService", () => ({
  EmailService: jest.fn(),
}));

jest.mock("../src/infrestructure/server/auth/AuditoriaService", () => ({
  AuditoriaesService: {
    guardar: jest.fn(),
  },
}));

describe("AuthService.updateUserPasswordById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates auth password before signing in with the new password", async () => {
    const { AuthService } = require("../src/infrestructure/server/auth/AuthService");
    const { FormatResponse } = require("../src/helpers/Response");
    const {
      updateUserPasswordById: updateAuthUserPasswordById,
    } = require("../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/validateCurrentPasswordFuntion");

    const req = {
      body: {
        auth_id: "auth-user-id",
        newPassword: "TestPassword!2026",
      },
    } as Partial<Request>;
    const res = {} as Response;

    mockSingle.mockResolvedValue({
      data: { email: "slep.demo@almaia.cl" },
      error: null,
    });
    (updateAuthUserPasswordById as jest.Mock).mockResolvedValue({
      id: "auth-user-id",
    });
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    await AuthService.updateUserPasswordById(req as Request, res);

    expect(updateAuthUserPasswordById).toHaveBeenCalledWith(
      "auth-user-id",
      "TestPassword!2026"
    );
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "slep.demo@almaia.cl",
      password: "TestPassword!2026",
    });
    expect(FormatResponse).toHaveBeenCalledWith(res, 200, {
      message: "Clave generada",
      data: { session: { access_token: "token" } },
    });
  });
});
