// src/core/services/AlumnoPermisoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
 import { AlumnoPermisoAutorSchema } from "../../shema/AlumnoPermisoAutorSchema";
import { AlumnoPermisoAutor } from "../../../../../core/modelo/alumno/AlumnoPermisoAutor";

/**
 * Valida los datos y las relaciones para crear un nuevo registro de permiso de autor.
 * @param client El cliente de Supabase.
 * @param body El cuerpo de la solicitud.
 * @param metaData Metadatos como el usuario creador y actualizador.
 * @returns El objeto AlumnoPermisoAutor validado y listo para guardar.
 */
export async function guardarAlumnoPermisoAutorService(
    client: SupabaseClient,
    body: any,
    metaData: { creado_por: number; actualizado_por: number }
) {
    // 1. Validar el esquema de los datos de entrada
    const { error: validationError, value } = AlumnoPermisoAutorSchema.validate(body);
    if (validationError) {
        throw new Error(`Error de validación: ${validationError.details[0].message}`);
    }

    // 2. Verificar que el alumno existe
    const { error: alumnoError } = await client
        .from("alumnos")
        .select("alumno_id")
        .eq("alumno_id", value.alumno_id)
        .single();
    if (alumnoError) {
        throw new Error("El alumno no existe");
    }

    // 3. Verificar que el apoderado existe
    const { error: apoderadoError } = await client
        .from("apoderados")
        .select("apoderado_id")
        .eq("apoderado_id", value.apoderado_id)
        .single();
    if (apoderadoError) {
        throw new Error("El apoderado no existe");
    }

    // 4. Retornar el objeto listo para ser guardado
    const alumnopermisoautor: AlumnoPermisoAutor = {
        ...value,
        creado_por: metaData.creado_por,
        actualizado_por: metaData.actualizado_por
    };
    return alumnopermisoautor;
}