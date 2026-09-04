 
import { Request, Response } from "express";
import { mapearDatos } from "../../../core/services/PerfilServiceCasoUso";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { perfiles_query } from "./querys/usuarios";
 import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
export const PerfilService = {
  async obtenerPerfil(req: Request, res: Response) {
    try {
      console.log('wwwww');
      const { data: usuario_data, error: error_usuario } = await req.supabase
        .from("usuarios")
        .select(perfiles_query)
        .eq("usuario_id", req.user.usuario_id)
        .single();
      
      if (error_usuario) {
        throw new Error(error_usuario.message);
      } 

      // Verificar que usuario_data tiene la propiedad nacionalidad_id antes de acceder
      const nacionalidadId =
        usuario_data && typeof usuario_data === "object" && "nacionalidad_id" in usuario_data
          ? (usuario_data as any).nacionalidad_id ?? 0
          : 0;

      

      const data = mapearDatos(usuario_data as any);
      const usuario = data.usuario;
      const persona = data.persona;
      const colegio = data.colegio;

      const rol = data.rol;
      const funcionalidades = data.funcionalidades;
      const docentes = data.docentes || [];

      console.log(usuario_data);

      let nombreNacionalidad: string | null = null;
      try {
        const { data: nacionalidad, error: nacionalidad_error } = await client
          .from("nacionalidades")
          .select("*")
          .eq("id", nacionalidadId)
          .single();

        if (!nacionalidad_error && nacionalidad) {
          nombreNacionalidad = nacionalidad.nombre;
        }
      } catch (nacError) {
        console.warn('[PERFIL] No se pudo obtener nacionalidad:', nacError);
      }

      return FormatResponse(res, STATUS_CODES.OK, {
        usuario,
        persona,
        rol,
        docentes,
        funcionalidades,
        colegio,
        nacionalidad: nombreNacionalidad,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PerfilService.obtenerPerfil");
    }
  },

  async obtenerPerfilApoderado(req: Request, id: number) {
    try {
      const { data: usuario_data, error: error_usuario } = await req.supabase
        .from("apoderados")
        .select(perfiles_query)
        .eq("persona_id", id)
        .single();

      if (error_usuario) {
        throw new Error(error_usuario.message);
      }
      return usuario_data;
    } catch (error) {
      //errorHandler.handleError(error, res, "PerfilService.obtenerPerfilApoderado");
    }
  },

  async obtenerOCrearConfiguracion(req: Request) {
    try {
      const { data: configuracion_data, error: error_configuracion } =
        await req.supabase
          .from("usuarios_configuracion")
          .select("configuracion_id, voz_activada")
          .eq("usuario_id", req.user.usuario_id)
          .eq("activo", true)
          .single();

      if (error_configuracion && error_configuracion.code === "PGRST116") {
        const nueva_configuracion = {
          usuario_id: req.user.usuario_id,
          voz_activada: false,
          notificaciones_activas: true,
          actualizado_por: req.user.usuario_id || 0,
          activo: true,
        };
        const { data: insert_data, error: insert_error } = await req.supabase
          .from("usuarios_configuracion")
          .insert(nueva_configuracion)
          .select("configuracion_id, voz_activada")
          .single();
        if (insert_error) {
          throw new Error(
            `Error al crear configuración: ${insert_error.message}`
          );
        }
        return insert_data;
      } else if (error_configuracion) {
        throw new Error(
          `Error al obtener configuración: ${error_configuracion.message}`
        );
      } else {
        return configuracion_data;
      }
    } catch (error) {
      console.error("Error en obtenerOCrearConfiguracion:", error);
      throw error;
    }
  },
};
