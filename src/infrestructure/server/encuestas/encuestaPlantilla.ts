import { NextFunction, Request, Response } from "express";
import { FormatResponse } from "../../../helpers/Response";
import {
    fetchAlternativasPlantilla,
    fetchPlantillasPorTipo,
    fetchPreguntasPlantilla,
} from "./plantillaRepository";

export const EncuestaPlantillaService = {
  async tipoEncuestaPlantillas(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const tipoId = Number(req.params.id);

      if (!tipoId || Number.isNaN(tipoId)) {
        return FormatResponse(res, 400, { mensaje: "Parámetro id inválido" });
      }

      const data = await fetchPlantillasPorTipo(tipoId);

      const templates = data.map((p: any) => ({
        id: p.plantilla_id,
        nombre: p.plantilla_nombre,
      }));

      return FormatResponse(res, 200, { templates });
    } catch (err) {
      return FormatResponse(res, 500, { mensaje: "Error listando plantillas" });
    }
  },

  async plantillaPreguntas(req: Request, res: Response, next: NextFunction) {
    try {
      const plantillaId = Number(req.params.id);

      if (Number.isNaN(plantillaId)) {
        return FormatResponse(res, 400, { mensaje: "Parámetro id inválido" });
      }

      const preguntasDB = await fetchPreguntasPlantilla(plantillaId);

      if (preguntasDB.length === 0) {
        return FormatResponse(res, 200, { preguntas: [] });
      }

      const idsPreguntas = preguntasDB.map((p: any) => p.plantilla_pregunta_id);
      const alternativasDB = await fetchAlternativasPlantilla(idsPreguntas);

      const mapAlternativas = new Map<number, any[]>();
      alternativasDB.forEach((alt: any) => {
        if (!mapAlternativas.has(alt.plantilla_pregunta_id)) {
          mapAlternativas.set(alt.plantilla_pregunta_id, []);
        }
        mapAlternativas.get(alt.plantilla_pregunta_id)!.push({
          id: alt.plantilla_alternativa_id,
          texto: alt.alternativa_texto,
          peso: alt.peso,
          orden: alt.orden,
        });
      });

      const preguntas = preguntasDB.map((p: any) => ({
        titulo: p.pregunta_texto,
        tipo_id: p.tipo_pregunta_id,
        posibles_respuestas: mapAlternativas.get(p.plantilla_pregunta_id) || [],
      }));

      return FormatResponse(res, 200, { preguntas });
    } catch (err) {
      return FormatResponse(res, 500, {
        mensaje: "Error obteniendo preguntas",
      });
    }
  },
};
