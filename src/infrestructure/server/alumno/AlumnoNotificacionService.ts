import { Request, Response } from "express";
import { DataService } from "../DataService";
import { AlumnoNotificacion } from "../../../core/modelo/alumno/AlumnoNotificacion";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
 
 
import { errorHandler } from "../../../helpers/ErrorResponse";
import { AlumnoNotificacionBusiness } from "./funciones/AlumnosNotificaciones/services";
import { FormatResponse } from "../../../helpers/Response";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<AlumnoNotificacion> = new DataService(
  "alumnos_notificaciones",
  "alumno_notificacion_id"
);

export const AlumnoNotificacionService = {
   async obtener(req: Request, res: Response) {
    try {
      const alumnoNotificacion = await AlumnoNotificacionBusiness.obtener(client, req.query);
      return FormatResponse(res, 200, alumnoNotificacion);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoNotificacionController.obtener");
    }
  },
  async guardar(req: Request, res: Response) {
    try {
      const alumnoNotificacion = await AlumnoNotificacionBusiness.guardar(client, req.body, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });
      res.status(201).json(alumnoNotificacion);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoNotificacionController.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alumnoNotificacion = await AlumnoNotificacionBusiness.actualizar(client, id, req.body, {
        actualizado_por: req.actualizado_por,
      });
      res.status(200).json({
        message: "Notificación del alumno actualizada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoNotificacionController.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlumnoNotificacionBusiness.eliminar(client, id);
      res.status(200).json(result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoNotificacionController.eliminar");
    }
  },
};
