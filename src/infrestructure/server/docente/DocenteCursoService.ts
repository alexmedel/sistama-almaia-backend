// src/services/DocenteCursosService.ts
 
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { DocenteCursoBusiness } from "./funciones/DocenteCursoBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
 

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const DocenteCursosService = {
  async obtener(req: Request, res: Response) {
    try {
      const docentesCursos = await DocenteCursoBusiness.obtener(req.query);
        FormatResponse(res, STATUS_CODES.OK, docentesCursos);
    } catch (error) {
      errorHandler.handleError(error, res, "DocenteCursosService.obtener");
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedDocenteCurso = await DocenteCursoBusiness.guardar(client, req.body, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });
        FormatResponse(res, STATUS_CODES.CREATED, savedDocenteCurso);
    } catch (err) {
      errorHandler.handleError(err, res, "DocenteCursosService.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          res.status(400).json({ message: "ID no válido." });
      }
      const result = await DocenteCursoBusiness.actualizar(client, id, req.body, {
        actualizado_por: req.actualizado_por,
      });
        FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
        errorHandler.handleError(error, res, "DocenteCursosService.actualizar");
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          res.status(400).json({ message: "ID no válido." });
      }
      const result = await DocenteCursoBusiness.eliminar(id);
        FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
        errorHandler.handleError(error, res, "DocenteCursosService.eliminar");
    }
  },
};