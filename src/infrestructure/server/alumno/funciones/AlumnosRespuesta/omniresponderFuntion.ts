// src/core/services/utils/validacionService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { distinctPorCampo } from "../../../../../helpers/objectformat";

/**
 * Valida si un registro existe y si ya ha sido respondido.
 * @param client El cliente de Supabase.
 * @param tableName El nombre de la tabla.
 * @param id El ID del registro.
 * @param primaryKey El nombre de la clave primaria.
 * @returns El registro original si existe y no ha sido respondido.
 */
export async function validarRegistroYEstado(
  client: SupabaseClient,
  tableName: string,
  id: number,
  primaryKey: string = "id"
) {
  const { data: rowOriginal, error: errorSelect } = await client
    .from(tableName)
    .select("*")
    .match({ [primaryKey]: id })
    .single();

  if (errorSelect) {
    throw new Error(errorSelect.message);
  }

  if (!rowOriginal) {
    throw new Error("Registro no encontrado.");
  }

  if (rowOriginal.respondio) {
    throw new Error("La respuesta ya ha sido respondida.");
  }

  return rowOriginal;
}

export async function responderUnicaService(
  client: SupabaseClient,
  idRegistro: number,
  respuestaId: number,
  metaData: any
) {
  await validarRegistroYEstado(
    client,
    "alumnos_respuestas_seleccion",
    idRegistro,
    "alumno_respuesta_seleccion_id"
  );

  const { error } = await client
    .from("alumnos_respuestas_seleccion")
    .update({
      respuesta_posible_id: respuestaId,
      respondio: true,
      actualizado_por: metaData.actualizado_por,
      fecha_actualizacion: new Date(),
    })
    .match({ alumno_respuesta_seleccion_id: idRegistro });

  if (error) throw new Error(error.message);

  return { message: "Respuesta única actualizada correctamente." };
}

export async function responderMultipleService(
  client: SupabaseClient,
  idRegistro: number,
  respuestasPosibles: any[],
  metaData: any
) {
  const rowOriginal = await validarRegistroYEstado(
    client,
    "alumnos_respuestas_seleccion",
    idRegistro,
    "alumno_respuesta_seleccion_id"
  );

  const respuestasValidadas = distinctPorCampo(
    respuestasPosibles,
    "respuesta_posible_id"
  );

  // Borrar y luego insertar para asegurar que solo queden las nuevas respuestas.
  await client
    .from("alumnos_respuestas_seleccion")
    .delete()
    .match({
      alumno_id: rowOriginal.alumno_id,
      pregunta_id: rowOriginal.pregunta_id,
    });

  const nuevasRespuestas = respuestasValidadas.map((r: any) => ({
    alumno_id: rowOriginal.alumno_id,
    pregunta_id: rowOriginal.pregunta_id,
    respuesta_posible_id: r.respuesta_posible_id,
    respondio: true,
    creado_por: metaData.creado_por,
    actualizado_por: metaData.actualizado_por,
    fecha_creacion: rowOriginal.fecha_creacion,
    fecha_actualizacion: new Date(),
    activo: true,
  }));

  const { error: insertError } = await client
    .from("alumnos_respuestas_seleccion")
    .insert(nuevasRespuestas);
  if (insertError) throw new Error(insertError.message);

  return { message: "Respuestas múltiples actualizadas correctamente." };
}

export async function responderAbiertaService(
  client: SupabaseClient,
  idRegistro: number,
  respuestaTxt: string,
  metaData: any
) {
  if (!respuestaTxt) throw new Error("Falta el texto de la respuesta.");

  await validarRegistroYEstado(
    client,
    "alumnos_respuestas",
    idRegistro,
    "alumno_respuesta"
  );

  const { error } = await client
    .from("alumnos_respuestas")
    .update({
      respuesta: respuestaTxt,
      respondio: true,
      actualizado_por: metaData.actualizado_por,
      fecha_actualizacion: new Date(),
      activo: true,
    })
    .match({ alumno_respuesta: idRegistro });

  if (error) throw new Error(error.message);

  return { message: "Respuesta abierta actualizada correctamente." };
}
