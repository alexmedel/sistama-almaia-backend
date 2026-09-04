/* eslint-disable @typescript-eslint/no-unused-vars */
import { SupabaseClient } from "@supabase/supabase-js";
import { startOfDay, subDays } from "date-fns";
import { NextFunction, Request, Response } from "express";
import { CalendarioFechaImportante } from "../../../core/modelo/colegio/CalendarioFechaImportante";
import { DonutData } from "../../../core/modelo/dashboard/DonutData";
import { Emotion } from "../../../core/modelo/dashboard/Emotion";
import { AlertStats } from "../../../core/modelo/home/AlertStats";
import { ALERT_TYPES } from "../../../core/modelo/home/AlertType";
import { AlertasServicioCasoUso } from "../../../core/services/AlertasServiceCasoUso";
import { AlumnoServicioCasoUso } from "../../../core/services/AlumnoServicioCasoUso";
import {
  mapEmotions,
  mapPatologia,
} from "../../../core/services/DashboardServiceCasoUso";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { DataService } from "../DataService";
import { obtenerClienteRequest, resolverColegioDashboard } from "./dashboardAuth";
import { fechasImportantesShema } from "./shema/fechasImportantesShema";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<CalendarioFechaImportante> = new DataService(
  "calendarios_fechas_importantes",
  "calendario_fecha_importante_id"
);

export const DashboardHomeService = {
  async getStatsCards(req: Request, res: Response, next: NextFunction) {
    try {
      const requestClient = obtenerClienteRequest(req, client);
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7)).toISOString();
      const colegio_id = await resolverColegioDashboard(req, requestClient);

      const alumnoServicioCasoUso = new AlumnoServicioCasoUso(colegio_id, requestClient);

      const [totalAlumnos, alumnosActivos] = await Promise.all([
        alumnoServicioCasoUso.obtenerCantidadAlumnos(colegio_id),
        alumnoServicioCasoUso.obtenerAlumnosActivos(colegio_id),
      ]);
      // Obtener datos de actividad
      const responses = await alumnoServicioCasoUso.calcularAlumnosActivos(
        sevenDaysAgo
      );
      const alertas_services_caso_uso = new AlertasServicioCasoUso(requestClient);

      const sosStats = await alertas_services_caso_uso.getAlertStatsByType(
        ALERT_TYPES.SOS,
        colegio_id
      );

      const denunciaStats = await alertas_services_caso_uso.getAlertStatsByType(
        ALERT_TYPES.DENUNCIA,
        colegio_id
      );

      const amarillaStats = await alertas_services_caso_uso.getAlertStatsByType(
        ALERT_TYPES.ALMARILLA,
        colegio_id
      );

      const naranjaStats = await alertas_services_caso_uso.getAlertStatsByType(
        ALERT_TYPES.NARANJA,
        colegio_id
      );

      const rojaStats = await alertas_services_caso_uso.getAlertStatsByType(
        ALERT_TYPES.ROJA,
        colegio_id
      );

     
      // const [denunciaStats, amarillaStats, naranjaStats, rojaStats] =
      //   await Promise.all([
      //     alertas_services_caso_uso.getAlertStatsByType(
      //       ALERT_TYPES.DENUNCIA,
      //       colegio_id
      //     ),
      //     alertas_services_caso_uso.getAlertStatsByType(
      //       ALERT_TYPES.ALMARILLA,
      //       colegio_id
      //     ),
      //     alertas_services_caso_uso.getAlertStatsByType(
      //       ALERT_TYPES.NARANJA,
      //       colegio_id
      //     ),
      //     alertas_services_caso_uso.getAlertStatsByType(
      //       ALERT_TYPES.ROJA,
      //       colegio_id
      //     ),
      //   ]);
      const alumnosFrecuentes =
        alumnoServicioCasoUso.calcularAlumnosFrecuentes(responses);
      const almaStats: AlertStats = {
        totales:
          amarillaStats.totales + naranjaStats.totales + rojaStats.totales,
        activos:
          amarillaStats.activos + naranjaStats.activos + rojaStats.activos,
        vencidos:
          amarillaStats.vencidos + naranjaStats.vencidos + rojaStats.vencidos,
        por_vencer:
          amarillaStats.por_vencer +
          naranjaStats.por_vencer +
          rojaStats.por_vencer,
      };
      const response = {
        alumnos: {
          activos: alumnosActivos ?? 0,
          inactivos: (totalAlumnos ?? 0) - (alumnosActivos ?? 0),
          frecuentes: alumnosFrecuentes,
          totales: totalAlumnos ?? 0,
        },
        sos_alma: sosStats,
        denuncias: denunciaStats,
        alertas_alma: almaStats,
      };
      return FormatResponse(res, 200, response);
    } catch (err) {
      errorHandler.handleError(err, res, "DashboardHomeService.getStatsCards");
    }
  },
  async getEmotionData(req: Request, res: Response, next: NextFunction) {
    const data: Emotion[] = [
      { name: "Tristeza", value: 1500, color: "#3b82f6" },
      { name: "Felicidad", value: 3000, color: "#facc15" },
      { name: "Estrés", value: 1000, color: "#6b7280" },
      { name: "Ansiedad", value: 2500, color: "#fb923c" },
      { name: "Enojo", value: 800, color: "#ef4444" },
      { name: "Otros", value: 2000, color: "#a855f7" },
    ];
    res.json(data);
  },
  getEmotionsData(req: Request, res: Response) {
    const emotions = [
      { name: "Tristeza", value: 1500, color: "#29B6F6" },
      { name: "Felicidad", value: 3100, color: "#FFCA28" },
      { name: "Estrés", value: 950, color: "#757575" },
      { name: "Ansiedad", value: 2600, color: "#FFA726" },
      { name: "Enojo", value: 750, color: "#F44336" },
      { name: "Otros", value: 1900, color: "#BA68C8" },
    ];

    res.json({ emotions });
  },

  // Función para obtener emociones generales
  async getEmotionDataGeneral(req: Request, res: Response) {
    try {
      const { fecha_hasta } = req.query;
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const { data: data_emociones, error } = await requestClient.rpc(
        "obtener_cantidades_pregunta_3",
        {
          p_colegio_id: colegioId,
          p_fecha_hasta: fecha_hasta || undefined,
        }
      );
      if (error) {
        console.error("Error al obtener cantidades:", error);
        throw error;
      }
      const data = mapEmotions(data_emociones);
      return FormatResponse(res, 200, data);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardHomeService.getEmotionDataGeneral"
      );
    }
  },

  async getEmotionDataPatologia(req: Request, res: Response) {
    try {
      const { fecha_hasta } = req.query;
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const { data: data_emociones, error } = await requestClient.rpc(
        "obtener_cantidades_por_diagnostico",
        {
          p_colegio_id: colegioId,
          p_fecha_hasta: fecha_hasta || undefined,
          p_tipo_concepto: "Patologica",
        }
      );
      if (error) {
        console.error("Error al obtener cantidades:", error);
        throw error;
      }
      const data = mapPatologia(data_emociones);
      return FormatResponse(res, 200, data);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardHomeService.getEmotionDataPatologia"
      );
    }
  },

  async getEmotionDataNeurodivergencia(req: Request, res: Response) {
    try {
      const { fecha_hasta } = req.query;
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const { data: data_emociones, error } = await requestClient.rpc(
        "obtener_cantidades_por_diagnostico",
        {
          p_colegio_id: colegioId,
          p_fecha_hasta: fecha_hasta || undefined,
          p_tipo_concepto: "Neurodivergencia",
        }
      );
      if (error) {
        console.error("Error al obtener cantidades:", error);
        throw error;
      }
      const data = mapPatologia(data_emociones);
      return FormatResponse(res, 200, data);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardHomeService.getEmotionDataNeurodivergencia"
      );
    }
  },

  // Función para datos de gráfico circular
  async getDonutData(req: Request, res: Response) {
    const requestClient = obtenerClienteRequest(req, client);
    const colegioId = await resolverColegioDashboard(req, requestClient);
    const alertas_services_caso_uso = new AlertasServicioCasoUso(requestClient);

    const data: DonutData[] =
      await alertas_services_caso_uso.getAlertasDonutData(colegioId);
    res.json(data);
  },

  // Función para fechas importantes
  async getImportantDates(req: Request, res: Response) {
    try {
      const requestClient = obtenerClienteRequest(req, client);
      await resolverColegioDashboard(req, requestClient);
      dataService.setClient(requestClient);
      const fechasImportantes = await dataService.getAll(
        fechasImportantesShema,
        req.query
      );
      return FormatResponse(res, 200, fechasImportantes);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardHomeService.getImportantDates"
      );
    }
  },

  // Función para alertas recientes
  async getRecentAlerts(req: Request, res: Response) {
    try {
      const { dias_historial } = req.query;
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const { data, error } = await requestClient.rpc("obtener_alertas_por_colegio", {
        p_colegio_id: colegioId,
        p_dias_historial: dias_historial || 10,
      });
      if (error) {
        console.error(error.message);
        throw error;
      }
      return FormatResponse(res, 200, data);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardHomeService.getRecentAlerts"
      );
    }
  },
};
