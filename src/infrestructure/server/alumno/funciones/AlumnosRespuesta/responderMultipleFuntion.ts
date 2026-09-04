// src/core/services/RespuestaService.ts
import { SupabaseClient } from "@supabase/supabase-js";

import { RespuestaMultipleSchema } from "../../shema/RespuestaMultipleSchema";

export async function responderMultipleService(
  client: SupabaseClient,
  body: any,
  metaData: { creado_por: number; actualizado_por: number }
) {
  const { alumno_id, pregunta_id, respuestas_posibles } = body;

  const { error: deleteError } = await client
    .from("alumnos_respuestas_seleccion")
    .delete()
    .match({ alumno_id, pregunta_id });

  if (deleteError) {
    throw new Error(
      `Error al eliminar respuestas anteriores: ${deleteError.message}`
    );
  }

  // 3. Preparar los datos para la inserción
  console.log("respuestas_posibles", respuestas_posibles);
  // 3. Preparar los datos para la inserción
  const nuevasRespuestas = respuestas_posibles.map(
    (respuesta_objeto: { respuesta_posible_id: number }) => ({
      alumno_id,
      pregunta_id,
      respuesta_posible_id: respuesta_objeto.respuesta_posible_id, // <-- Access the property here
      respondio: true,
      activo: true,
    })
  );
  console.log("nuevasRespuestas", nuevasRespuestas);
  // 4. Insertar las nuevas respuestas
  const { error: insertError } = await client
    .from("alumnos_respuestas_seleccion")
    .insert(nuevasRespuestas);

  if (insertError) {
    throw new Error(
      `Error al insertar nuevas respuestas: ${insertError.message}`
    );
  }

  return { message: "Respuestas procesadas correctamente." };
}
