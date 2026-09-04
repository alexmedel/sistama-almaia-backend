 
const guardarAuditoriaMock = jest.fn();

function createThenableQuery(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
}

const permissionQuery = createThenableQuery({
  data: [{ colegio_id: 0 }],
  error: null,
});
const countQuery = createThenableQuery({ count: 1, error: null });
const dataQuery = createThenableQuery({ data: [{ alumno_id: 713 }], error: null });
const mockFrom = jest.fn();
const adminFromMock = jest.fn();

jest.mock("../src/repos/auditoria/auditoria.service", () => ({
  AuditoriaService: jest.fn().mockImplementation(() => ({
    guardarAuditoria: guardarAuditoriaMock,
  })),
}));

jest.mock("../src/repos/auditoria/trazabilidadRepository", () => ({
  TrazabilidadRepository: jest.fn(),
}));

jest.mock("../src/core/services/supabaseClient", () => ({
  SupabaseClientService: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockReturnValue({
      from: mockFrom,
    }),
  })),
}));

jest.mock("../src/helpers/Response", () => ({
  FormatResponse: jest.fn(),
}));

jest.mock("../src/helpers/ErrorResponse", () => ({
  errorHandler: {
    handleError: jest.fn(),
  },
}));

import { Request, Response } from "express";
import { AlumnosService } from "../src/infrestructure/server/alumno/AlumnoService";
import { FormatResponse } from "../src/helpers/Response";

describe("AlumnosService.obtener", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValueOnce(countQuery).mockReturnValueOnce(dataQuery);
    adminFromMock
      .mockReturnValueOnce(permissionQuery)
      .mockReturnValueOnce(countQuery)
      .mockReturnValueOnce(dataQuery);
  });

  it("uses the admin client and filters colegio 0 as a real colegio", async () => {
    const req = {
      query: {
        colegio_id: "0",
        activo: "true",
        page: "1",
        perPage: "25",
      },
      user: { usuario_id: 4210 },
      supabaseAdmin: { from: adminFromMock },
      ip: "::1",
    } as any as Request;
    const res = {} as Response;

    await AlumnosService.obtener(req, res);

    expect(adminFromMock).toHaveBeenCalledTimes(3);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(permissionQuery.eq).toHaveBeenCalledWith("usuario_id", 4210);
    expect(permissionQuery.eq).toHaveBeenCalledWith("activo", true);
    expect(countQuery.eq).toHaveBeenCalledWith("colegio_id", 0);
    expect(dataQuery.eq).toHaveBeenCalledWith("colegio_id", 0);
    expect(guardarAuditoriaMock).toHaveBeenCalledWith({
      tipo_auditoria_id: 3,
      colegio_id: 0,
      fecha: expect.any(Date),
      usuario_id: 4210,
      descripcion: "Usuario consulto lista de alumnos del colegio 0",
      modulo_afectado: "alumnos",
      accion_realizada: "consultar_lista",
      ip_origen: "::1",
      model: "alumnos",
      referencia_id: 0,
    });
    expect(FormatResponse).toHaveBeenCalled();
  });
});
