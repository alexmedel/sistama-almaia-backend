import { Request, Response } from "express";
import { AuditoriaService } from "./auditoria.service";
import { TrazabilidadType } from "./trazabilidadRepository";
import { FormatResponse } from "../../helpers/Response";
import { errorHandler } from "../../helpers/ErrorResponse";
import { STATUS_CODES } from "../../core/interface/reponse";

export class AuditoriaController {
  // 1. Declaración de la propiedad.
  // ¡Se elimina la palabra clave 'private' de aquí, ya que se declara en el constructor!
  private auditoriaService: AuditoriaService;

  // 2. CORRECCIÓN DEL CONSTRUCTOR: Ahora recibe la dependencia y la asigna.
  constructor(auditoriaService: AuditoriaService) {
    this.auditoriaService = auditoriaService;
 
  }

  async test(
    req: Request,
    res: Response
  ) {
    try {
      const result = await this.auditoriaService.test();
      FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AuditoriaController.test");
    }
  }
  async guardarAuditoria(
    req: Request,
    res: Response
  )  {
    // Desestructuración de los campos necesarios
    const {
      tipo_auditoria_id,
      colegio_id,
      usuario_id,
      descripcion,
      modulo_afectado,
      accion_realizada,
    } = req.body;
    console.log(req.body);
    const campoFaltante = (value: unknown) =>
      value === undefined || value === null || value === "";
    // 2. VALIDACIÓN RÁPIDA
    if (
      campoFaltante(tipo_auditoria_id) ||
      campoFaltante(colegio_id) ||
      campoFaltante(usuario_id) ||
      campoFaltante(descripcion) ||
      campoFaltante(modulo_afectado) ||
      campoFaltante(accion_realizada)
    ) {
      // Si falta alguno de los campos críticos, responde con un error 400 Bad Request
        res.status(400).json({
       
        error: "Faltan campos obligatorios para registrar la auditoría.",
        camposRequeridos: [
          "tipo_auditoria_id",
          "colegio_id",
          "usuario_id",
          "descripcion",
          "modulo_afectado",
          "accion_realizada",
        ],
      });
      return;
    }

    try {
      const result = await this.auditoriaService.guardarAuditoria(req.body);

      // Devuelve una respuesta 201 Created y el resultado del servicio
      FormatResponse(res, 201, result);  
    } catch (error) {
      console.error("[AuditoriaController Error]", error);

      // Manejo de error
      errorHandler.handleError(
        
        error,
        res,
        "AuditoriaController.guardarAuditoria"
      );
    }
  }
}
