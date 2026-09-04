import { Request, Response } from "express";
import { EvalucionAsistidaService } from "../../services/evalucion-asistida/evalucion-asistida.service";
import { errorHandler } from "../../../helpers/ErrorResponse";

import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../infrestructure/server/avisos/types/types";

export class EvalAsistidaController {
  private encuestasService: EvalucionAsistidaService;

  constructor() {
    this.encuestasService = new EvalucionAsistidaService();
  }
  async catalogos(req: Request, res: Response) {
    try {
      const { escuela_id } = req.query;
      const data = await this.encuestasService.catalogos(Number(escuela_id));
      FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        data: data,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "EncuestasController.catalogos");
    }
  }

  async evaluncionAsistidad(req: Request, res: Response) {
    try {
      const { curso_id, eventos_preguntas_id, fecha_encuetada } = req.query;

      const data = await this.encuestasService.evaluacionAsistida(
        Number(curso_id),
        Number(eventos_preguntas_id),
        fecha_encuetada as string
      );
      return FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "EncuestasService.get");
    }
  }

  async guardarRespuesta(req: Request, res: Response) {
    try {
      const data = await this.encuestasService.guardarYactulizacion(req.body);
      return FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "EncuestasService.get");
    }
  }

  async guardar(req: Request, res: Response) {
    try {
      const data = await this.encuestasService.guardar(req.body);
      return FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "EncuestasService.get");
    }
  }

  async eventoAlumnoInformacion(req: Request, res: Response) {
    try {
      const { alumno_id } = req.query;

      const data = await this.encuestasService.obtenerFichaAlumno(Number(alumno_id));
      return FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "EncuestasService.get");
    }
  }
}
