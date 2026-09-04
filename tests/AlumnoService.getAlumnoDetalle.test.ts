 
const guardarAuditoriaMock = jest.fn();

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
    getClient: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock("../src/infrestructure/server/DataService", () => ({
  DataService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../src/infrestructure/server/alumno/funciones/getAlumnoDetalle", () => ({
  obtenerDatosAlumno: jest.fn().mockResolvedValue({ alumno_id: 713 }),
  obtenerFichaClinica: jest.fn().mockResolvedValue([]),
  obtenerAlertas: jest.fn().mockResolvedValue([]),
  obtenerInformes: jest.fn().mockResolvedValue([]),
  obtenerApoderados: jest.fn().mockResolvedValue([]),
  obtenerEmociones: jest.fn().mockResolvedValue([]),
  obtenerEmocionesPromedio: jest.fn().mockResolvedValue([]),
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

describe("AlumnosService.getAlumnoDetalle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("audits the authenticated user viewing an alumno detail", async () => {
    const req = {
      params: { alumnoId: "713" },
      query: { colegio_id: "2" },
      user: { usuario_id: 4210 },
      ip: "::1",
      supabase: {},
    } as any as Request;
    const res = {} as Response;

    await AlumnosService.getAlumnoDetalle(req, res);

    expect(guardarAuditoriaMock).toHaveBeenCalledWith({
      tipo_auditoria_id: 3,
      colegio_id: 2,
      fecha: expect.any(Date),
      usuario_id: 4210,
      descripcion: "Usuario consulto detalle del alumno 713",
      modulo_afectado: "alumnos",
      accion_realizada: "consultar_detalle",
      ip_origen: "::1",
      model: "alumnos",
      referencia_id: 713,
    });
    expect(FormatResponse).toHaveBeenCalled();
  });
});
