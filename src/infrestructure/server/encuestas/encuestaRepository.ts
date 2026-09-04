import { SupabaseClient } from "@supabase/supabase-js";
import type { EncuestaDTO } from "../../../core/modelo/encuestas/encuestaDTO";
import type {
  EncuestaAlternativaListItem,
  EncuestaListadoItem,
  EncuestaPreguntaListItem,
  ListEncuestasFilters,
} from "../../../core/modelo/encuestas/encuestaListDTO";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

/**
 * Inserta la encuesta principal
 */
export async function insertEncuesta(general: EncuestaDTO["general"], usuarioId: number) {
  const { data, error } = await client
    .from("encuestas")
    .insert([
      {
        encuesta_nombre: general.titulo,
        encuesta_descripcion: general.descripcion,
        concepto_asociado_id: general.concepto_id,
        tipo_encuesta_id: general.tipo_id,
        encuesta_estado_id: general.estado,
        encuesta_obligatoria: general.obligatoria,
        creado_por: usuarioId,
      },
    ])
    .select("encuesta_id")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Inserta la programación de una encuesta (fechas, frecuencia, etc.)
 */
export async function insertProgramacion(
  encuestaId: number,
  programacion: EncuestaDTO["programacion"],
  usuarioId: number
) {
  const { data, error } = await client
    .from("encuestas_programaciones")
    .insert([
      {
        encuesta_id: encuestaId,
        fecha_inicio: programacion.fecha_inicio,
        fecha_fin: programacion.fecha_fin,
        hora_ejecucion: programacion.hora_ejecucion,
        frecuencia: programacion.frecuencia,
        valores_frecuencia: programacion.valores_frecuencia ?? null,
        creado_por: usuarioId,
      },
    ])
    .select("encuesta_programacion_id")
    .single();

  if (error) throw error;
  return data;
}

// Nota: encuestas_programaciones_dias eliminada. Los días/fechas van en valores_frecuencia.

/**
 * Inserta preguntas y sus posibles alternativas
 */
export async function insertPreguntas(
  encuestaId: number,
  preguntas: EncuestaDTO["preguntas"],
  usuarioId: number
) {
  if (!preguntas.length) return;

  for (const [index, p] of preguntas.entries()) {
    // Inserta la pregunta
    const { data, error } = await client
      .from("pregunta_encuestas")
      .insert([
        {
          encuesta_id: encuestaId,
          tipo_pregunta_id: p.tipo_id,
          pregunta_texto: p.titulo,
          pregunta_orden: index + 1,
          obligatorio: true,
          creado_por: usuarioId,
        },
      ])
      .select("pregunta_encuesta_id")
      .single();

    if (error) throw error;
    const preguntaId = data.pregunta_encuesta_id;

    // Inserta alternativas si existen
    if (p.posibles_respuestas?.length) {
      const alternativasPayload = p.posibles_respuestas.map(
        (alt: any, i: number) => ({
          pregunta_encuesta_id: preguntaId,
          alternativa_texto: alt.titulo,
          peso: Number.isFinite(alt.peso) ? alt.peso : 0,
          orden: i + 1,
          creado_por: usuarioId,
        })
      );

      const { error: altError } = await client
        .from("pregunta_encuestas_alternativas")
        .insert(alternativasPayload);

      if (altError) {
        // Log para diagnóstico detallado si falla la inserción de alternativas
        // (no interfiere con producción; sólo complementa el error lanzado)
         
        console.error("[Encuestas] insertPreguntas.alternativas ERROR", {
          encuestaId,
          preguntaId,
          alternativasPayload,
          code: (altError as any)?.code,
          details: (altError as any)?.details,
          hint: (altError as any)?.hint,
          message: (altError as any)?.message,
        });
        throw altError;
      }
    }
  }
}

/**
 * Inserta los destinatarios (colegio, grado, curso, alumno, docente, etc.)
 */
export async function insertDestinatarios(
  encuestaId: number,
  destinatarios: EncuestaDTO["destinatarios"],
  usuarioId: number
) {
  if (!destinatarios.destinatarios?.length) return;

  const payload = destinatarios.destinatarios.map((id: number) => ({
    encuesta_id: encuestaId,
    tipo_destinatario_id: destinatarios.tipo_id,
    objetivo_envio_id: destinatarios.objetivo_envio_id,
    destinatario_id: id,
    creado_por: usuarioId,
  }));

  const { error } = await client
    .from("encuestas_destinatarios")
    .insert(payload);

  if (error) throw error;
}

export async function listEncuestas(
  filters: ListEncuestasFilters,
  skip: number,
  take: number
): Promise<{ items: EncuestaListadoItem[]; total: number }> {
  if (filters.frecuencia) {
    const { data: encIdsRows, error: freqErr } = await client
      .from("encuestas_programaciones")
      .select("encuesta_id")
      .eq("frecuencia", filters.frecuencia);
    if (freqErr) throw freqErr;
    const idsMatch = Array.from(new Set((encIdsRows || []).map((r: any) => r.encuesta_id)));
    if (idsMatch.length === 0) {
      return { items: [], total: 0 };
    }
  }

  let query = client
    .from("encuestas")
    .select(
      `
      encuesta_id,
      encuesta_nombre,
      encuesta_descripcion,
      concepto_asociado_id,
      tipo_encuesta_id,
      encuesta_estado_id,
      encuesta_obligatoria,
      fecha_creacion,
      fecha_actualizacion
    `,
      { count: "exact" }
    )
    .order("encuesta_id", { ascending: false })
    .range(skip, skip + take - 1);

  if (filters.frecuencia) {
    const { data: encIdsRows2 } = await client
      .from("encuestas_programaciones")
      .select("encuesta_id")
      .eq("frecuencia", filters.frecuencia);
    const idsMatch2 = Array.from(new Set((encIdsRows2 || []).map((r: any) => r.encuesta_id)));
    if (idsMatch2.length === 0) {
      return { items: [], total: 0 };
    }
    query = query.in("encuesta_id", idsMatch2);
  }

  if (filters.estado_id !== undefined) {
    query = query.eq("encuesta_estado_id", filters.estado_id);
  }
  if (filters.tipo_id !== undefined) {
    query = query.eq("tipo_encuesta_id", filters.tipo_id);
  }
  if (filters.concepto_id !== undefined) {
    query = query.eq("concepto_asociado_id", filters.concepto_id);
  }
  if (filters.obligatoria !== undefined) {
    query = query.eq("encuesta_obligatoria", filters.obligatoria);
  }
  if (filters.activo !== undefined) {
    query = query.eq("encuesta_activo", filters.activo);
  }
  if (filters.search) {
    query = query.ilike("encuesta_nombre", `%${filters.search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const itemsBase = (data || []) as any[];
  const ids = itemsBase.map((r) => r.encuesta_id);

  const estadoIds = Array.from(
    new Set((itemsBase || []).map((r) => r.encuesta_estado_id).filter((v: any) => v != null))
  );
  const tipoIds = Array.from(
    new Set((itemsBase || []).map((r) => r.tipo_encuesta_id).filter((v: any) => v != null))
  );
  const conceptoIds = Array.from(
    new Set((itemsBase || []).map((r) => r.concepto_asociado_id).filter((v: any) => v != null))
  );

  const estadosMap: Record<number, string> = {};
  const tiposMap: Record<number, string> = {};
  const conceptosMap: Record<number, string> = {};

  if (estadoIds.length > 0) {
    const { data: estadosRows, error: estadosErr } = await client
      .from("encuestas_estados")
      .select("encuesta_estado_id, encuesta_estado_nombre")
      .in("encuesta_estado_id", estadoIds);
    if (estadosErr) throw estadosErr;
    for (const e of estadosRows || []) {
      estadosMap[e.encuesta_estado_id] = e.encuesta_estado_nombre;
    }
  }
  if (tipoIds.length > 0) {
    const { data: tiposRows, error: tiposErr } = await client
      .from("encuestas_tipos")
      .select("tipo_encuesta_id, tipo_encuesta_nombre")
      .in("tipo_encuesta_id", tipoIds);
    if (tiposErr) throw tiposErr;
    for (const t of (tiposRows || [])) {
      tiposMap[t.tipo_encuesta_id] = t.tipo_encuesta_nombre;
    }
  }
  if (conceptoIds.length > 0) {
    const { data: conceptosRows, error: conceptosErr } = await client
      .from("encuestas_conceptos_asociados")
      .select("concepto_asociado_id, concepto_asociado_nombre")
      .in("concepto_asociado_id", conceptoIds);
    if (conceptosErr) throw conceptosErr;
    for (const c of (conceptosRows || [])) {
      conceptosMap[c.concepto_asociado_id] = c.concepto_asociado_nombre;
    }
  }

  const programaciones: Record<number, any> = {};
  if (ids.length > 0) {
    const { data: progData, error: progErr } = await client
      .from("encuestas_programaciones")
      .select("encuesta_id, fecha_inicio, fecha_fin, hora_ejecucion, frecuencia, valores_frecuencia")
      .in("encuesta_id", ids);
    if (progErr) throw progErr;
    for (const p of progData || []) {
      programaciones[p.encuesta_id] = {
        fecha_inicio: p.fecha_inicio,
        fecha_fin: p.fecha_fin,
        hora_ejecucion: p.hora_ejecucion,
        frecuencia: p.frecuencia,
        valores_frecuencia: p.valores_frecuencia ?? null,
      };
    }
  }

  const preguntasPorEncuesta: Record<number, EncuestaPreguntaListItem[]> = {};
  if (ids.length > 0) {
    const { data: pregRows, error: pregErr } = await client
      .from("pregunta_encuestas")
      .select("pregunta_encuesta_id, encuesta_id, tipo_pregunta_id, pregunta_texto, pregunta_orden, obligatorio")
      .in("encuesta_id", ids)
      .order("pregunta_orden", { ascending: true });
    if (pregErr) throw pregErr;

    const tipoPreguntaIds = Array.from(new Set((pregRows || []).map((r: any) => r.tipo_pregunta_id).filter((v: any) => v != null)));
    const tipoPregMap: Record<number, string> = {};
    if (tipoPreguntaIds.length > 0) {
      const { data: tipoPregRows, error: tipoPregErr } = await client
        .from("tipos_preguntas")
        .select("tipo_pregunta_id, nombre")
        .in("tipo_pregunta_id", tipoPreguntaIds);
      if (tipoPregErr) throw tipoPregErr;
      for (const tp of (tipoPregRows || [])) {
        tipoPregMap[tp.tipo_pregunta_id] = tp.nombre;
      }
    }

    const preguntaIds = (pregRows || []).map((r: any) => r.pregunta_encuesta_id);
    const alternativasPorPregunta: Record<number, EncuestaAlternativaListItem[]> = {};
    if (preguntaIds.length > 0) {
      const { data: altRows, error: altErr } = await client
        .from("pregunta_encuestas_alternativas")
        .select("pregunta_encuesta_id, alternativa_texto, peso, orden")
        .in("pregunta_encuesta_id", preguntaIds)
        .order("orden", { ascending: true });
      if (altErr) throw altErr;
      for (const a of altRows || []) {
        const list = alternativasPorPregunta[a.pregunta_encuesta_id] || [];
        list.push({
          titulo: a.alternativa_texto,
          peso: a.peso,
          orden: a.orden,
        });
        alternativasPorPregunta[a.pregunta_encuesta_id] = list;
      }
    }

    for (const q of pregRows || []) {
      const list = preguntasPorEncuesta[q.encuesta_id] || [];
      list.push({
        pregunta_id: q.pregunta_encuesta_id,
        titulo: q.pregunta_texto,
        tipo_id: q.tipo_pregunta_id,
        tipo_nombre: q.tipo_pregunta_id != null ? (tipoPregMap[q.tipo_pregunta_id] || null) : null,
        obligatorio: !!q.obligatorio,
        orden: q.pregunta_orden,
        posibles_respuestas: alternativasPorPregunta[q.pregunta_encuesta_id] || [],
      });
      preguntasPorEncuesta[q.encuesta_id] = list;
    }
  }

  const items: EncuestaListadoItem[] = itemsBase.map((r) => ({
    encuesta_id: r.encuesta_id,
    encuesta_nombre: r.encuesta_nombre,
    encuesta_descripcion: r.encuesta_descripcion ?? null,
    concepto_asociado_id: r.concepto_asociado_id ?? null,
    concepto_asociado_nombre: r.concepto_asociado_id != null ? (conceptosMap[r.concepto_asociado_id] || null) : null,
    tipo_encuesta_id: r.tipo_encuesta_id ?? null,
    tipo_encuesta_nombre: r.tipo_encuesta_id != null ? (tiposMap[r.tipo_encuesta_id] || null) : null,
    encuesta_estado_id: r.encuesta_estado_id ?? null,
    encuesta_estado_nombre: r.encuesta_estado_id != null ? (estadosMap[r.encuesta_estado_id] || null) : null,
    encuesta_obligatoria: !!r.encuesta_obligatoria,
    fecha_creacion: r.fecha_creacion,
    fecha_actualizacion: r.fecha_actualizacion,
    programacion: programaciones[r.encuesta_id] ?? null,
    preguntas: preguntasPorEncuesta[r.encuesta_id] || [],
  }));

  return { items, total: count || 0 };
}
