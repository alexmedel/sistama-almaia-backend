import fs from "fs";
import path from "path";

const updateMock = jest.fn();
const eqMock = jest.fn();
const fromMock = jest.fn();
const getClientMock = jest.fn();
const formatResponseMock = jest.fn();

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: getClientMock,
  })),
}));

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: formatResponseMock,
}));

jest.mock("../src/helpers/ErrorResponse", () => ({
  errorHandler: {
    handleError: jest.fn(),
  },
}));

const root = path.resolve(__dirname, "..");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("biometric endpoint security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
    getClientMock.mockReturnValue({ from: fromMock });
  });

  it("protects biometric state endpoints with sessionAuth", () => {
    const authRoutes = readProjectFile("src/routes/auth.routes.ts");

    expect(authRoutes).toContain(
      'router.post("/biometric/activar", sessionAuth, BiometriaService.activar)'
    );
    expect(authRoutes).toContain(
      'router.post("/biometric/desactivar", sessionAuth, BiometriaService.desactivar)'
    );
    expect(authRoutes).toContain(
      'router.get("/biometric/status/:user_id", sessionAuth, BiometriaService.estado)'
    );
    expect(authRoutes).toContain(
      'router.post("/biometric/login", BiometriaService.loginWithBiometric)'
    );
  });

  it("activates biometrics only for the authenticated request user", async () => {
    const { BiometriaService } = await import(
      "../src/infrestructure/server/auth/BiometriaService"
    );
    const req = {
      user: { usuario_id: 10 },
      body: { user_id: 999 },
    };
    const res = createResponse();

    await BiometriaService.activar(req as any, res as any);

    expect(fromMock).toHaveBeenCalledWith("usuarios");
    expect(updateMock).toHaveBeenCalledWith({ biometria_activa: true });
    expect(eqMock).toHaveBeenCalledWith("usuario_id", 10);
    expect(eqMock).not.toHaveBeenCalledWith("usuario_id", 999);
    expect(formatResponseMock).toHaveBeenCalledWith(res, 200, {
      message: "Biometría activada",
    });
  });
});
