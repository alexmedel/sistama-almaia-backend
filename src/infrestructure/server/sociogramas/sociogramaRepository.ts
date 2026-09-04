import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

export async function listarRespuestasSociograma(encuestaId: number, preguntas: number[]) {
  const { data, error } = await client.rpc("listar_respuestas_sociograma", {
    p_encuesta_id: encuestaId,
    p_preguntas: preguntas
  });

  if (error) {
    throw error;
  }

  return data || [];
}