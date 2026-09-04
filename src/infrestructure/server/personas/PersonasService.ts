 
import { Request, Response } from "express";
import { DataService } from "../DataService";
import Joi from "joi";
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { Persona } from "../../../core/modelo/Persona";
 import {
  obtenerPersonasPorColegioYRol,
  obtenerTodasLasPersonas,
} from "./funciones/personas_service/Obtener";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { actualizarPersonaService } from "./funciones/personas_service/Actualizar";
import { guardarPersonaService } from "./funciones/personas_service/Guardar";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<Persona> = new DataService(
  "personas",
  "persona_id"
);

export const PersonasService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, rol_id, ...filtros } = req.query;
      let personas;
      if (colegio_id !== undefined || rol_id !== undefined) {
        // Llama a la función de servicio específica para colegio y rol
        personas = await obtenerPersonasPorColegioYRol(
          Number(colegio_id),
          Number(rol_id),
          req.supabase
        );
      } else {
        // Llama a la función de servicio para obtener todas las personas con filtros genéricos
        personas = await obtenerTodasLasPersonas(filtros, dataService);
      }

      return FormatResponse(res, STATUS_CODES.OK, personas ?? []);
    } catch (error) {
      errorHandler.handleError(error, res, "PersonasService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const personaData = req.body;
      const creadoPor = req.creado_por;
      const actualizadoPor = req.actualizado_por;
      const SupabaseClient = req.supabase;

      // Llama al servicio, que contiene toda la lógica de negocio
      const savedPersona = await guardarPersonaService(
        personaData,
        creadoPor,
        actualizadoPor,
        SupabaseClient,
        dataService
      );
      return FormatResponse(res, STATUS_CODES.CREATED, savedPersona);
    } catch (err) {
      errorHandler.handleError(err, res, "PersonasService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const personaData = req.body;
      const actualizadoPor = req.actualizado_por;
      const SupabaseClient = req.supabase;

      // Llama al servicio y obtiene el resultado.
      const result = await actualizarPersonaService(
        id,
        personaData,
        actualizadoPor,
        SupabaseClient,
        dataService
      );
      return FormatResponse(res, STATUS_CODES.OK, result);
    } catch (err) {
      errorHandler.handleError(err, res, "PersonasService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Persona eliminado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PersonasService.eliminar");
    }
  },
};
