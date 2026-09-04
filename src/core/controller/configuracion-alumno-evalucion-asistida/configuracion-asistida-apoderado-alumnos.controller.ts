import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../infrestructure/server/avisos/types/types";
import { ConfiguracionAsistidaApoderadoAlumnoService } from "../../services/apoderado/configuracion-asistida-apoderado-alumno.service";
import { Request, Response } from "express";

export class ConfiguracionAsistidaApoderadoAlumnosController {
  private configuracionAsistida: ConfiguracionAsistidaApoderadoAlumnoService;
  constructor() {
    this.configuracionAsistida =
      new ConfiguracionAsistidaApoderadoAlumnoService();
  }

  async configuracionAlumno(req: Request, res: Response) {
    try {
      const { body } = req;
      const data =
        await this.configuracionAsistida.configuracionAsistidaApoderadoAlumno(
          body
        );
      FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "ConfiguracionAsistidaApoderadoAlumnosController.configuracionAsistidaApoderadoAlumno"
      );
    }
  }
}
