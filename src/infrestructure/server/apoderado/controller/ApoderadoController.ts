import { Request, Response } from "express";
import { ApoderadoService } from "../ApoderadoService";
import { FormatResponse } from "../../../../helpers/Response";
import { errorHandler } from "../../../../helpers/ErrorResponse";
import { STATUS_CODES } from "../../avisos/types/types";
import { SupabaseAdminService } from "../../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
export const ApoderadoController = {
  async completarPerfil(req: Request, res: Response) {
    console.log("aqui");
    console.log(req.body);

    const { apoderado_id } = req.body;

    // Validación del parámetro
    if (!apoderado_id) {
      res.status(400).json({
        status: 400,
        message: "El campo apoderado_id es requerido",
      });
    }

    try {
      const { data, error } = await client
        .from("apoderados")
        .update({
          perfil_completado: true,
        })
        .eq("apoderado_id", apoderado_id ) // ✅ Aquí está bien
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Validar que se encontró el registro
      if (!data) {
        res.status(404).json({
          status: 404,
          message: "Apoderado no encontrado",
        });
      }

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Perfil completado correctamente",
        data,
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "ApoderadoController.completarPerfil"
      );
    }
  },
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query };
      const apoderados = await ApoderadoService.obtenerApoderados(where);
      FormatResponse(res, STATUS_CODES.OK, apoderados);
    } catch (error) {
      errorHandler.handleError(error, res, "ApoderadoController.obtener");
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedApoderado = await ApoderadoService.guardarApoderado(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      return FormatResponse(res, STATUS_CODES.CREATED, savedApoderado);
    } catch (err) {
      errorHandler.handleError(err, res, "ApoderadoController.guardar");
    }
  },

  actualizar: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedApoderado = await ApoderadoService.actualizarApoderado(
        id,
        req.body,
        req.actualizado_por
      );
      return FormatResponse(res, STATUS_CODES.OK, updatedApoderado);
    } catch (error) {
      errorHandler.handleError(error, res, "ApoderadoController.actualizar");
    }
  },

  async responderPreguntas(req: Request, res: Response) {
    try {
      const result = await ApoderadoService.responderPreguntas(req.body);
      FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "ApoderadoController.responderPreguntas"
      );
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await ApoderadoService.eliminarApoderado(id);
      FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "ApoderadoController.eliminar");
    }
  },

  async obtenerPerfil(req: Request, res: Response) {
    try {
      console.log("aqui");
      const perfil = await ApoderadoService.obtenerPerfilUsuario(
        req.supabase,
        req.user.usuario_id
      );
      FormatResponse(res, STATUS_CODES.OK, perfil);
    } catch (error) {
      errorHandler.handleError(error, res, "ApoderadoController.obtenerPerfil");
    }
  },
};
