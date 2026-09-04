import { Request, Response } from "express";
import type { EncuestaRespuestaDTO } from "../../../core/modelo/encuestas/encuestaRespuestaDTO";
import { insertEncuestaRespuesta, insertRespuestaItems, listRespuestasPorEncuesta } from "./encuestaRespuestaRepository";
import { EncuestaRespuestaSchema } from "./schema/encuestaRespuestaSchema";

export class EncuestaRespuestaService {
  static async crearRespuesta(req: Request, res: Response): Promise<void> {
    console.log("crear respuesta")
    console.log(req.body)
    try {
      
      const usuarioId = (req as any).user?.usuario_id;
      console.log('usuarioId', usuarioId)
      if (!usuarioId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      // const { error, value } = EncuestaRespuestaSchema.validate(req.body);
      const value = req.body
      // if (error) {
      //   res.status(400).json({ error: error.details[0].message });
      //   return;
      // }

      const respuestaData: EncuestaRespuestaDTO = value;

      // Insertar cabecera
      const cabecera = await insertEncuestaRespuesta(
        {
          encuesta_id: respuestaData.encuesta_id,
          destinatario_id: respuestaData.destinatario_id,
          tipo_destinatario_id: respuestaData.tipo_destinatario_id,
        },
        usuarioId
      );

      // Insertar items
      await insertRespuestaItems(cabecera.encuesta_respuesta_id, respuestaData.items, usuarioId);

      res.status(201).json({ message: "Respuesta creada exitosamente", id: cabecera.encuesta_respuesta_id });
    } catch (err: any) {
      console.error("Error creando respuesta:", err);
      res.status(500).json({ error: err.message });
    }
  }

  static async obtenerRespuestas(req: Request, res: Response): Promise<void> {
    try {
      const { encuesta_id } = req.query;
      if (!encuesta_id || isNaN(Number(encuesta_id))) {
        res.status(400).json({ error: "encuesta_id requerido y debe ser numérico" });
        return;
      }

      const detalle = await listRespuestasPorEncuesta(Number(encuesta_id));
      // Respondemos con la estructura agregada devuelta por la RPC
      res.json({ encuesta_detalle: detalle });
    } catch (err: any) {
      console.error("Error obteniendo respuestas:", err);
      res.status(500).json({ error: err.message });
    }
  }
}