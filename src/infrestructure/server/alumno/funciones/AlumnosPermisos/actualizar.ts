// src/core/services/AlumnoPermisoService.ts
import { SupabaseClient } from "@supabase/supabase-js";
 
import { AlumnoPermisoAutorSchema } from "../../shema/AlumnoPermisoAutorSchema";
import { AlumnoPermisoAutor } from "../../../../../core/modelo/alumno/AlumnoPermisoAutor";

/**
 * Valida y actualiza los datos de un permiso de autor.
 * @param client El cliente de Supabase.
 * @param id El ID del registro a actualizar.
 * @param body El cuerpo de la solicitud.
 * @param metaData Metadatos de la actualización (como el usuario que actualizó).
 * @returns El objeto AlumnoPermisoAutor validado y listo para ser actualizado.
 */
export async function actualizarAlumnoPermisoAutorService(
    client: SupabaseClient,
    id: number,
    body: any,
    metaData: { actualizado_por: number }
) {
    // 1. Validar el esquema de los datos de entrada primero.
    const { error: validationError, value } = AlumnoPermisoAutorSchema.validate(body);
    if (validationError) {
        throw new Error(`Error de validación: ${validationError.details[0].message}`);
    }

    // 2. Verificar que el alumno existe.
    const { data: alumno, error: alumnoError } = await client
        .from("alumnos")
        .select("alumno_id")
        .eq("alumno_id", value.alumno_id)
        .single();
    if (alumnoError || !alumno) {
        throw new Error("El alumno no existe.");
    }

    // 3. Verificar que el apoderado existe.
    // Nota: El código original buscaba en la tabla 'alumnos' de nuevo,
    // lo cual se ha corregido para buscar en la tabla 'apoderados'.
    const { data: apoderado, error: apoderadoError } = await client
        .from("apoderados")
        .select("apoderado_id")
        .eq("apoderado_id", value.apoderado_id)
        .single();
    if (apoderadoError || !apoderado) {
        throw new Error("El apoderado no existe.");
    }

    // 4. Construir el objeto AlumnoPermisoAutor para la actualización.
    const alumnopermisoautor: AlumnoPermisoAutor = {
        ...value,
        actualizado_por: metaData.actualizado_por,
    };
    
    return alumnopermisoautor;
}