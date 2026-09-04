// src/services/AlumnoAlertaBitacoraService.ts
 
import e, { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlumnoAlertaBitacoraBusiness } from "./funciones/AlumnoAlertaBitacora/AlumnoAlertaBitacoraBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoAlertaBitacoraService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query; // Puedes refinar los filtros aquí
      const bitacoras = await AlumnoAlertaBitacoraBusiness.obtener(
        client,
        where
      );
      FormatResponse(res, 200, bitacoras);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoAlertaBitacoraService.obtener"
      );
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedBitacora = await AlumnoAlertaBitacoraBusiness.guardar(
        client,
        req.body,
        {
          creado_por: req.creado_por,
          actualizado_por: req.actualizado_por,
        },
        req.supabase
      ); // Se pasa el cliente de Supabase para la subida de archivos

      FormatResponse(res, 201, savedBitacora);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoAlertaBitacoraService.guardar"
      );
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "ID no válido." });
      }

      const result = await AlumnoAlertaBitacoraBusiness.actualizar(
        client,
        id,
        req.body,
        {
          actualizado_por: req.actualizado_por,
        },
        req.supabase
      );

      FormatResponse(res, 200, result);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoAlertaBitacoraService.actualizar"
      );
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "ID no válido." });
      }

      const result = await AlumnoAlertaBitacoraBusiness.eliminar(id);
      FormatResponse(res, 200, result);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoAlertaBitacoraService.eliminar"
      );
    }
  },
};
