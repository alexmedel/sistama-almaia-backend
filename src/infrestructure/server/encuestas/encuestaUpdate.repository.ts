import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";

type ProgramacionChange = {
  fecha_inicio?: string;
  fecha_fin?: string;
  hora_ejecucion?: string;
  frecuencia?: "diaria" | "semanal" | "mensual";
  valores_frecuencia?: number[] | null;
};

type GeneralChange = {
  estado?: number;
  titulo?: string;
  descripcion?: string | null;
  concepto_id?: number;
  tipo_id?: number;
  obligatoria?: boolean;
};

type DestinatariosChange = {
  tipo_id: number;
  objetivo_envio_id: number;
  destinatarios: number[];
};

type PreguntaChange = {
  pregunta_encuesta_id?: number;
  titulo?: string;
  tipo_id?: number;
  obligatorio?: boolean;
  orden?: number;
  activo?: boolean;
  posibles_respuestas?: Array<{
    titulo: string;
    peso: number;
    orden?: number;
  }>;
};

export class EncuestaUpdateRepository {
  private supabase = new SupabaseAdminService().getClient();

  async updateGeneral(
    encuestaId: number,
    general: GeneralChange,
    usuarioId: number
  ) {
    // Verificar si la encuesta existe
    const { data: existing, error: findErr } = await this.supabase
      .from("encuestas")
      .select("encuesta_id")
      .eq("encuesta_id", encuestaId)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing) throw new Error("Encuesta no encontrada");

    const patch: any = {};
    if (general.estado !== undefined) patch.encuesta_estado_id = general.estado;
    if (general.titulo !== undefined) patch.encuesta_nombre = general.titulo;
    if (general.descripcion !== undefined)
      patch.encuesta_descripcion = general.descripcion;
    if (general.concepto_id !== undefined)
      patch.concepto_asociado_id = general.concepto_id;
    if (general.tipo_id !== undefined) patch.tipo_encuesta_id = general.tipo_id;
    if (general.obligatoria !== undefined)
      patch.encuesta_obligatoria = general.obligatoria;
    if (Object.keys(patch).length === 0) return { ok: true };
    patch.actualizado_por = usuarioId;
    patch.fecha_actualizacion = new Date().toISOString();

    const { error } = await this.supabase
      .from("encuestas")
      .update(patch)
      .eq("encuesta_id", encuestaId);
    if (error) throw error;
    return { ok: true };
  }

  async updateProgramacion(
    encuestaId: number,
    programacion: ProgramacionChange,
    usuarioId: number
  ) {
    const patch: any = {};
    if (programacion.fecha_inicio !== undefined)
      patch.fecha_inicio = programacion.fecha_inicio;
    if (programacion.fecha_fin !== undefined)
      patch.fecha_fin = programacion.fecha_fin;
    if (programacion.hora_ejecucion !== undefined)
      patch.hora_ejecucion = programacion.hora_ejecucion;
    if (programacion.frecuencia !== undefined)
      patch.frecuencia = programacion.frecuencia;
    if (programacion.frecuencia === "diaria") {
      patch.valores_frecuencia = null;
    } else if (programacion.valores_frecuencia !== undefined) {
      patch.valores_frecuencia = programacion.valores_frecuencia;
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    patch.actualizado_por = usuarioId;
    patch.fecha_actualizacion = new Date().toISOString();

    // asumir 1-1 entre encuesta y programacion
    const { data: prog, error: findErr } = await this.supabase
      .from("encuestas_programaciones")
      .select("encuesta_programacion_id")
      .eq("encuesta_id", encuestaId)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!prog) throw new Error("Programación no encontrada para la encuesta");

    const { error } = await this.supabase
      .from("encuestas_programaciones")
      .update(patch)
      .eq("encuesta_programacion_id", prog.encuesta_programacion_id);
    if (error) throw error;
    return { ok: true };
  }

  async syncDestinatarios(
    encuestaId: number,
    destinatarios: DestinatariosChange,
    usuarioId: number
  ) {
    // Estrategia simple: borrar y reinsertar el set (replace)
    const { error: delErr } = await this.supabase
      .from("encuestas_destinatarios")
      .delete()
      .eq("encuesta_id", encuestaId);
    if (delErr) throw delErr;

    const payload = destinatarios.destinatarios.map((id) => ({
      encuesta_id: encuestaId,
      tipo_destinatario_id: destinatarios.tipo_id,
      destinatario_id: id,
      objetivo_envio_id: destinatarios.objetivo_envio_id,
      creado_por: usuarioId,
    }));
    const { error } = await this.supabase
      .from("encuestas_destinatarios")
      .insert(payload);
    if (error) throw error;
    return { ok: true };
  }

  async upsertPreguntas(
    encuestaId: number,
    preguntas: PreguntaChange[],
    usuarioId: number
  ) {
    const { data: actuales, error: errActuales } = await this.supabase
      .from("pregunta_encuestas")
      .select("pregunta_encuesta_id")
      .eq("encuesta_id", encuestaId);

    if (errActuales) throw errActuales;

    const idsActuales = actuales.map((x) => x.pregunta_encuesta_id);
    const idsEnviados = preguntas
      .filter((p) => !!p.pregunta_encuesta_id)
      .map((p) => p.pregunta_encuesta_id);
    const idsParaEliminar = idsActuales.filter(
      (id) => !idsEnviados.includes(id)
    );
    if (idsParaEliminar.length > 0) {
      const { error: errAlt } = await this.supabase
        .from("pregunta_encuestas_alternativas")
        .delete()
        .in("pregunta_encuesta_id", idsParaEliminar);

      if (errAlt) throw errAlt;

      const { error: errPreg } = await this.supabase
        .from("pregunta_encuestas")
        .delete()
        .in("pregunta_encuesta_id", idsParaEliminar);

      if (errPreg) throw errPreg;
    }
    for (const p of preguntas) {
      if (p.pregunta_encuesta_id) {
        // actualizar
        const patch: any = {};

        if (p.titulo !== undefined) patch.pregunta_texto = p.titulo;
        if (p.tipo_id !== undefined) patch.tipo_pregunta_id = p.tipo_id;
        if (p.obligatorio !== undefined) patch.obligatorio = p.obligatorio;
        if (p.orden !== undefined) patch.pregunta_orden = p.orden;

        if (Object.keys(patch).length > 0) {
          patch.actualizado_por = usuarioId;
          patch.fecha_actualizacion = new Date().toISOString();

          const { error } = await this.supabase
            .from("pregunta_encuestas")
            .update(patch)
            .eq("pregunta_encuesta_id", p.pregunta_encuesta_id)
            .eq("encuesta_id", encuestaId);

          if (error) throw error;
        }
        if (p.posibles_respuestas) {
          const { data: existingAlts, error: errExistAlt } = await this.supabase
            .from("pregunta_encuestas_alternativas")
            .select("alternativa_id, orden")
            .eq("pregunta_encuesta_id", p.pregunta_encuesta_id)
            .order("orden", { ascending: true });

          if (errExistAlt) throw errExistAlt;

          for (let idx = 0; idx < p.posibles_respuestas.length; idx++) {
            const a = p.posibles_respuestas[idx];
            const existingAlt = existingAlts?.[idx];

            if (existingAlt) {
              const { error: errUpdAlt } = await this.supabase
                .from("pregunta_encuestas_alternativas")
                .update({
                  alternativa_texto: a.titulo,
                  peso: a.peso,
                  orden: a.orden ?? idx + 1,
                })
                .eq("alternativa_id", existingAlt.alternativa_id);

              if (errUpdAlt) throw errUpdAlt;
            } else {
              const { error: errInsAlt } = await this.supabase
                .from("pregunta_encuestas_alternativas")
                .insert({
                  pregunta_encuesta_id: p.pregunta_encuesta_id!,
                  alternativa_texto: a.titulo,
                  peso: a.peso,
                  orden: a.orden ?? idx + 1,
                  creado_por: usuarioId,
                });

              if (errInsAlt) throw errInsAlt;
            }
          }

          if (existingAlts && existingAlts.length > p.posibles_respuestas.length) {
            const idsToDelete = existingAlts.slice(p.posibles_respuestas.length).map(alt => alt.alternativa_id);
            const { error: errDelAlt } = await this.supabase
              .from("pregunta_encuestas_alternativas")
              .delete()
              .in("alternativa_id", idsToDelete);

            if (errDelAlt) {
              console.error("[Encuestas] Error borrando alternativas sobrantes", errDelAlt);
              throw errDelAlt;
            }
          }
        }
      } else {
        const insertP: any = {
          encuesta_id: encuestaId,
          pregunta_texto: p.titulo ?? "",
          tipo_pregunta_id: p.tipo_id ?? 1,
          obligatorio: p.obligatorio ?? false,
          pregunta_orden: p.orden ?? 999,
          creado_por: usuarioId,
        };

        const { data: q, error: errQ } = await this.supabase
          .from("pregunta_encuestas")
          .insert(insertP)
          .select("pregunta_encuesta_id")
          .single();

        if (errQ) throw errQ;

        const newId = q.pregunta_encuesta_id;

        if (p.posibles_respuestas?.length) {
          const payloadAlt = p.posibles_respuestas.map((a, idx) => ({
            pregunta_encuesta_id: newId,
            alternativa_texto: a.titulo,
            peso: a.peso,
            orden: a.orden ?? idx + 1,
            creado_por: usuarioId,
          }));

          const { error: errInsAlt } = await this.supabase
            .from("pregunta_encuestas_alternativas")
            .insert(payloadAlt);

          if (errInsAlt) throw errInsAlt;
        }
      }
    }

    return { ok: true };
  }
}
