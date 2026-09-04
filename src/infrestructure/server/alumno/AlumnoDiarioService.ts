// src/services/AlumnoDiarioService.ts
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { AlumnoDiarioBusiness } from "./funciones/AlumnoDiario/AlumnoDiarioBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { saveImage } from "../../../helpers/upload-supabase";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoDiarioService = {
  async obtener(req: Request, res: Response) {
    try {
      const alumnoDiario = await AlumnoDiarioBusiness.obtener(
        client,
        req.query
      );

      FormatResponse(res, 200, alumnoDiario);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoDiarioService.obtener");
    }
  },
  async todosLosDiarios(req: Request, res: Response) {
    try {
      const { alumno_id } = req.query;
      const { data: alumnoDiario, error } = await client
        .from("alumnos_diarios")
        .select("*")
        .eq("alumno_id", alumno_id);
      if (error) {
        throw new Error(error.message);
      }
      FormatResponse(res, 200, alumnoDiario);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoDiarioService.obtener");
    }
  },
  async guardar(req: Request, res: Response) {
    const imageUrl = await saveImage(client, req);
    console.log("imageUrl", imageUrl);
    let payload: any = {
      ...req.body,
    };

    if (imageUrl ) {
      payload = {
        ...req.body,
        imagen: imageUrl,
      };
    }
    console.log("payload", payload);
    try {
      const savedAlumnoDiario = await AlumnoDiarioBusiness.guardar(
        client,
        payload,
        {
          creado_por: req.creado_por,
          actualizado_por: req.actualizado_por,
        }
      );
      FormatResponse(res, 201, savedAlumnoDiario);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoDiarioService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    const imageUrl = await saveImage(client, req);
   
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        FormatResponse(res, 400, { message: "ID de registro no válido." });
      }
       let payload: any = {
        ...req.body,
      };
      if (imageUrl) {
        payload = {
          ...req.body,
          imagen: imageUrl,
        };
      }
       
      await AlumnoDiarioBusiness.actualizar(client, id, payload, {
        actualizado_por: req.actualizado_por,
      });
    
      FormatResponse(res, 200, {
        message: "Diario del alumno actualizado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoDiarioService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    console.log("req.params.id", req.params.id);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        FormatResponse(res, 400, { message: "ID de registro no válido." });
      }
     
      const result = await AlumnoDiarioBusiness.eliminar(client, id ,);
      FormatResponse(res, 200, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoDiarioService.eliminar");
    }
  },
};
