 
import { readFileSync } from "fs";
import { join } from "path";
import { Request, Response } from "express";

const mockSingle = jest.fn();
const mockQueryBuilder = {
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: mockSingle,
};
const mockSelect = jest.fn(() => mockQueryBuilder);
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: jest.fn(),
}));

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: () => ({
      from: mockFrom,
    }),
  })),
}));

describe("Privacidad consentimiento actual", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("expone ruta publica para obtener consentimiento actual", () => {
    const source = readFileSync(
      join(__dirname, "..", "src", "routes", "privacidad.routes.ts"),
      "utf8"
    );

    expect(source).toMatch(
      /router\.get\(\s*"\/consentimiento\/actual"\s*,\s*PrivacidadService\.obtenerConsentimientoActual\s*\)/
    );
  });

  it("devuelve codigo, titulo, version y texto de consentimiento actual", async () => {
    const { PrivacidadService } = require("../src/infrestructure/server/privacidad/PrivacidadService");
    const { FormatResponse } = require("../src/helpers/Response");

    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    mockSingle.mockResolvedValue({
      data: {
        consentimiento_codigo: "consentimiento_asentimiento_menor",
        consentimiento_titulo: "Consentimiento y asentimiento",
        consentimiento_version: "v1",
        consentimiento_texto: "texto legal",
      },
      error: null,
    });

    await PrivacidadService.obtenerConsentimientoActual(req, res);

    expect(mockFrom).toHaveBeenCalledWith("consentimiento_versiones");
    expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(
      1,
      "consentimiento_codigo",
      "consentimiento_asentimiento_menor"
    );
    expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(
      2,
      "consentimiento_es_actual",
      true
    );
    expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(3, "activo", true);
    expect(FormatResponse).toHaveBeenCalledWith(res, 200, {
      message: "Consentimiento actual obtenido correctamente",
      data: {
        codigo: "consentimiento_asentimiento_menor",
        titulo: "Consentimiento y asentimiento",
        version: "v1",
        texto: "texto legal",
      },
    });
  });
});
