 
import { Request, Response } from "express";
import { Pregunta } from "../../../core/modelo/preguntasRespuestas/Pregunta";
import { DataService } from "../DataService";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";

import { preguntas_query } from "./querys/preguntasQuery";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { detalle_query } from "./querys/detalleQuery";
import { guardarPreguntaService } from "./funciones/guardar";
import { actualizarPreguntaService } from "./funciones/actulizar";
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const supabaseAdminService = new SupabaseAdminService();
const adminClient: SupabaseClient = supabaseAdminService.getClient();

const dataService: DataService<Pregunta> = new DataService("preguntas");
export const PreguntaService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const preguntas = await dataService.getAll(preguntas_query, where);
      return FormatResponse(res, STATUS_CODES.OK, preguntas);
    } catch (error) {
      errorHandler.handleError(error, res, "PreguntaService.obtener");
    }
  },

  async detalle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const where = { pregunta_id: id }; // Convertir los parámetros de consulta en filtros
      const pregunta_data = await dataService.getAll(detalle_query, where);
      const pregunta = pregunta_data[0]; 
      return FormatResponse(res, STATUS_CODES.OK, pregunta);
    } catch (error) {
      errorHandler.handleError(error, res, "PreguntaService.detalle");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const preguntaData = req.body;
      const creadoPor = req.creado_por;
      const actualizadoPor = req.actualizado_por;
      const supabaseClient = req.supabase; // Se pasa el cliente del request

      // Llama al servicio, pasándole todos los datos que necesita
      const savedPregunta = await guardarPreguntaService(
        preguntaData,
        creadoPor,
        actualizadoPor,
        supabaseClient,
        dataService
      );

      // Si todo sale bien, envía la respuesta
      return FormatResponse(res, STATUS_CODES.CREATED, savedPregunta);
    } catch (error) {
      errorHandler.handleError(error, res, "PreguntaService.guardar");
    }
  },
  actualizar: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const preguntaData = req.body;
      const actualizadoPor = req.actualizado_por;
      const supabaseClient = req.supabase;

      // Llama al servicio, que contiene toda la lógica de negocio
      const result = await actualizarPreguntaService(
        id,
        preguntaData,
        actualizadoPor,
        supabaseClient,
        dataService
      );

      // Envía la respuesta final
      return FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "PreguntaService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Pregunta eliminada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PreguntaService.eliminar");
    }
  },
  async motor_pregunta() {
    try {
      const { error } = await adminClient.rpc(
        "ejecutar_generacion_preguntas_por_colegios"
      );
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error(error.message);
      throw error;
    }
  },
  async generar_respuestas_desde_eventos() {
    try {
      const { error } = await adminClient.rpc("generar_respuestas_desde_eventos");
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error(error.message);
      throw error;
    }
  },
};

void client;
