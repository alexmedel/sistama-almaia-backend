// funciones/alumnoDetalleFunctions.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { mapEmotionsAgrupado, mapEmotionsPromedioAgrupado } from './emocionesComparativa';

// Obtener datos básicos del alumno
export async function obtenerDatosAlumno(dataService: any, supabaseClient: SupabaseClient, alumnoId: string) {
  dataService.setClient(supabaseClient);
  const where = { alumno_id: alumnoId };
  
  const data_alumno = await dataService.getAll([
    "*",
    "personas(*,persona_id,nombres,apellidos,fecha_nacimiento,generos(genero_id,nombre))",
    "colegios(colegio_id,nombre)",
    "cursos(curso_id,nombre_curso,grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))",
  ], where);

  if (!data_alumno || data_alumno.length === 0) {
    throw new Error("Alumno no encontrado");
  }

  return data_alumno[0];
}

// Obtener ficha de antecedentes clínicos
export async function obtenerFichaClinica(client: SupabaseClient, alumnoId: number) {
  const { data: ficha, error: error_ant_clinicos } = await client
    .from("alumnos_ant_clinicos")
    .select("*")
    .eq("alumno_id", alumnoId);

  if (error_ant_clinicos) {
    throw new Error(error_ant_clinicos.message);
  }

  return ficha;
}

// Obtener alertas del alumno
export async function obtenerAlertas(client: SupabaseClient, alumnoId: number) {
  const { data: alertas_data, error: error_alertas } = await client
    .from("alumnos_alertas")
    .select(
      "*,personas(persona_id,nombres,apellidos),alertas_reglas(alerta_regla_id,nombre),alertas_origenes(alerta_origen_id,nombre),alertas_severidades(alerta_severidad_id,nombre)alertas_prioridades(alerta_prioridad_id,nombre),alertas_tipos(alerta_tipo_id,nombre)"
    )
    .eq("alumno_id", alumnoId)
    .eq("activo", true)
    .order("fecha_generada", { ascending: false });

  if (error_alertas) {
    throw new Error(error_alertas.message);
  }

  return mapearAlertas(alertas_data);
}

// Obtener informes del alumno
export async function obtenerInformes(supabaseClient: SupabaseClient, alumnoId: number) {
  const { data: informes, error: error_informes } = await supabaseClient
    .from("alumnos_informes")
    .select("*")
    .eq("alumno_id", alumnoId)
    .eq("generado", true);  // Filtrar solo informes generados

  if (error_informes) {
    throw new Error(error_informes.message);
  }

  return informes;
}

// Obtener apoderados del alumno
export async function obtenerApoderados(client: SupabaseClient, alumnoId: number) {
  const { data: apoderados, error: error_apoderados } = await client
    .from("alumnos_apoderados")
    .select(
      "*,apoderados(apoderado_id,telefono_contacto1,telefono_contacto2,email_contacto1,email_contacto2,personas(persona_id,nombres,apellidos))"
    )
    .eq("alumno_id", alumnoId);

  if (error_apoderados) {
    throw new Error(error_apoderados.message);
  }

  return apoderados;
}

// Obtener emociones del alumno
export async function obtenerEmociones(client: SupabaseClient, alumnoId: string, colegioId?: string) {
  const { data: respuestas, error } = await client
    .from("alumnos_respuestas_seleccion")
    .select("alumno_id, alumnos!inner(colegio_id), preguntas!inner(diagnostico)")
    .eq("tipo_concepto", "Emociones");

  if (error) {
    console.error("Error al obtener cantidades:", error);
    return null;
  }

  const { data: emociones, error: emocionesError } = await client
    .from("emociones")
    .select("nombre, conotacion")
    .eq("activo", true);

  if (emocionesError) {
    console.error("Error al obtener emociones:", emocionesError);
    return null;
  }

  return mapEmotionsAgrupado(respuestas, emociones, alumnoId, colegioId);
}

// Obtener emociones promedio para comparativa
export async function obtenerEmocionesPromedio(client: SupabaseClient, alumnoId: string, colegioId?: string) {
  const { data: respuestas, error } = await client
    .from("alumnos_respuestas_seleccion")
    .select("alumno_id, alumnos!inner(colegio_id), preguntas!inner(diagnostico)")
    .eq("tipo_concepto", "Emociones");

  if (error) {
    console.error("Error al obtener cantidades en promedio:", error);
    return [];
  }

  const { data: emociones, error: emocionesError } = await client
    .from("emociones")
    .select("nombre, conotacion")
    .eq("activo", true);

  if (emocionesError) {
    console.error("Error al obtener emociones:", emocionesError);
    return [];
  }

  return mapEmotionsPromedioAgrupado(respuestas, emociones, alumnoId, colegioId);
}

// Función auxiliar para mapear alertas (debe existir en tu código)
function mapearAlertas(alertas_data: any[]) {
  // Tu lógica de mapeo aquí
  return alertas_data;
}

// Función auxiliar para mapear emociones (debe existir en tu código)
function mapEmotions(data_emociones: any) {
  // Tu lógica de mapeo aquí
  return data_emociones;
}

// Función auxiliar para mapear emociones promedio (debe existir en tu código)
function mapEmotionsPromedio(data_emociones_promedio: any) {
  // Tu lógica de mapeo aquí
  return data_emociones_promedio;
}
