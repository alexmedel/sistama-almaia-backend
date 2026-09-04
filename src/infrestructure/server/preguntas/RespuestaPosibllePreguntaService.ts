import { Request, Response } from "express";

import { DataService } from "../DataService";
import { RespuestaPosiblePregunta } from "../../../core/modelo/preguntasRespuestas/RespuestaPosiblePregunta";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const RespuestaPosiblePreguntaSchema = Joi.object({
  respuesta_posible_id: Joi.number().integer().required(),
  pregunta_id: Joi.number().integer().required(),
});
const dataService: DataService<RespuestaPosiblePregunta> = new DataService(
  "respuestas_posibles_has_preguntas", "respuesta_posible_id"
);
export const RespuestaPosiblePreguntaService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const respuestasPosiblesPorPregunta = await dataService.getAll(
        [
          "*",
          "preguntas(pregunta_id,texto_pregunta)",
          "respuestas_posibles(respuesta_posible_id,nombre)",
        ],
        where
      );
      res.json(respuestasPosiblesPorPregunta);
    } catch (error) {
      console.error("Error al obtener la respuestaposible:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
     try {
       const respuestaposible: RespuestaPosiblePregunta = new RespuestaPosiblePregunta();
       Object.assign(respuestaposible, req.body);
       respuestaposible.creado_por = req.creado_por;
       respuestaposible.actualizado_por = req.actualizado_por;
       let responseSent = false;
       const { error: validationError } = RespuestaPosiblePreguntaSchema.validate(req.body);
       const { data, error } = await client
         .from("respuestas_posibles")
         .select("*")
         .eq("respuesta_posible_id", respuestaposible.respuesta_posible_id)
         .single();
       if (error || !data) {
         throw new Error("La respuesta no existe");
       }
       const { data: dataNivelesEducativos, error: errorNilesEducativos } =
         await client
           .from("preguntas")
           .select("*")
           .eq("pregunta_id", respuestaposible.pregunta_id)
           .single();
       if (errorNilesEducativos || !dataNivelesEducativos) {
         throw new Error("La pregunta no existe");
       }
       if (validationError) {
         responseSent = true;
         throw new Error(validationError.details[0].message);
       }
       if (!responseSent) {
         const savedPregunta = await dataService.processData(respuestaposible);
         res.status(201).json(savedPregunta);
       }
     } catch (error) {
       console.error("Error al guardar el pregunta:", error);
       res.status(500).json({ message: "Error interno del servidor" });
     }
   },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const respuestaposible: RespuestaPosiblePregunta = new RespuestaPosiblePregunta();
       Object.assign(respuestaposible, req.body);
       respuestaposible.creado_por = req.creado_por;
       respuestaposible.actualizado_por = req.actualizado_por;
       let responseSent = false;
       const { error: validationError } = RespuestaPosiblePreguntaSchema.validate(req.body);
       const { data, error } = await client
         .from("respuestas_posibles")
         .select("*")
         .eq("respuesta_posible_id", respuestaposible.respuesta_posible_id)
         .single();
       if (error || !data) {
         throw new Error("La respuesta no existe");
       }
       const { data: dataNivelesEducativos, error: errorNilesEducativos } =
         await client
           .from("preguntas")
           .select("*")
           .eq("pregunta_id", respuestaposible.pregunta_id)
           .single();
       if (errorNilesEducativos || !dataNivelesEducativos) {
         throw new Error("La pregunta no existe");
       }
       if (validationError) {
         responseSent = true;
         throw new Error(validationError.details[0].message);
       }
       if (!responseSent) {
      await dataService.updateById(id, respuestaposible);
      res
        .status(200)
        .json({ message: "RespuestaPosible actualizada correctamente" });
       }




    } catch (error) {
      console.error("Error al actualizar la respuestaposible:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "Respuesta Posible eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la respuestaposible:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
