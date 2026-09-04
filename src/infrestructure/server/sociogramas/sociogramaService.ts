import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { listarRespuestasSociograma } from "./sociogramaRepository";

export const SociogramaService = {
  async listarRespuestasSociograma(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { pregunta_id } = req.query;

      if (!id || isNaN(Number(id))) {
        return FormatResponse(res, 400, { mensaje: "id de encuesta requerido y debe ser numérico" });
      }

      // Manejar pregunta_id como array o single
      const preguntaIds = Array.isArray(pregunta_id) ? pregunta_id.map(p => Number(p)) : [Number(pregunta_id)];

      if (!preguntaIds.length || preguntaIds.some(isNaN)) {
        return FormatResponse(res, 400, { mensaje: "pregunta_id requerido y debe ser numérico" });
      }

      const data = await listarRespuestasSociograma(Number(id), preguntaIds);

      // Procesar datos para nodes y edges
      const nodesMap = new Map<number, { id: string; label: string }>();
      const edges: { id: string; source: string; target: string; label: string }[] = [];

      data.forEach((row: any) => {
        if (row.alumno_id_origen && row.nombre_origen) {
          nodesMap.set(row.alumno_id_origen, { id: row.alumno_id_origen.toString(), label: row.nombre_origen });
        }
        if (row.alumno_id_destino && row.nombre_destino) {
          nodesMap.set(row.alumno_id_destino, { id: row.alumno_id_destino.toString(), label: row.nombre_destino });
        }
        if (row.alumno_id_origen && row.alumno_id_destino) {
          const edgeId = `${row.alumno_id_origen}-${row.alumno_id_destino}`;
          edges.push({
            id: edgeId,
            source: row.alumno_id_origen.toString(),
            target: row.alumno_id_destino.toString(),
            label: "Relación" // Puedes ajustar según necesidad
          });
        }
      });

      const nodes = Array.from(nodesMap.values());

      return FormatResponse(res, 200, { nodes, edges });
    } catch (err) {
      errorHandler.handleError(err, res, "SociogramaService.listarRespuestasSociograma");
    }
  },
};