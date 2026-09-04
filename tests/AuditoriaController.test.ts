 
jest.mock("../src/helpers/Response", () => ({
  FormatResponse: jest.fn(),
}));

import { Request, Response } from "express";
import { AuditoriaController } from "../src/repos/auditoria/auditoria.controller";

describe("AuditoriaController.guardarAuditoria", () => {
  it("accepts colegio_id 0 as a valid required value", async () => {
    const service = {
      guardarAuditoria: jest.fn().mockResolvedValue({ auditoria_id: 1 }),
      test: jest.fn(),
    };
    const controller = new AuditoriaController(service as any);
    const req = {
      body: {
        tipo_auditoria_id: 3,
        colegio_id: 0,
        fecha: "2026-06-02T03:48:57.945Z",
        usuario_id: 4210,
        descripcion: "Usuario consulto alertas del alumno 1610",
        modulo_afectado: "alumnos",
        accion_realizada: "consultar_alertas",
        ip_origen: "127.0.0.1",
        model: "alumnos",
        referencia_id: 1610,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    await controller.guardarAuditoria(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(service.guardarAuditoria).toHaveBeenCalledWith(req.body);
  });
});
