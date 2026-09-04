import { SupabaseClient } from "@supabase/supabase-js";
import type { EncuestaRespuestaDTO } from "../../../core/modelo/encuestas/encuestaRespuestaDTO";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { createPaginationFromSupabase, optionPaginationSupabase } from "../../../helpers/paginate-supabase";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

/**
 * Inserta la cabecera de la respuesta a la encuesta
 */
export async function insertEncuestaRespuesta(
  respuesta: Omit<EncuestaRespuestaDTO, "items">,
  usuarioId: number
) {
  const { data, error } = await client
    .from("encuestas_respuestas")
    .insert([
      {
        encuesta_id: respuesta.encuesta_id,
        destinatario_id: respuesta.destinatario_id,
        tipo_destinatario_id: respuesta.tipo_destinatario_id,
        creado_por: usuarioId,
      },
    ])
    .select("encuesta_respuesta_id")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Inserta los items de respuesta (una por pregunta)
 */
export async function insertRespuestaItems(
  encuestaRespuestaId: number,
  items: EncuestaRespuestaDTO["items"],
  usuarioId: number
) {
  for (const item of items) {
    // 1. insertar item
    const { data, error } = await client
      .from("encuestas_respuestas_items")
      .insert([
        {
          encuesta_respuesta_id: encuestaRespuestaId,
          pregunta_encuesta_id: item.pregunta_encuesta_id,
          tipo_pregunta_id: item.tipo_pregunta_id,
          creado_por: usuarioId
        }
      ])
      .select("respuesta_item_id")
      .single();

    if (error) throw error;
    const respuestaItemId = data.respuesta_item_id;

    // 2. tipo 1 y 2 (opciones)
    if ((item.tipo_pregunta_id === 1 || item.tipo_pregunta_id === 2) && item.opciones) {
      const opcionesPayload = item.opciones.map((alternativaId: number) => ({
        respuesta_item_id: respuestaItemId,
        pregunta_encuesta_id: item.pregunta_encuesta_id,
        alternativa_id: alternativaId,
        creado_por: usuarioId
      }));

      const { error: opcError } = await client
        .from("encuestas_respuestas_items_opciones")
        .insert(opcionesPayload);

      if (opcError) throw opcError;
    }

    // 3. tipo 3 (texto abierto)
    if (item.tipo_pregunta_id === 3 && item.texto) {
      const { error: txtError } = await client
        .from("encuestas_respuestas_items_texto")
        .insert([
          {
            respuesta_item_id: respuestaItemId,
            respuesta_texto: item.texto,
            creado_por: usuarioId
          }
        ]);

      if (txtError) throw txtError;
    }

    if (item.tipo_pregunta_id === 4 && item.sociograma) {
      const payload = item.sociograma.map((relacion: any) => ({
        respuesta_item_id: respuestaItemId,
        alumno_id_origen: item.alumno_id_origen,
        alumno_id_destino: relacion.alumno_id_destino,
        label: relacion.label,
        creado_por: usuarioId
      }));

      const { error: socError } = await client
        .from("encuestas_respuestas_sociogramas")
        .insert(payload);

      if (socError) throw socError;
    }
  }
}

export async function listEncuestasPaginated(page: number, perPage: number, fecha_objetivo?: string | null) {
  const { skip, take } = optionPaginationSupabase(page, perPage);

  const rpcParams: any = {
    _skip: skip,
    _take: take,
  };
  if (fecha_objetivo !== undefined) rpcParams._fecha_objetivo = fecha_objetivo ?? null;

  const { data, error } = await client.rpc("listar_encuestas_v3", rpcParams);

  if (error) {
    throw error;
  }

  const totalItems = data?.[0]?.total || 0;

  return createPaginationFromSupabase(data, totalItems, skip, take);
}

export async function listRespuestasPorEncuesta(encuestaId: number) {
  const { data, error } = await client.rpc("listar_respuestas_encuesta_detalle", {
    p_encuesta_id: encuestaId,
  });

  if (error) throw error;
  if (error) throw error;
  if (!data) return {};

  console.log("[listar_respuestas_encuesta_detalle] raw data shape:", JSON.stringify(data).substring(0,500));

  if (Array.isArray(data)) {
    const row = data[0];
    if (!row) return {};
    return (
      (row as any).encuesta_detalle ||
      (row as any).listar_respuestas_encuesta_detalle ||
      row 
    ) || {};
  }
  if (typeof data === 'object') {
    return (data as any).encuesta_detalle || (data as any).listar_respuestas_encuesta_detalle || data || {};
  }

  return {};
}