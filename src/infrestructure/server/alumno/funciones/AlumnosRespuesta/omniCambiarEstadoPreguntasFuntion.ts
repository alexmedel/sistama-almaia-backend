// src/core/services/estadoPreguntasService.ts
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Actualiza el estado de una pregunta en la base de datos.
 * @param client Cliente de Supabase.
 * @param tipoPreguntaId Identificador del tipo de pregunta.
 * @param idRegistro ID del registro a actualizar.
 * @param nuevoEstado El nuevo estado (boolean).
 * @param metaData Metadatos de la solicitud.
 */
export async function cambiarEstadoPreguntaService(
  client: SupabaseClient,
  tipoPreguntaId: number,
  idRegistro: number,
  nuevoEstado: boolean,
  metaData: any
) {
  const esSeleccion = tipoPreguntaId !== 3;
  const tabla = esSeleccion ? "alumnos_respuestas_seleccion" : "alumnos_respuestas";
  const clavePrimaria = esSeleccion ? "alumno_respuesta_seleccion_id" : "alumno_respuesta";

  const { error } = await client
    .from(tabla)
    .update({
      respondio: nuevoEstado,
      fecha_actualizacion: new Date(),
      actualizado_por: metaData.actualizado_por,
    })
    .match({ [clavePrimaria]: idRegistro });

  if (error) {
    throw new Error(`Error al actualizar la tabla ${tabla}: ${error.message}`);
  }

  return {
    message: `Estado de la pregunta cambiado a ${nuevoEstado ? 'respondido' : 'no respondido'} correctamente.`,
  };
}