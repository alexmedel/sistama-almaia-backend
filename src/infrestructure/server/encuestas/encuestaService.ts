/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import type { EncuestaDTO } from "../../../core/modelo/encuestas/encuestaDTO";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { crearAvisoApp } from "../avisosApps/funciones/funcionesAviso";
import {
  insertDestinatarios,
  insertEncuesta,
  insertPreguntas,
  insertProgramacion,
} from "./encuestaRepository";
import { listEncuestasPaginated } from "./encuestaRespuestaRepository";
import { EncuestaUpdateRepository } from "./encuestaUpdate.repository";
import { buildEncuestaAvisoFechaProgramacion } from "./encuestaAvisoFecha";
import { EncuestaSchema } from "./schema/encuestadtoSchema";
import { EncuestaUpdateSchema } from "./schema/encuestaUpdateSchema";

function extractSupabaseErr(err: any) {
  return {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    details: err?.details,
    hint: err?.hint,
    status: err?.status,
    stack: err?.stack,
  };
}

export const EncuestaService = {
  async crearEncuesta(req: Request, res: Response, next: NextFunction) {
    let step = "validate";

    try {
      const usuarioId = req.user?.usuario_id;

      if (!usuarioId || isNaN(usuarioId)) {
        return FormatResponse(res, 401, {
          mensaje: "Usuario no autenticado o sesión inválida",
        });
      }

      const { error, value } = EncuestaSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        return FormatResponse(res, 400, {
          errores: error.details.map((d) => d.message),
        });
      }

      const { general, programacion, preguntas, destinatarios } =
        value as EncuestaDTO;

      step = "insertEncuesta";
      const { encuesta_id: encuestaId } = await insertEncuesta(
        general,
        usuarioId
      );

      step = "insertProgramacion";
      await insertProgramacion(encuestaId, programacion, usuarioId);

      step = "insertDestinatarios";
      await insertDestinatarios(encuestaId, destinatarios, usuarioId);

      step = "insertPreguntas";
      await insertPreguntas(encuestaId, preguntas, usuarioId);

      // === aviso automático (no crítico) ===
      try {
        const client = new SupabaseAdminService().getClient();

        const tipoObjetivoMap: Record<
          number,
          "colegio" | "grado" | "curso" | "alumno"
        > = {
          1: "colegio",
          2: "grado",
          3: "curso",
          4: "alumno",
        };
        const dirigidoA: "alumno" | "apoderado" =
          destinatarios.destinatario_tipo === "apoderado"
            ? "apoderado"
            : "alumno";

        const tipoObjetivo = tipoObjetivoMap[destinatarios.tipo_id];

        if (!tipoObjetivo) {
          throw new Error("tipo de destinatario inválido");
        }

        await crearAvisoApp(client, {
          avisoTiposId: destinatarios.tipo_id,
          tipoObjetivo,
          dirigidoA,
          ids: destinatarios.destinatarios ?? [],
          titulo: `Encuesta disponible: ${general.titulo}`,
          contenido:
            general.descripcion || "Tienes una nueva encuesta disponible.",
          fechaProgramacion: buildEncuestaAvisoFechaProgramacion(programacion),
          rutaArchivo: null,
        });
      } catch (err) {
        console.error(
          "[Encuestas] error no crítico al crear aviso automático",
          extractSupabaseErr(err)
        );
      }

      return FormatResponse(res, 201, {
        mensaje: "Encuesta creada correctamente",
        encuesta_id: encuestaId,
      });
    } catch (err) {
      console.error("[Encuestas] Error crearEncuesta", {
        step,
        ...extractSupabaseErr(err),
      });

      errorHandler.handleError(
        err,
        res,
        `EncuestaService.crearEncuesta:${step}`
      );
    }
  },
  async actualizarEncuesta(req: Request, res: Response, next: NextFunction) {
    let step = "validate";
    try {
      const usuarioId = req.user.usuario_id;
      if (!usuarioId || isNaN(usuarioId)) {
        return FormatResponse(res, 401, {
          mensaje: "Usuario no autenticado o sesión inválida.",
        });
      }

      const encuestaId = Number(req.params.id);
      if (!encuestaId || isNaN(encuestaId)) {
        return FormatResponse(res, 400, { mensaje: "Parámetro id inválido" });
      }

      const { error, value } = EncuestaUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        const mensajes = error.details.map((d) => d.message);
        return FormatResponse(res, 400, { errores: mensajes });
      }

      const repo = new EncuestaUpdateRepository();
      const updated: string[] = [];

      if (value.general) {
        step = "updateGeneral";
        await repo.updateGeneral(encuestaId, value.general, usuarioId);
        updated.push("general");
      }
      if (value.programacion) {
        step = "updateProgramacion";
        await repo.updateProgramacion(
          encuestaId,
          value.programacion,
          usuarioId
        );
        updated.push("programacion");
      }
      if (value.destinatarios) {
        step = "syncDestinatarios";
        await repo.syncDestinatarios(
          encuestaId,
          value.destinatarios,
          usuarioId
        );
        updated.push("destinatarios");
      }
      if (value.preguntas) {
        step = "upsertPreguntas";
        await repo.upsertPreguntas(encuestaId, value.preguntas, usuarioId);
        updated.push("preguntas");
      }

      return FormatResponse(res, 200, {
        mensaje: "Encuesta actualizada correctamente",
        encuesta_id: encuestaId,
        secciones_actualizadas: updated,
      });
    } catch (err) {
      console.error("[Encuestas] Error actualizarEncuesta", {
        step,
        ...extractSupabaseErr(err),
      });
      errorHandler.handleError(
        err,
        res,
        `EncuestaService.actualizarEncuesta:${step}`
      );
    }
  },
  async listarEncuestasRPC(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const perPage = req.query.perPage ? Number(req.query.perPage) : 10;
      let fechaParam: string | undefined = undefined;
      if (req.query.fecha !== undefined) {
        const raw = String(req.query.fecha || "").toLowerCase();
        if (raw === "hoy" || raw === "today") {
          fechaParam = new Date().toISOString().split("T")[0];
        } else if (raw) {
          fechaParam = raw;
        } else {
          fechaParam = null as any;
        }
      }

      const data = await listEncuestasPaginated(page, perPage, fechaParam);
      return FormatResponse(res, 200, data);
    } catch (err) {
      errorHandler.handleError(err, res, "EncuestaService.listarEncuestasRPC");
    }
  },

  async eliminarEncuesta(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user.usuario_id;
      if (!usuarioId || isNaN(usuarioId)) {
        return FormatResponse(res, 401, {
          mensaje: "Usuario no autenticado o sesión inválida.",
        });
      }

      const encuestaId = Number(req.params.id);
      if (!encuestaId || isNaN(encuestaId)) {
        return FormatResponse(res, 400, { mensaje: "Parámetro id inválido" });
      }

      const client = new SupabaseAdminService().getClient();

      // Verificar existencia
      const { data: exists, error: fetchError } = await client
        .from("encuestas")
        .select("encuesta_id, encuesta_activo")
        .eq("encuesta_id", encuestaId)
        .single();

      if (fetchError || !exists) {
        return FormatResponse(res, 404, { mensaje: "Encuesta no encontrada" });
      }

      const { error: updateError } = await client
        .from("encuestas")
        .update({ encuesta_activo: false, actualizado_por: usuarioId })
        .eq("encuesta_id", encuestaId);

      if (updateError) {
        throw updateError;
      }

      return FormatResponse(res, 200, {
        mensaje: "Encuesta eliminada  correctamente",
        encuesta_id: encuestaId,
      });
    } catch (err) {
      errorHandler.handleError(err, res, "EncuestaService.eliminarEncuesta");
    }
  },

  async listarPreguntas(req: Request, res: Response, next: NextFunction) {
    const supabaseService = new SupabaseAdminService();
    const client = supabaseService.getClient();
    const { data } = await client
      .from("pregunta_encuestas")
      .select("*")
      .eq("encuesta_id", Number(req.params.id))
      .order("pregunta_orden", { ascending: true });

    return FormatResponse(res, 200, data);
  },
};
