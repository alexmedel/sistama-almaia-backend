// src/services/DocentesService.ts
 
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { DocenteBusiness } from "./funciones/DocenteBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const DocentesService = {
  async obtener(req: Request, res: Response) {
    try {
      const docentes = await DocenteBusiness.obtener(req.query);
      FormatResponse(res, STATUS_CODES.OK, docentes);
    } catch (error) {
      errorHandler.handleError(error, res, "DocentesService.obtener");
    }
  },

  async detalle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "ID de docente no válido." });
      }
      const docente = await DocenteBusiness.detalle(id);
      FormatResponse(res, STATUS_CODES.OK, docente);
    } catch (error) {
      errorHandler.handleError(error, res, "DocentesService.detalle");
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedDocente = await DocenteBusiness.guardar(client, req.body, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });
      FormatResponse(res, STATUS_CODES.CREATED, savedDocente);
    } catch (err) {
      errorHandler.handleError(err, res, "DocentesService.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "ID de docente no válido." });
      }
      await DocenteBusiness.actualizar(client, id, req.body, {
        actualizado_por: req.actualizado_por,
      });
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Docente actualizado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "DocentesService.actualizar");
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "ID de docente no válido." });
      }
      await DocenteBusiness.eliminar(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Docente eliminado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "DocentesService.eliminar");
    }
  },
};
