// src/core/services/AlumnoDiarioBusiness.ts
import { SupabaseClient } from "@supabase/supabase-js";

import { AlumnoDiarioSchema } from "../../shema/AlumnoDiarioSchema";
import { obtenerRelacionados } from "../../../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoDiario } from "../../../../../core/modelo/alumno/AlumnoDiario";

/**
 * Lógica de negocio para la gestión de diarios de alumnos.
 */
export const AlumnoDiarioBusiness = {
  async obtener(client: SupabaseClient, query: any) {
    const { colegio_id, ...where } = query;
    console.log("Query recibido en AlumnoDiarioBusiness:", query);
    if (colegio_id !== undefined) {
      return await obtenerRelacionados({
        tableFilter: "alumnos",
        filterField: "colegio_id",
        filterValue: colegio_id,
        idField: "alumno_id",
        tableIn: "alumnos_diarios",
        inField: "alumno_id",
        selectFields: `*,alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)`,
        orderBy: { field: "fecha", ascending: false },
      });
    }

    const { data, error } = await client
      .from("alumnos_diarios")
      .select(
        `*, alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)`
      )
      .match(where)

      .order("fecha", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  async guardar(
    client: SupabaseClient,
    body: any,
    metaData: { creado_por: number; actualizado_por: number }
  ) {
    // 1. Validar los datos de entrada al inicio.
    const { error: validationError, value } = AlumnoDiarioSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar que el alumno existe.
    const { error: alumnoError } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", value.alumno_id)
      .single();
    if (alumnoError) {
      throw new Error("El alumno no existe");
    }

    // 3. Preparar el objeto para la inserción.
    const alumnoDiario: AlumnoDiario = {
      ...value,
      creado_por: metaData.creado_por,
      actualizado_por: metaData.actualizado_por,
      activo: true,
    };

    // 4. Insertar en la base de datos.
    const { data, error } = await client
      .from("alumnos_diarios")
      .insert(alumnoDiario)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  async actualizar(
    client: SupabaseClient,
    id: number,
    body: any,
    metaData: { actualizado_por: number }
  ) {
    // 1. Validar los datos de entrada al inicio.
    const { error: validationError, value } = AlumnoDiarioSchema.validate(body);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    // 2. Verificar que el alumno existe.
    const { error: alumnoError } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("alumno_id", value.alumno_id)
      .single();
    if (alumnoError) {
      throw new Error("El alumno no existe");
    }

    // 3. Preparar el objeto para la actualización.
    const alumnoDiario: AlumnoDiario = {
      ...value,
      actualizado_por: metaData.actualizado_por,
    };

    // 4. Actualizar en la base de datos.
    const { data, error } = await client
      .from("alumnos_diarios")
      .update(alumnoDiario)
      .match({ alumno_diario_id: id })
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  async eliminar(client: SupabaseClient, id: number) {
    const { error } = await client
      .from("alumnos_diarios")
      .delete()
      .match({ alumno_diario_id: id });
    if (error) {
      throw new Error(error.message);
    }
    return { message: "Diario del alumno eliminado correctamente" };
  },
};
