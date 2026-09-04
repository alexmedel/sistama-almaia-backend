// src/services/AlumnoMonitoreoService.ts
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlumnoMonitoreoBusiness } from "./funciones/AlumnoMonitoreo/AlumnoMonitoreoBusiness";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";
 

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoMonitoreoService = {
  async obtener(req: Request, res: Response) {
    try {
      const alumnoMonitoreo = await AlumnoMonitoreoBusiness.obtener(client, req.query);
      return FormatResponse(res, 200, alumnoMonitoreo);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoMonitoreoService.obtener");
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const savedMonitoreo = await AlumnoMonitoreoBusiness.guardar(client, req.body);
      return FormatResponse(res, 201, savedMonitoreo);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoMonitoreoService.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          FormatResponse(res, 400, { message: "ID de registro no válido." });
      }
      const updatedMonitoreo = await AlumnoMonitoreoBusiness.actualizar(client, id, req.body);
        FormatResponse(res, 200, {
        message: "Monitoreo del alumno actualizado correctamente",
        updatedMonitoreo
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoMonitoreoService.actualizar");
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          FormatResponse(res, 400, { message: "ID de registro no válido." });
      }
      const result = await AlumnoMonitoreoBusiness.eliminar(client, id);
        FormatResponse(res, 200, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoMonitoreoService.eliminar");
    }
  },
};