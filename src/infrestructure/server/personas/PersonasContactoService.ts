import { Request, Response } from "express";
import { DataService } from "../DataService";
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { PersonaContacto } from "../../../core/modelo/PersonaContacto";
import { queryPersonasContanto } from "./query/perosnasContanto/personasQuery";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { actualizarPersonaContactoService } from "./funciones/persona_contactato/actualizar";
import { guardarPersonaContactoService } from "./funciones/persona_contactato/guardar";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<PersonaContacto> = new DataService(
  "personas_contactos",
  "persona_contacto_id"
);

export const PersonaContactosService = {
  async obtener(req: Request, res: Response) {

    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const personacontactos = await dataService.getAll(
        queryPersonasContanto,
        where
      );
       
        FormatResponse(res, STATUS_CODES.OK, personacontactos);
    } catch (error) {
      errorHandler.handleError(error, res, "PersonasService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const contactoData = req.body;
      const creadoPor = req.creado_por;
      const actualizadoPor = req.actualizado_por;
      const SupabaseClient = req.supabase;

      // Llama al servicio y delega la lógica de negocio.
      const savedPersonaContacto = await guardarPersonaContactoService(
        contactoData,
        creadoPor,
        actualizadoPor,
        SupabaseClient,
        dataService
      );
      return FormatResponse(res, STATUS_CODES.CREATED, savedPersonaContacto);
    } catch (err) {
      errorHandler.handleError(err, res, "PersonaContactosService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const contactoData = req.body;
      const actualizadoPor = req.actualizado_por;
      const SupabaseClient = req.supabase;

      // Llama al servicio, que contiene toda la lógica de negocio.
      const result = await actualizarPersonaContactoService(
        id,
        contactoData,
        actualizadoPor,
        SupabaseClient,
        dataService
      );
      return FormatResponse(res, STATUS_CODES.OK, result);
    } catch (err) {
      errorHandler.handleError(err, res, "PersonaContactosService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "PersonaContacto eliminado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PersonaContactosService.eliminar");
    }
  },
};
