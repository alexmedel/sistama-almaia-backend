// src/core/services/RespuestaService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";

// Definimos un esquema de validación para los datos de entrada
const CambiarEstadoMultipleSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  pregunta_id: Joi.number().integer().required(),
  nuevo_estado: Joi.boolean().required(),
  fecha: Joi.date().optional(),
});

/**
 * Cambia el estado de todas las respuestas de selección de un alumno para una pregunta específica.
 * @param client Cliente de Supabase.
 * @param data Objeto con los datos de la solicitud.
 * @returns Un objeto con el mensaje de éxito.
 */
export async function cambiarEstadoRespuestaMultipleService(client: SupabaseClient, data: any) {
  // 1. Validar los datos de entrada
  const { error: validationError, value } = CambiarEstadoMultipleSchema.validate(data);
  if (validationError) {
    throw new Error(`Error de validación: ${validationError.details[0].message}`);
  }

  const { alumno_id, pregunta_id, nuevo_estado, fecha } = value;
  const fechaActualizacion = fecha || new Date();

  // 2. Actualizar las respuestas en la base de datos
  const { error } = await client
    .from("alumnos_respuestas_seleccion")
    .update({
      respondio: nuevo_estado,
      fecha_actualizacion: fechaActualizacion,
      activo: true,
    })
    .eq("alumno_id", alumno_id)
    .eq("pregunta_id", pregunta_id);

  if (error) {
    throw new Error(`Error en la base de datos: ${error.message}`);
  }

  return {
    message: `Estado de todas las respuestas cambiado a ${
      nuevo_estado ? "respondido" : "no respondido"
    } correctamente.`,
  };
}