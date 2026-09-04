// src/core/services/AlumnoRespuestaSeleccionService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { AlumnoRespuestaSeleccion } from "../../../../../core/modelo/preguntasRespuestas/AlumnoRespuestaSeleccion";
import { AlumnoRespuestaSeleccionSchema } from "../../shema/AlumnoRespuestaSeleccionSchema";
 

// Función para validar todas las relaciones
async function validarRelaciones(client: SupabaseClient, data: AlumnoRespuestaSeleccion) {
  const { alumno_id, pregunta_id, respuesta_posible_id } = data;

  const { error: alumnoError } = await client
    .from("alumnos")
    .select("alumno_id")
    .eq("alumno_id", alumno_id)
    .single();
  if (alumnoError) throw new Error("El alumno no existe");

  const { error: preguntaError } = await client
    .from("preguntas")
    .select("pregunta_id")
    .eq("pregunta_id", pregunta_id)
    .single();
  if (preguntaError) throw new Error("La pregunta no existe");

  const { error: respuestaError } = await client
    .from("respuestas_posibles")
    .select("respuesta_posible_id")
    .eq("respuesta_posible_id", respuesta_posible_id)
    .single();
  if (respuestaError) throw new Error("La respuesta no existe");
}

export async function actualizarAlumnoRespuestaSeleccionService(
  client: SupabaseClient,
  id: number,
  body: any,
  metaData: { actualizado_por: number }
) {
  // 1. Validar el esquema de los datos de entrada
  const { error: validationError, value: validatedBody } = AlumnoRespuestaSeleccionSchema.validate(body);
  if (validationError) {
    throw new Error(validationError.details[0].message);
  }

  // 2. Validar que las entidades relacionadas existan
  await validarRelaciones(client, validatedBody);

  // 3. Devolver los datos para la actualización
  return {
    ...validatedBody,
    actualizado_por: metaData.actualizado_por,
  };
}