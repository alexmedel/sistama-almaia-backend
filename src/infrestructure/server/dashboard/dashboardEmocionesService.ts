import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { obtenerClienteRequest, resolverColegioDashboard } from "./dashboardAuth";

export interface IEmotionBarChart {
  nombre: string;
  positivos: number;
  negativos: number;
  neutrales: number;
  conotacion: string;
  color: string | null;
  total: number;
  cantidad_preguntas: number;
}

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

export const DashboardEmocionesService = {

  async obtenerTopDiagnosticosPorTipo(req: Request, res: Response) {
    try {
      const { tipo, fecha, colegio_id } = req.query;
      if (!tipo || (tipo !== 'negativo' && tipo !== 'positivo' && tipo !== 'neutro')) {
        return FormatResponse(res, 400, "Tipo requerido: 'negativo' o 'positivo' o 'neutro'");
      }
      const conotaciones =
        tipo === 'negativo' ? ['Negativa'] :
        tipo === 'neutro' ? ['Neutra'] :
        ['Positiva'];
      const fechaUsar = fecha ? fecha as string : new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const limite = 5;

      const { data, error } = await requestClient.rpc(
        "top_diagnosticos_por_connotacion_emocion",
        {
          p_limit: limite,
          p_conotaciones: conotaciones,
          p_fecha: fechaUsar,
          p_colegio_id: colegioId,
        }
      );

      if (error) {
        console.error("Error al obtener top diagnósticos:", error);
        return FormatResponse(res, 500, "Error interno del servidor");
      }

      const mappedData: IEmotionBarChart[] = data.map((item: any) => ({
        nombre: item.diagnostico,
        positivos: item.respuestas_positivas,
        negativos: item.respuestas_negativas,
        neutrales: item.respuestas_neutras,
        conotacion: item.conotacion_emocion,
        color: item.color ?? null,
        total: Number(item.total_respuestas ?? 0),
        cantidad_preguntas: Number(item.cantidad_preguntas ?? 0),
      }));

      return FormatResponse(res, 200, mappedData);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardEmocionesService.obtenerTopDiagnosticosPorTipo"
      );
    }
  },
};
