// src/core/services/PreguntaService.ts

import { SupabaseClient } from "@supabase/supabase-js";

async function obtenerPreguntasSeleccion(client: SupabaseClient, filtros: any) {
  const { data, error } = await client
    .from('alumnos_respuestas_seleccion')
    .select(
      `
      *,
      alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email),
      preguntas(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,nivel_educativo_id,template_code,respuestas_posibles(respuesta_posible_id,nombre,icono)),
      respuestas_posibles(respuesta_posible_id,nombre)
      `
    )
    .eq('activo', true)
    .eq('respondio', filtros.respondio)
    .gte('fecha_pregunta::date', filtros.fecha)
    .order('alumno_respuesta_seleccion_id', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener preguntas de selección: ${error.message}`);
  }
  return data;
}

async function obtenerPreguntasAbiertas(client: SupabaseClient, filtros: any) {
  const { data, error } = await client
    .from('alumnos_respuestas')
    .select(
      `
      *,
      alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email),
      preguntas(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,nivel_educativo_id,template_code)
      `
    )
    .eq('activo', true)
    .eq('respondio', filtros.respondio)
    .gte('fecha_pregunta::date', filtros.fecha)
    .order('alumno_respuesta', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener preguntas abiertas: ${error.message}`);
  }
  return data;
}

export const PreguntaService = {
  async obtenerTodasLasPreguntas(client: SupabaseClient, filtros: any) {
    // Aplicar filtros adicionales si existen
    const filtrosAdicionales = Object.keys(filtros).reduce((acc: any, key) => {
      if (!['respondio', 'fecha', 'colegio_id', 'tipo_pregunta_id'].includes(key)) {
        acc[key] = filtros[key];
      }
      return acc;
    }, {});
    
    // Aquí podrías aplicar un filtro de colegio_id si fuera necesario

    const preguntasSeleccion = await obtenerPreguntasSeleccion(client, { ...filtros, ...filtrosAdicionales });
    const preguntasAbiertas = await obtenerPreguntasAbiertas(client, { ...filtros, ...filtrosAdicionales });

    return [...preguntasSeleccion, ...preguntasAbiertas];
  }
};