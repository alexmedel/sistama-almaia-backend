import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

export async function fetchPlantillasPorTipo(tipoId: number) {
  const { data, error } = await client
    .from("plantillas_encuestas")
    .select("plantilla_id, plantilla_nombre")
    .eq("tipo_encuesta_id", tipoId)
    .eq("activo", true)
    .order("fecha_creacion", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPreguntasPlantilla(plantillaId: number) {
  const { data, error } = await client
    .from("plantillas_preguntas")
    .select(
      `
      plantilla_pregunta_id,
      tipo_pregunta_id,
      pregunta_texto,
      pregunta_orden
    `
    )
    .eq("plantilla_id", plantillaId)
    .eq("activo", true)
    .order("pregunta_orden", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAlternativasPlantilla(preguntasIds: number[]) {
  const { data, error } = await client
    .from("plantillas_preguntas_alternativas")
    .select(
      `
      plantilla_alternativa_id,
      plantilla_pregunta_id,
      alternativa_texto,
      peso,
      orden
    `
    )
    .in("plantilla_pregunta_id", preguntasIds)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
