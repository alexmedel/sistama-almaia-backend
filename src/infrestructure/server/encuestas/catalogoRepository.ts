import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

export async function fetchEstados(): Promise<any[]> {
  const { data, error } = await client
    .from("encuestas_estados")
    .select("encuesta_estado_id, encuesta_estado_nombre")
    .eq("encuesta_estado_activo", true)
    .order("encuesta_estado_nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchConceptosAsociados(): Promise<any[]> {
  const { data, error } = await client
    .from("encuestas_conceptos_asociados")
    .select("concepto_asociado_id, concepto_asociado_nombre")
    .eq("concepto_asociado_activo", true)
    .order("concepto_asociado_nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTiposEncuesta(): Promise<any[]> {
  const { data, error } = await client
    .from("encuestas_tipos")
    .select("tipo_encuesta_id, tipo_encuesta_nombre")
    .eq("tipo_encuesta_activo", true)
    .order("tipo_encuesta_nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTiposPreguntas(): Promise<any[]> {
  const { data, error } = await client
    .from("tipos_preguntas")
    .select("tipo_pregunta_id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}