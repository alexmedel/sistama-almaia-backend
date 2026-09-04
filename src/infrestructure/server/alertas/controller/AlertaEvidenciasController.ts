import { Request, Response } from "express";
import { errorHandler } from "../../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../../helpers/Response";
import { STATUS_CODES } from "../../../../core/interface/reponse";
import { AlertaEvidenciasService } from "../AlertaEvidenciaService";
 

export const AlertaEvidenciasController = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query };
      console.log(where);
      const alertaEvidencia = await AlertaEvidenciasService.obtener(where);
      return FormatResponse(res, STATUS_CODES.OK, alertaEvidencia);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaEvidenciasController.obtener");
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedAlertaEvidencia = await AlertaEvidenciasService.guardar(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      return FormatResponse(res, STATUS_CODES.CREATED, savedAlertaEvidencia);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaEvidenciasController.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const updatedAlertaEvidencia = await AlertaEvidenciasService.actualizar(
        id,
        req.body,
        req.actualizado_por
      );
      return FormatResponse(res, STATUS_CODES.OK, updatedAlertaEvidencia);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaEvidenciasController.actualizar");
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaEvidenciasService.eliminar(id);
      return FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaEvidenciasController.eliminar");
    }
  },
};