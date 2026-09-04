import { Request, Response } from "express";
import { Auditoria } from "../../../core/modelo/auth/Auditoria";
import { DataService } from "../DataService";

import { AuditoriaSchema } from "./sheman/AuditoriaSchema";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { errorHandler } from "../../../helpers/ErrorResponse";

const dataService: DataService<Auditoria> = new DataService(
  "auditorias",
  "auditoria_id"
);
export const AuditoriaesService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const auditoria = await dataService.getAll(["*"], where);
      return FormatResponse(res, STATUS_CODES.OK, auditoria);
    } catch (error) {
      errorHandler.handleError(error, res, "AuditoriaesService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    let isSendRequest = true;
    try {
      const { isSend = true, ...rest } = req.body;
      isSendRequest = isSend;
      const auditoria: Auditoria = new Auditoria();
      Object.assign(auditoria, rest);
      let responseSent = false;
      const { error: validationError } = AuditoriaSchema.validate(rest);
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedauditoria = await dataService.processData(auditoria);
        if (isSend) res.status(201).json(savedauditoria);
      }
    } catch (error) {
      if (isSendRequest) {
        errorHandler.handleError(error, res, "AuditoriaesService.guardar");
      } else {
        console.error("Error silencioso en AuditoriaesService.guardar:", error);
      }
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const auditoria: Auditoria = new Auditoria();
      Object.assign(auditoria, req.body);
      let responseSent = false;
      const { error: validationError } = AuditoriaSchema.validate(req.body);
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, auditoria);
        return FormatResponse(res, STATUS_CODES.OK, {
          message: "auditoria actualizada correctamente",
        });
      }
    } catch (error) {
      errorHandler.handleError(error, res, "AuditoriaesService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "auditoria eliminada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AuditoriaesService.eliminar");
    }
  },
};
