// src/core/services/AlumnoMonitoreoBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";
 
import Joi from "joi";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoMonitoreoSchema } from "../../shema/AlumnoMonitoreoSchema";



/**
 * Lógica de negocio para la gestión de monitoreos de alumnos.
 */
export const AlumnoMonitoreoBusiness = {
  async obtener(client: SupabaseClient, query: any) {
    const { colegio_id, ...where } = query;
    if (colegio_id !== undefined) {
      return await obtenerRelacionados({
        tableFilter: "alumnos",
        filterField: "colegio_id",
        filterValue: colegio_id,
        idField: "alumno_id",
        tableIn: "alumnos_monitoreos",
        inField: "alumno_id",
        selectFields: `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))`,
      });
    }

    const { data, error } = await client
      .from("alumnos_monitoreos")
      .select(`
        *,
        alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos,fecha_nacimiento))
      `)
      .match(where);
      
    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  async guardar(client: SupabaseClient, body: any) {
    // 1. Validar los datos de entrada
    const { error: validationError, value } = AlumnoMonitoreoSchema.validate(body);
    if (validationError) {
      throw new Error(`Error de validación: ${validationError.details[0].message}`);
    }

    // 2. Verificar que el alumno existe
    const { data: alumno, error: alumnoError } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", value.alumno_id)
      .single();
    if (alumnoError || !alumno) {
      throw new Error("El alumno no existe");
    }

    // 3. Insertar el nuevo monitoreo
    const { data: savedData, error: saveError } = await client
      .from("alumnos_monitoreos")
      .insert(value)
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }
    return savedData;
  },

  async actualizar(client: SupabaseClient, id: number, body: any) {
    // 1. Validar los datos de entrada
    const { error: validationError, value } = AlumnoMonitoreoSchema.validate(body);
    if (validationError) {
      throw new Error(`Error de validación: ${validationError.details[0].message}`);
    }

    // 2. Verificar que el alumno existe
    const { data: alumno, error: alumnoError } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", value.alumno_id)
      .single();
    if (alumnoError || !alumno) {
      throw new Error("El alumno no existe");
    }

    // 3. Actualizar el registro
    const { data: updatedData, error: updateError } = await client
      .from("alumnos_monitoreos")
      .update(value)
      .match({ alumno_monitoreo_id: id });
    
    if (updateError) {
      throw new Error(updateError.message);
    }
    return updatedData;
  },

  async eliminar(client: SupabaseClient, id: number) {
    const { error } = await client
      .from("alumnos_monitoreos")
      .delete()
      .match({ alumno_monitoreo_id: id });
      
    if (error) {
      throw new Error(error.message);
    }
    return { message: "Monitoreo del alumno eliminado correctamente" };
  },
};