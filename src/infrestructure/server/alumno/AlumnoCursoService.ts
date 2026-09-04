// src/services/AlumnoCursoService.ts
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlumnoCursoBusiness } from "./funciones/AlumnoCurso/AlumnoCursoBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoCursoService = {
  async obtener(req: Request, res: Response) {
    try {
      const alumnoCurso = await AlumnoCursoBusiness.obtener(client, req.query);
      FormatResponse(res, 200, alumnoCurso);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoCursoService.obtener");
    }
  },
  async guardar(req: Request, res: Response) {
    try {
      const savedAlumnoCurso = await AlumnoCursoBusiness.guardar(
        client,
        req.body,
        {
          creado_por: req.creado_por,
          actualizado_por: req.actualizado_por,
        }
      );
      FormatResponse(res, 201, savedAlumnoCurso);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoCursoService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          res.status(400).json({ message: "ID de registro no válido." });
      }
      await AlumnoCursoBusiness.actualizar(client, id, req.body, {
        actualizado_por: req.actualizado_por,
      });
      FormatResponse(res, 200, {
        message: "Curso del alumno actualizado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoCursoService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          res.status(400).json({ message: "ID de registro no válido." });
      }
      const result = await AlumnoCursoBusiness.eliminar(client, id);
      FormatResponse(res, 200, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoCursoService.eliminar");
    }
  },
};
