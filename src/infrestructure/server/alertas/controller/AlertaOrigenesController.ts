import { Request, Response } from "express";
import { AlertaOrigenesService } from "../AlertaOrigenService";
import { STATUS_CODES } from "../../avisos/types/types";
import { FormatResponse } from "../../../../helpers/Response";
import { errorHandler } from "../../../../helpers/ErrorResponse";
import { AlertaOrigen } from "../../../../core/modelo/alerta/AlertaOrigen";
 

export const AlertaOrigenesController = {
  async obtener(req: Request, res: Response) {
    try {
      const origenesAlertas = await AlertaOrigenesService.obtener();
      return FormatResponse(res, STATUS_CODES.OK, origenesAlertas);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaOrigenesController.obtener");
    }
  },
  
  guardar: async (req: Request, res: Response) => {
    try {
      const alertaOrigen: AlertaOrigen = req.body;
      const savedAlertaOrigen = await AlertaOrigenesService.guardar(alertaOrigen);
      return FormatResponse(res, STATUS_CODES.OK, savedAlertaOrigen);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaOrigenesController.guardar");
    }
  },
  
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alertaOrigen: AlertaOrigen = req.body;
      const updatedAlertaOrigen = await AlertaOrigenesService.actualizar(id, alertaOrigen);
      return FormatResponse(res, STATUS_CODES.OK, updatedAlertaOrigen);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaOrigenesController.actualizar");
    }
  },
  
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaOrigenesService.eliminar(id);
      return FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlertaOrigenesController.eliminar");
    }
  },
};