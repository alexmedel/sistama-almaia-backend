// src/core/services/AlumnoNotificacionBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
 import { AlumnoNotificacionSchema } from "../../shema/AlumnoNotificacionSchema";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoNotificacion } from "../../../../../core/modelo/alumno/AlumnoNotificacion";
 

/**
 * Contiene la lógica de negocio para la gestión de notificaciones de alumnos.
 */
export const AlumnoNotificacionBusiness = {
  async obtener(client: SupabaseClient, query: any) {
    const { colegio_id, ...where } = query;
    
    if (colegio_id !== undefined) {
      return await obtenerRelacionados({
        tableFilter: "alumnos",
        filterField: "colegio_id",
        filterValue: colegio_id,
        idField: "alumno_id",
        tableIn: "alumnos_notificaciones",
        inField: "alumno_id",
        selectFields: `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))`,
      });
    }

    const { data, error } = await client.from("alumnos_notificaciones").select(`
      *,
      alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos,fecha_nacimiento))
    `).match(where);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  async guardar(client: SupabaseClient, body: any, metaData: { creado_por: number; actualizado_por: number }) {
    // 1. Validar los datos de entrada
    const { error: validationError, value } = AlumnoNotificacionSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    
    const { data: alumno, error: alumnoError } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", value.alumno_id)
      .single();

    if (alumnoError || !alumno) {
      throw new Error("El alumno no existe");
    }

    const alumnoNotificacion: AlumnoNotificacion = {
      ...value,
      creado_por: metaData.creado_por,
      actualizado_por: metaData.actualizado_por
    };

    const { data: savedData, error: saveError } = await client
      .from("alumnos_notificaciones")
      .insert(alumnoNotificacion)
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }
    
    return savedData;
  },
  async actualizar(client: SupabaseClient, id: number, body: any, metaData: { actualizado_por: number }) {
    // 1. Validar los datos de entrada
    const { error: validationError, value } = AlumnoNotificacionSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    const { data: alumno, error: alumnoError } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", value.alumno_id)
      .single();
    if (alumnoError || !alumno) {
      throw new Error("El alumno no existe");
    }

    const alumnoNotificacion: AlumnoNotificacion = {
      ...value,
      actualizado_por: metaData.actualizado_por
    };

    const { data: updatedData, error: updateError } = await client
      .from("alumnos_notificaciones")
      .update(alumnoNotificacion)
      .match({ alumno_notificacion_id: id });
    
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    return updatedData;
  },
  async eliminar(client: SupabaseClient, id: number) {
    const { error } = await client
      .from("alumnos_notificaciones")
      .delete()
      .match({ alumno_notificacion_id: id });

    if (error) {
      throw new Error(error.message);
    }
    
    return { message: "Notificación del alumno eliminada correctamente" };
  },
};