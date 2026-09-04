 
import { Request, Response } from "express";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";

type DerechoPrivacidad =
  | "ACCESO"
  | "RECTIFICACION"
  | "CANCELACION"
  | "OPOSICION"
  | "PORTABILIDAD"
  | "BLOQUEO";

const TABLA_SOLICITUDES = "privacidad_solicitudes";
const TABLA_CONSENTIMIENTO_VERSIONES = "consentimiento_versiones";
const CODIGO_CONSENTIMIENTO_ACTUAL = "consentimiento_asentimiento_menor";
const supabaseService = new SupabaseAdminService();
const SupabaseClient = supabaseService.getClient();

async function obtenerTitular(req: Request) {
  const solicitante = req.user;
  const solicitantePersonaId = solicitante?.persona_id ?? null;
  const titularPersonaIdRaw =
    req.body?.titular_persona_id ?? req.query?.titular_persona_id;

  if (
    titularPersonaIdRaw === undefined ||
    titularPersonaIdRaw === null ||
    Number(titularPersonaIdRaw) === solicitantePersonaId
  ) {
    return {
      esRepresentacion: false,
      titularPersonaId: solicitantePersonaId,
      solicitante,
    };
  }

  if (!solicitantePersonaId) {
    throw new Error("No autorizado para representar a un titular sin persona asociada");
  }

  const titularPersonaId = Number(titularPersonaIdRaw);
  if (Number.isNaN(titularPersonaId)) {
    throw new Error("titular_persona_id debe ser numérico");
  }

  const { data: apoderado, error: apoderadoError } = await req.supabase
    .from("apoderados")
    .select("apoderado_id, persona_id")
    .eq("persona_id", solicitantePersonaId)
    .eq("activo", true)
    .maybeSingle();

  if (apoderadoError) {
    throw new Error(`Error validando apoderado solicitante: ${apoderadoError.message}`);
  }

  if (!apoderado) {
    throw new Error("No autorizado para solicitar derechos por representación");
  }

  const { data: alumno, error: alumnoError } = await req.supabase
    .from("alumnos")
    .select("alumno_id, persona_id")
    .eq("persona_id", titularPersonaId)
    .eq("activo", true)
    .maybeSingle();

  if (alumnoError) {
    throw new Error(`Error validando titular representado: ${alumnoError.message}`);
  }

  if (!alumno) {
    throw new Error("Titular representado no válido para flujo de apoderado");
  }

  const { data: relacion, error: relacionError } = await req.supabase
    .from("alumnos_apoderados")
    .select("alumno_apoderado_id")
    .eq("alumno_id", alumno.alumno_id)
    .eq("apoderado_id", apoderado.apoderado_id)
    .eq("activo", true)
    .maybeSingle();

  if (relacionError) {
    throw new Error(`Error validando relación apoderado-alumno: ${relacionError.message}`);
  }

  if (!relacion) {
    throw new Error("No existe relación activa entre apoderado y titular representado");
  }

  return {
    esRepresentacion: true,
    titularPersonaId,
    solicitante,
  };
}

async function obtenerDatosTitular(req: Request, titularPersonaId: number | null) {
  if (!titularPersonaId) {
    return {
      usuario: req.user,
      persona: null,
      alumno: null,
      apoderado: null,
    };
  }

  const { data: persona, error: personaError } = await req.supabase
    .from("personas")
    .select("*")
    .eq("persona_id", titularPersonaId)
    .maybeSingle();

  if (personaError) {
    throw new Error(`Error obteniendo persona titular: ${personaError.message}`);
  }

  const { data: usuario, error: usuarioError } = await req.supabase
    .from("usuarios")
    .select("*")
    .eq("persona_id", titularPersonaId)
    .maybeSingle();

  if (usuarioError) {
    throw new Error(`Error obteniendo usuario titular: ${usuarioError.message}`);
  }

  const { data: alumno, error: alumnoError } = await req.supabase
    .from("alumnos")
    .select("*")
    .eq("persona_id", titularPersonaId)
    .maybeSingle();

  if (alumnoError) {
    throw new Error(`Error obteniendo alumno titular: ${alumnoError.message}`);
  }

  const { data: apoderado, error: apoderadoError } = await req.supabase
    .from("apoderados")
    .select("*")
    .eq("persona_id", titularPersonaId)
    .maybeSingle();

  if (apoderadoError) {
    throw new Error(`Error obteniendo apoderado titular: ${apoderadoError.message}`);
  }

  return { usuario, persona, alumno, apoderado };
}

async function registrarSolicitud(
  req: Request,
  tipo_derecho: DerechoPrivacidad,
  detalle: Record<string, any>,
  titularPersonaId: number | null,
  esRepresentacion: boolean
) {
  const solicitanteUsuarioId = req.user?.usuario_id ?? null;
  const solicitantePersonaId = req.user?.persona_id ?? null;

  let titularUsuarioId: number | null = null;
  if (titularPersonaId) {
    const { data: titularUsuario, error: titularUsuarioError } = await req.supabase
      .from("usuarios")
      .select("usuario_id")
      .eq("persona_id", titularPersonaId)
      .maybeSingle();

    if (titularUsuarioError) {
      throw new Error(`Error obteniendo usuario titular: ${titularUsuarioError.message}`);
    }

    titularUsuarioId = titularUsuario?.usuario_id ?? null;
  }

  const payload = {
    tipo_derecho,
    estado: "PENDIENTE",
    canal: "API",
    solicitante_usuario_id: solicitanteUsuarioId,
    solicitante_persona_id: solicitantePersonaId,
    titular_persona_id: titularPersonaId,
    titular_usuario_id: titularUsuarioId,
    es_representacion: esRepresentacion,
    detalle,
    creado_por: req.creado_por,
    actualizado_por: req.actualizado_por,
  };

  const { data, error } = await req.supabase
    .from(TABLA_SOLICITUDES)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Error registrando solicitud de privacidad: ${error.message}`);
  }

  return data;
}

function obtenerDetalleBase(req: Request) {
  return {
    observacion: req.body?.observacion ?? null,
    campos: req.body?.campos ?? null,
    motivo: req.body?.motivo ?? null,
    origen: "api",
  };
}

export const PrivacidadService = {
  async obtenerConsentimientoActual(_req: Request, res: Response) {
    try {
      const { data, error } = await SupabaseClient
        .from(TABLA_CONSENTIMIENTO_VERSIONES)
        .select(
          [
            "consentimiento_codigo",
            "consentimiento_titulo",
            "consentimiento_version",
            "consentimiento_texto",
          ].join(", ")
        )
        .eq("consentimiento_codigo", CODIGO_CONSENTIMIENTO_ACTUAL)
        .eq("consentimiento_es_actual", true)
        .eq("activo", true)
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Error obteniendo consentimiento actual: ${error.message}`);
      }

      if (!data) {
        throw new Error("No encontrado consentimiento actual");
      }

      const consentimientoActual = data as unknown as {
        consentimiento_codigo: string;
        consentimiento_titulo: string;
        consentimiento_version: string;
        consentimiento_texto: string;
      };

      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Consentimiento actual obtenido correctamente",
        data: {
          codigo: consentimientoActual.consentimiento_codigo,
          titulo: consentimientoActual.consentimiento_titulo,
          version: consentimientoActual.consentimiento_version,
          texto: consentimientoActual.consentimiento_texto,
        },
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "PrivacidadService.obtenerConsentimientoActual"
      );
    }
  },

  async solicitarAcceso(req: Request, res: Response) {
    try {
      const { titularPersonaId, esRepresentacion } = await obtenerTitular(req);
      const solicitud = await registrarSolicitud(
        req,
        "ACCESO",
        obtenerDetalleBase(req),
        titularPersonaId,
        esRepresentacion
      );
      const datos = await obtenerDatosTitular(req, titularPersonaId);

      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Solicitud de acceso registrada correctamente",
        solicitud,
        datos,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PrivacidadService.solicitarAcceso");
    }
  },

  async solicitarPortabilidad(req: Request, res: Response) {
    try {
      const { titularPersonaId, esRepresentacion } = await obtenerTitular(req);
      const solicitud = await registrarSolicitud(
        req,
        "PORTABILIDAD",
        {
          ...obtenerDetalleBase(req),
          formato: "json",
        },
        titularPersonaId,
        esRepresentacion
      );
      const datos = await obtenerDatosTitular(req, titularPersonaId);

      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Solicitud de portabilidad registrada correctamente",
        solicitud,
        exportacion: {
          formato: "json",
          exportado_en: new Date().toISOString(),
          datos,
        },
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PrivacidadService.solicitarPortabilidad");
    }
  },

  async solicitarRectificacion(req: Request, res: Response) {
    try {
      if (!req.body?.campos || typeof req.body.campos !== "object") {
        throw new Error("Debe enviar objeto campos para rectificación");
      }

      const { titularPersonaId, esRepresentacion } = await obtenerTitular(req);
      const solicitud = await registrarSolicitud(
        req,
        "RECTIFICACION",
        obtenerDetalleBase(req),
        titularPersonaId,
        esRepresentacion
      );

      return FormatResponse(res, STATUS_CODES.CREATED, {
        message: "Solicitud de rectificación registrada correctamente",
        solicitud,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PrivacidadService.solicitarRectificacion");
    }
  },

  async solicitarCancelacion(req: Request, res: Response) {
    try {
      const { titularPersonaId, esRepresentacion } = await obtenerTitular(req);
      const solicitud = await registrarSolicitud(
        req,
        "CANCELACION",
        obtenerDetalleBase(req),
        titularPersonaId,
        esRepresentacion
      );

      return FormatResponse(res, STATUS_CODES.CREATED, {
        message: "Solicitud de cancelación registrada correctamente",
        solicitud,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PrivacidadService.solicitarCancelacion");
    }
  },

  async solicitarOposicion(req: Request, res: Response) {
    try {
      const { titularPersonaId, esRepresentacion } = await obtenerTitular(req);
      const solicitud = await registrarSolicitud(
        req,
        "OPOSICION",
        obtenerDetalleBase(req),
        titularPersonaId,
        esRepresentacion
      );

      return FormatResponse(res, STATUS_CODES.CREATED, {
        message: "Solicitud de oposición registrada correctamente",
        solicitud,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PrivacidadService.solicitarOposicion");
    }
  },

  async solicitarBloqueo(req: Request, res: Response) {
    try {
      const { titularPersonaId, esRepresentacion } = await obtenerTitular(req);
      const solicitud = await registrarSolicitud(
        req,
        "BLOQUEO",
        obtenerDetalleBase(req),
        titularPersonaId,
        esRepresentacion
      );

      return FormatResponse(res, STATUS_CODES.CREATED, {
        message: "Solicitud de bloqueo registrada correctamente",
        solicitud,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PrivacidadService.solicitarBloqueo");
    }
  },
};
