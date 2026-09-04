import { Request, Response } from "express";
import { createHash } from "crypto";
import { DataService } from "../DataService";
import { Alumno } from "../../../core/modelo/alumno/Alumno";
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { ComparativaDato } from "../../../core/modelo/alumno/ComparativaDato";
import { Usuario } from "../../../core/modelo/auth/Usuario";
import { Persona } from "../../../core/modelo/Persona";
import { buscarAlumnos } from "../../../core/services/AlumnoServicioCasoUso";
import { mapearDatosAlumno } from "../../../core/services/PerfilServiceCasoUso";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { errorHandler } from "../../../helpers/ErrorResponse";
import {
  actualizarEmailAuth,
  cambiarContrasena,
  obtenerUsuarioActualizado,
  prepararPersona,
  prepararUsuario,
  procesarImagenPerfil,
  validarPersonaExiste,
  validarUsuarioExiste,
} from "./funciones/ActulizarPerfil";
import { AlumnoSchema } from "./shema/AlumnoSchema";
import { UsuarioUpdateSchema } from "./shema/UsuarioUpdateSchema";
import {
  obtenerAlertas,
  obtenerApoderados,
  obtenerDatosAlumno,
  obtenerEmociones,
  obtenerEmocionesPromedio,
  obtenerFichaClinica,
  obtenerInformes,
} from "./funciones/getAlumnoDetalle";
import {
  optionPaginationSupabase,
  paginate,
  paginaterShema,
} from "../../../helpers/paginate";
import { createPaginationFromSupabase } from "../../../helpers/paginate-supabase";
import { saveImage, saveSilgleFile } from "../../../helpers/upload-supabase";
import { AuditoriaService } from "../../../repos/auditoria/auditoria.service";
import { TrazabilidadRepository } from "../../../repos/auditoria/trazabilidadRepository";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<Alumno> = new DataService(
  "alumnos",
  "alumno_id"
);
const dataImagesService: DataService<Partial<Alumno>> = new DataService(
  "alumnos",
  "persona_id"
);

const dataUsuarioService: DataService<Usuario> = new DataService(
  "usuarios",
  "usuario_id"
);
const dataPersonaService: DataService<Persona> = new DataService(
  "personas",
  "persona_id"
);
const auditoriaService = new AuditoriaService(
  new TrazabilidadRepository(supabaseService)
);
const CONSENTIMIENTO_PROPOSITO_DEFAULT = "TRATAMIENTO_DATOS_SENSIBLES_ALUMNO";

async function resolverContextoConsentimiento(
  supabase: SupabaseClient,
  alumnoId: number,
  user: any
) {
  const requesterPersonaId = user?.persona_id;
  if (!requesterPersonaId) {
    throw new Error("Usuario sin persona asociada para registrar consentimiento");
  }

  const { data: alumno, error: alumnoError } = await supabase
    .from("alumnos")
    .select("alumno_id, persona_id, consentimiento")
    .eq("alumno_id", alumnoId)
    .single();

  if (alumnoError || !alumno) {
    throw new Error(alumnoError?.message || "El alumno no existe");
  }

  const { data: personaAlumno, error: personaAlumnoError } = await supabase
    .from("personas")
    .select("persona_id, fecha_nacimiento")
    .eq("persona_id", alumno.persona_id)
    .single();

  if (personaAlumnoError || !personaAlumno) {
    throw new Error(
      personaAlumnoError?.message || "No se encontró la persona del alumno"
    );
  }

  const edad = personaAlumno.fecha_nacimiento
    ? Math.floor(
        (Date.now() - new Date(personaAlumno.fecha_nacimiento).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  if (requesterPersonaId === alumno.persona_id && edad !== null && edad >= 18) {
    return {
      alumno,
      titularId: requesterPersonaId,
      tipoTitular: "alumno_mayor" as const,
      apoderadoId: null,
    };
  }

  const { data: apoderado, error: apoderadoError } = await supabase
    .from("apoderados")
    .select("apoderado_id")
    .eq("persona_id", requesterPersonaId)
    .eq("activo", true)
    .maybeSingle();

  if (apoderadoError) {
    throw new Error(apoderadoError.message);
  }

  if (!apoderado) {
    throw new Error("Solo un apoderado activo o alumno mayor puede consentir");
  }

  const { data: relacion, error: relacionError } = await supabase
    .from("alumnos_apoderados")
    .select("alumno_apoderado_id")
    .eq("alumno_id", alumnoId)
    .eq("apoderado_id", apoderado.apoderado_id)
    .eq("activo", true)
    .maybeSingle();

  if (relacionError) {
    throw new Error(relacionError.message);
  }

  if (!relacion) {
    throw new Error("El apoderado no está relacionado activamente con el alumno");
  }

  return {
    alumno,
    titularId: requesterPersonaId,
    tipoTitular: "apoderado" as const,
    apoderadoId: apoderado.apoderado_id,
  };
}

async function registrarConsentimientoAuditable(
  req: Request,
  alumnoId: number,
  otorgado: boolean
) {
  const supabase = req.supabase ?? client;
  const proposito = req.body?.proposito || CONSENTIMIENTO_PROPOSITO_DEFAULT;
  const versionPolitica = req.body?.version_politica || "v1";
  const textoConsentimiento =
    typeof req.body?.texto_consentimiento === "string"
      ? req.body.texto_consentimiento.trim()
      : null;
  const canal =
    typeof req.body?.canal === "string" ? req.body.canal.trim() : null;
  const origenPantalla =
    typeof req.body?.origen_pantalla === "string"
      ? req.body.origen_pantalla.trim()
      : null;
  const dispositivoMetadata =
    req.body?.dispositivo_metadata &&
    typeof req.body.dispositivo_metadata === "object" &&
    !Array.isArray(req.body.dispositivo_metadata)
      ? req.body.dispositivo_metadata
      : {};
  const evidenciaMetadata =
    req.body?.evidencia_metadata &&
    typeof req.body.evidencia_metadata === "object" &&
    !Array.isArray(req.body.evidencia_metadata)
      ? req.body.evidencia_metadata
      : {};
  const motivoRevocacion =
    !otorgado && typeof req.body?.motivo_revocacion === "string"
      ? req.body.motivo_revocacion.trim()
      : null;
  const contexto = await resolverContextoConsentimiento(supabase, alumnoId, req.user);
  const textoConsentimientoHash = textoConsentimiento
    ? createHash("sha256").update(textoConsentimiento, "utf8").digest("hex")
    : null;

  const { data: consentimiento, error: consentimientoError } = await supabase
    .from("consentimientos")
    .insert({
      titular_id: contexto.titularId,
      tipo_titular: contexto.tipoTitular,
      proposito,
      otorgado,
      alumno_id: contexto.alumno.alumno_id,
      alumno_persona_id: contexto.alumno.persona_id,
      usuario_id: req.user?.usuario_id ?? null,
      apoderado_id: contexto.apoderadoId,
      ip_origen: req.ip,
      version_politica: versionPolitica,
      texto_consentimiento: textoConsentimiento,
      texto_consentimiento_hash: textoConsentimientoHash,
      canal,
      origen_pantalla: origenPantalla,
      user_agent: req.get("user-agent") || null,
      dispositivo_metadata: dispositivoMetadata,
      evidencia_metadata: evidenciaMetadata,
      motivo_revocacion: motivoRevocacion,
      revocado_at: otorgado ? null : new Date().toISOString(),
    })
    .select("*")
    .single();

  if (consentimientoError) {
    throw new Error(consentimientoError.message);
  }

  const { error: updateAlumnoError } = await supabase
    .from("alumnos")
    .update({ consentimiento: otorgado })
    .eq("alumno_id", alumnoId);

  if (updateAlumnoError) {
    throw new Error(updateAlumnoError.message);
  }

  return consentimiento;
}

async function obtenerTopDiagnosticosAlumnoPorTipoConcepto(
  req: Request,
  res: Response,
  tipoConcepto: "Patologica" | "Neurodivergencia",
  errorContext: string
) {
  try {
    const { alumnoId } = req.params;
    const { colegio_id, fecha, fecha_desde, fecha_hasta } = req.query;
    const alumnoIdNumero = Number(alumnoId);
    const colegioId = colegio_id ? Number(colegio_id) : null;
    const hoy = new Date();
    const haceDosAnios = new Date(hoy);
    haceDosAnios.setFullYear(hoy.getFullYear() - 2);
    const fechaHastaUsar = fecha_hasta
      ? String(fecha_hasta)
      : fecha
        ? String(fecha)
        : hoy.toISOString().split("T")[0];
    const fechaDesdeUsar = fecha_desde
      ? String(fecha_desde)
      : haceDosAnios.toISOString().split("T")[0];

    const { data, error } = await client.rpc(
      "top_diagnosticos_alumno_por_tipo_concepto",
      {
        p_alumno_id: alumnoIdNumero,
        p_limit: 5,
        p_tipo_concepto: tipoConcepto,
        p_fecha_desde: fechaDesdeUsar,
        p_fecha_hasta: fechaHastaUsar,
        p_colegio_id: colegioId,
      }
    );

    if (error) {
      console.error(`Error al obtener top diagnosticos del alumno para ${tipoConcepto}:`, error);
      return FormatResponse(res, 500, "Error interno del servidor");
    }

    const payload = (data || []).map((item: any) => ({
      nombre: item.diagnostico,
      total: Number(item.total_respuestas ?? 0),
      positivos: Number(item.respuestas_positivas ?? 0),
      neutrales: Number(item.respuestas_neutras ?? 0),
      negativos: Number(item.respuestas_negativas ?? 0),
      color: item.color ?? null,
      cantidad_preguntas: Number(item.cantidad_preguntas ?? 0),
    }));

    return FormatResponse(res, STATUS_CODES.OK, payload);
  } catch (error) {
    errorHandler.handleError(error, res, errorContext);
  }
}

function obtenerRangoFechas(query: Request["query"]) {
  const { fecha, fecha_desde, fecha_hasta } = query;
  const hoy = new Date();
  const haceDosAnios = new Date(hoy);
  haceDosAnios.setFullYear(hoy.getFullYear() - 2);

  return {
    fechaHastaUsar: fecha_hasta
      ? String(fecha_hasta)
      : fecha
        ? String(fecha)
        : hoy.toISOString().split("T")[0],
    fechaDesdeUsar: fecha_desde
      ? String(fecha_desde)
      : haceDosAnios.toISOString().split("T")[0],
  };
}

function parsearEmocionesParametro(emocionesQuery: unknown) {
  const raw = Array.isArray(emocionesQuery)
    ? emocionesQuery.join(",")
    : String(emocionesQuery ?? "");

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nombreTipoRespuestaPorPeso(pesoObjetivo: number) {
  if (pesoObjetivo === 2) {
    return "negativa";
  }
  if (pesoObjetivo === 1) {
    return "neutra";
  }
  return "positiva";
}

async function auditarConsultaListaAlumnos(req: Request, colegioId: number) {
  try {
    await auditoriaService.guardarAuditoria({
      tipo_auditoria_id: 3,
      colegio_id: Number.isFinite(colegioId) ? colegioId : 0,
      fecha: new Date(),
      usuario_id: req.user.usuario_id,
      descripcion: `Usuario consulto lista de alumnos del colegio ${colegioId}`,
      modulo_afectado: "alumnos",
      accion_realizada: "consultar_lista",
      ip_origen: req.ip,
      model: "alumnos",
      referencia_id: Number.isFinite(colegioId) ? colegioId : 0,
    });
  } catch (auditError) {
    console.error("Error registrando auditoria de lista alumnos:", auditError);
  }
}

async function obtenerColegiosPermitidos(
  supabase: SupabaseClient,
  usuarioId?: number,
  rolId?: number
): Promise<number[]> {
  if (!usuarioId) {
    throw new Error("No autorizado para consultar alumnos");
  }

  const isGlobalAdmin = rolId === 10 || rolId === 11 || rolId === 12 || rolId === 13;
  if (isGlobalAdmin) {
    const { data, error } = await supabase
      .from("colegios")
      .select("colegio_id")
      .eq("activo", true);

    if (error) {
      throw new Error(`Error obteniendo colegios activos: ${error.message}`);
    }

    return (data || [])
      .map((row: any) => Number(row.colegio_id))
      .filter((id: number) => Number.isFinite(id));
  }

  const { data, error } = await supabase
    .from("usuarios_colegios")
    .select("colegio_id")
    .eq("usuario_id", usuarioId)
    .eq("activo", true);

  if (error) {
    throw new Error(`Error validando colegios del usuario: ${error.message}`);
  }

  return (data || [])
    .map((row: any) => Number(row.colegio_id))
    .filter((id: number) => Number.isFinite(id));
}

export const AlumnosService = {
  async obtener(req: Request, res: Response) {
    try {
      const { page, perPage, colegio_id, shourh, persona_id } = req.query as any;
      const cursoIdParam = (req.query as any).curso_id ?? (req.query as any)["cursos.curso_id"];
      const cursoId = cursoIdParam !== undefined ? Number(cursoIdParam) : undefined;
      const colegioId = colegio_id !== undefined ? Number(colegio_id) : undefined;
      const requestClient = req.supabase ?? client;
      const colegiosPermitidos = await obtenerColegiosPermitidos(
        requestClient,
        req.user?.usuario_id,
        req.user?.rol_id
      );
      if (
        colegioId !== undefined &&
        !isNaN(colegioId) &&
        !colegiosPermitidos.includes(colegioId)
      ) {
        throw new Error("No autorizado para consultar este colegio");
      }
      // 1. Validar parámetros de paginación

      if (persona_id !== undefined) {
        const { data: alumno, error } = await requestClient
          .from("alumnos")
          .select("* , colegios(*)")
          .eq("persona_id", persona_id)
          .select("*");

        if (error) {
          console.error("Error de validación:", error.message);
          throw new Error(error.message);
        }

        const { data: colegio, error: colegioError } = await requestClient
          .from("colegios")
          .select("*")
          .eq("colegio_id", alumno?.[0]?.colegio_id)
          .single();

        const data = [{ ...alumno[0], colegio: colegio.nombre }];
        return FormatResponse(res, STATUS_CODES.OK, data);
      }

      const validation = paginaterShema.validate({
        page: page,
        perPage: perPage,
      });
      if (process.env.HTTP_DEBUG === "true") {
        console.log("colegio_id", colegio_id);
        console.log("curso_id", cursoIdParam);
      }
      if (validation.error) {
        console.error("Error de validación:", validation.error.message);
        throw new Error(validation.error.message);
      }

      // 3. Convertir a skip/take para Supabase
      const { skip, take } = optionPaginationSupabase(page, perPage);
      if (process.env.HTTP_DEBUG === "true") {
        console.log(`Paginación: skip=${skip}, take=${take}`);
      }

      // 4. PRIMERA QUERY: Solo para COUNT (sin joins complejos para evitar errores)
      if (process.env.HTTP_DEBUG === "true") {
        console.log("=== OBTENIENDO COUNT ===");
      }

      const needsCursoJoin = cursoId !== undefined && !isNaN(cursoId) && cursoId > 0;

      let countQuery = requestClient
        .from("alumnos")
        .select(needsCursoJoin ? "alumno_id, alumnos_cursos!inner(curso_id)" : "alumno_id", { count: "exact", head: true })
        .eq("activo", true);

      if (colegioId !== undefined && !isNaN(colegioId)) {
        countQuery = countQuery.eq("colegio_id", colegioId);
      } else {
        countQuery = countQuery.in("colegio_id", colegiosPermitidos);
      }

      // Filtrar por curso si viene (acepta curso_id o cursos.curso_id)
      if (needsCursoJoin) {
        countQuery = countQuery.eq("alumnos_cursos.curso_id", cursoId);
      }

      // Aplicar búsqueda para count si viene shourh
      if (shourh && shourh !== "") {
        if (process.env.HTTP_DEBUG === "true") {
          console.log("Aplicando búsqueda para COUNT:", shourh);
        }
        countQuery = countQuery.or(
          `nombres.ilike.%${shourh}%,apellidos.ilike.%${shourh}%`,
          { foreignTable: "personas" }
        );
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error("Error en count:", countError);
        throw new Error(`Error obteniendo count: ${countError.message}`);
      }

      if (process.env.HTTP_DEBUG === "true") {
        console.log("Total registros encontrados:", count);
      }

      // 5. Si no hay registros, devolver resultado vacío
      if (!count || count === 0) {
        const emptyResult = createPaginationFromSupabase([], 0, skip, take);
        await auditarConsultaListaAlumnos(req, colegioId || 0);
        FormatResponse(res, STATUS_CODES.OK, emptyResult);
        return;
      }

      // 6. SEGUNDA QUERY: Para obtener los datos con todos los joins
      if (process.env.HTTP_DEBUG === "true") {
        console.log("=== OBTENIENDO DATOS ===");
      }

      const dataSelect = needsCursoJoin
        ? `
        *,
        personas(persona_id,nombres,apellidos,fecha_nacimiento,numero_documento,usuarios(usuario_id,rol_id)),
        colegios(colegio_id,nombre),
        alumnos_cursos!inner(curso_id, cursos(curso_id,nombre_curso,grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre)))
      `
        : `
        *,
        personas(persona_id,nombres,apellidos,fecha_nacimiento,numero_documento,usuarios(usuario_id,rol_id)),
        colegios(colegio_id,nombre),
        cursos(curso_id,nombre_curso,grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))
      `;

      let dataQuery = requestClient
        .from("alumnos")
        .select(dataSelect)
        .eq("activo", true);

      if (colegioId !== undefined && !isNaN(colegioId)) {
        dataQuery = dataQuery.eq("colegio_id", colegioId);
      } else {
        dataQuery = dataQuery.in("colegio_id", colegiosPermitidos);
      }

      if (needsCursoJoin) {
        dataQuery = dataQuery.eq("alumnos_cursos.curso_id", cursoId);
      }

      // Aplicar búsqueda para datos si viene shourh
      if (shourh && shourh !== "") {
        if (process.env.HTTP_DEBUG === "true") {
          console.log("Aplicando búsqueda para DATOS:", shourh);
        }
        dataQuery = dataQuery.or(
          `nombres.ilike.%${shourh}%,apellidos.ilike.%${shourh}%`,
          { foreignTable: "personas" }
        );
      }
      dataQuery = dataQuery.range(skip, skip + take - 1);

      const { data: alumnos, error: dataError } = await dataQuery;

      if (dataError) {
        console.error("Error en datos:", dataError);
        throw new Error(`Error consultando alumnos: ${dataError.message}`);
      }

      if (process.env.HTTP_DEBUG === "true") {
        console.log(`✅ Datos obtenidos: ${alumnos?.length || 0} registros`);
      }

      // 9. Crear resultado de paginación
      const metadata = createPaginationFromSupabase(
        alumnos || [],
        count, // Usar el count real de la primera query
        skip,
        take
      );

      if (process.env.HTTP_DEBUG === "true") {
        console.log("=== RESULTADO FINAL ===");
        console.log(`Página ${metadata.currentPage} de ${metadata.totalPages}`);
        console.log(`Mostrando ${metadata.data.length} de ${metadata.totalItems} registros`);
        console.log(`Rango: ${skip + 1} a ${skip + (alumnos?.length || 0)}`);
      }

      await auditarConsultaListaAlumnos(req, colegioId || 0);
      FormatResponse(res, STATUS_CODES.OK, metadata);
    } catch (error) {
      console.error("=== ERROR EN OBTENER ===");
      console.error(error);
      errorHandler.handleError(error, res, "AlumnoService.obtener");
    }
  },

  async obtenerUno(req: Request, res: Response) {
    try {
      const { alumno_id } = req.params;
      console.log("aqui alumno_id", alumno_id);
      const { data: alumno, error } = await client
        .from("alumnos")
        .select("*,personas(*,usuarios(telefono_contacto))")
        .eq("alumno_id", alumno_id)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      FormatResponse(res, STATUS_CODES.OK, alumno);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.obtenerUno");
    }
  },
  async establecer_consentimiento(req: Request, res: Response) {
    try {
      const alumnoId = parseInt(req.params.id);
      const { consentimiento } = req.body;
      if (consentimiento === undefined || consentimiento === null) {
        throw new Error("El consentimiento es requerido.");
      }
      const consentimientoRegistrado = await registrarConsentimientoAuditable(
        req,
        alumnoId,
        Boolean(consentimiento)
      );
      FormatResponse(res, STATUS_CODES.OK, {
        message: consentimiento
          ? "Consentimiento actualizado y auditado correctamente"
          : "Consentimiento revocado y auditado correctamente",
        consentimiento: consentimientoRegistrado,
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoService.establecer_consentimiento"
      );
    }
  },
  async getAlumnoDetalle(req: Request, res: Response) {
    try {
      const { alumnoId } = req.params;
      const { colegio_id } = req.query;
      // Obtener datos básicos del alumno
      const alumno = await obtenerDatosAlumno(
        dataService,
        req.supabase,
        alumnoId
      );

      try {
        const colegioId = Number(colegio_id ?? alumno.colegio_id ?? 0);
        await auditoriaService.guardarAuditoria({
          tipo_auditoria_id: 3,
          colegio_id: Number.isFinite(colegioId) ? colegioId : 0,
          fecha: new Date(),
          usuario_id: req.user.usuario_id,
          descripcion: `Usuario consulto detalle del alumno ${alumnoId}`,
          modulo_afectado: "alumnos",
          accion_realizada: "consultar_detalle",
          ip_origen: req.ip,
          model: "alumnos",
          referencia_id: Number(alumnoId),
        });
      } catch (auditError) {
        console.error("Error registrando auditoria de detalle alumno:", auditError);
      }
      // Obtener ficha clínica
      const ficha = await obtenerFichaClinica(client, alumno.alumno_id);

      // Obtener alertas
      const alertas = await obtenerAlertas(client, alumno.alumno_id);

      // Obtener informes
      const informes = await obtenerInformes(req.supabase, alumno.alumno_id);

      // Obtener apoderados
      const apoderados = await obtenerApoderados(client, alumno.alumno_id);

      // Obtener emociones
      const emociones = await obtenerEmociones(
        client,
        alumnoId,
        colegio_id as string
      );

      // Obtener datos comparativos de emociones
      const datosComparativa = await obtenerEmocionesPromedio(
        client,
        alumnoId,
        colegio_id as string
      );

      return FormatResponse(res, STATUS_CODES.OK, {
        alumno,
        ficha,
        alertas,
        informes,
        emociones,
        datosComparativa,
        apoderados,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.getAlumnoDetalle");
    }
  },
  async getTopEmocionesAlumno(req: Request, res: Response) {
    try {
      const { alumnoId } = req.params;
      const { colegio_id, tipo } = req.query;
      if (!tipo || (tipo !== "negativo" && tipo !== "positivo" && tipo !== "neutro")) {
        return FormatResponse(res, 400, "Tipo requerido: 'negativo' o 'positivo' o 'neutro'");
      }
      const alumnoIdNumero = Number(alumnoId);
      const colegioId = colegio_id ? Number(colegio_id) : null;
      const { fechaDesdeUsar, fechaHastaUsar } = obtenerRangoFechas(req.query);
      const conotaciones =
        tipo === "negativo" ? ["Negativa"] :
        tipo === "neutro" ? ["Neutra"] :
        ["Positiva"];

      const { data, error } = await client.rpc(
        "top_diagnosticos_alumno_por_connotacion_emocion",
        {
          p_alumno_id: alumnoIdNumero,
          p_limit: 5,
          p_conotaciones: conotaciones,
          p_fecha_desde: fechaDesdeUsar,
          p_fecha_hasta: fechaHastaUsar,
          p_colegio_id: colegioId,
        }
      );

      if (error) {
        console.error("Error al obtener top emociones del alumno:", error);
        return FormatResponse(res, 500, "Error interno del servidor");
      }

      const payload = (data || []).map((item: any) => ({
        nombre: item.diagnostico,
        total: Number(item.total_respuestas ?? 0),
        positivos: Number(item.respuestas_positivas ?? 0),
        neutrales: Number(item.respuestas_neutras ?? 0),
        negativos: Number(item.respuestas_negativas ?? 0),
        conotacion: item.conotacion_emocion,
        color: item.color ?? null,
        cantidad_preguntas: Number(item.cantidad_preguntas ?? 0),
      }));

      return FormatResponse(res, STATUS_CODES.OK, payload);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoService.getTopEmocionesAlumno"
      );
    }
  },
  async obtener_historial_consentimiento(req: Request, res: Response) {
    try {
      const alumnoId = parseInt(req.params.id);
      const supabase = req.supabase ?? client;
      await resolverContextoConsentimiento(supabase, alumnoId, req.user);

      const { data, error } = await supabase
        .from("consentimientos")
        .select("*")
        .eq("alumno_id", alumnoId)
        .order("fecha_consentimiento", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      FormatResponse(res, STATUS_CODES.OK, data ?? []);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoService.obtener_historial_consentimiento"
      );
    }
  },
  async revocar_consentimiento(req: Request, res: Response) {
    try {
      const alumnoId = parseInt(req.params.id);
      const consentimientoRegistrado = await registrarConsentimientoAuditable(
        req,
        alumnoId,
        false
      );

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Consentimiento revocado y auditado correctamente",
        consentimiento: consentimientoRegistrado,
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoService.revocar_consentimiento"
      );
    }
  },
  async getComparativaEmocionesAlumno(req: Request, res: Response) {
    try {
      const { alumnoId } = req.params;
      const { colegio_id, emociones, scope, peso } = req.query;
      const alumnoIdNumero = Number(alumnoId);
      const colegioId = Number(colegio_id);

      if (!Number.isInteger(alumnoIdNumero) || alumnoIdNumero <= 0) {
        return FormatResponse(res, 400, "alumnoId inválido");
      }

      if (!Number.isInteger(colegioId)) {
        return FormatResponse(res, 400, "colegio_id requerido");
      }

      const emocionesSeleccionadas = parsearEmocionesParametro(emociones);
      if (emocionesSeleccionadas.length === 0) {
        return FormatResponse(res, 400, "emociones requerido. Usa coma para separar valores");
      }

      if (emocionesSeleccionadas.length > 10) {
        return FormatResponse(res, 400, "Máximo 10 emociones por consulta");
      }

      const scopeUsar =
        scope === "grado" || scope === "nivel" || scope === "colegio"
          ? scope
          : "curso";

      const pesoObjetivo = peso === undefined ? 0 : Number(peso);
      if (![0, 1, 2].includes(pesoObjetivo)) {
        return FormatResponse(res, 400, "peso inválido. Usa 0, 1 o 2");
      }

      const { fechaDesdeUsar, fechaHastaUsar } = obtenerRangoFechas(req.query);

      const { data, error } = await client.rpc(
        "comparativa_emociones_alumno",
        {
          p_alumno_id: alumnoIdNumero,
          p_colegio_id: colegioId,
          p_emociones: emocionesSeleccionadas,
          p_fecha_desde: fechaDesdeUsar,
          p_fecha_hasta: fechaHastaUsar,
          p_scope: scopeUsar,
          p_peso_objetivo: pesoObjetivo,
        }
      );

      if (error) {
        console.error("Error al obtener comparativa de emociones del alumno:", error);
        return FormatResponse(res, 500, "Error interno del servidor");
      }

      const filas = data || [];
      const contextoBase = filas[0] || {};

      return FormatResponse(res, STATUS_CODES.OK, {
        alumno_id: alumnoIdNumero,
        scope: scopeUsar,
        contexto: {
          colegio_id: colegioId,
          curso_id: contextoBase.curso_id ?? null,
          grado_id: contextoBase.grado_id ?? null,
          nivel_educativo_id: contextoBase.nivel_educativo_id ?? null,
          scope_id: contextoBase.scope_id ?? null,
          scope_nombre: contextoBase.scope_nombre ?? null,
        },
        tipo_respuesta: {
          codigo: pesoObjetivo,
          nombre: nombreTipoRespuestaPorPeso(pesoObjetivo),
        },
        items: filas.map((item: any) => ({
          emocion: item.emocion,
          conotacion: item.conotacion_emocion,
          color: item.color ?? null,
          alumno: Number(item.alumno_total ?? 0),
          promedio: Number(item.grupo_promedio ?? 0),
          diferencia: Number(item.diferencia ?? 0),
        })),
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoService.getComparativaEmocionesAlumno"
      );
    }
  },
  async getTopPatologiasAlumno(req: Request, res: Response) {
    return obtenerTopDiagnosticosAlumnoPorTipoConcepto(
      req,
      res,
      "Patologica",
      "AlumnoService.getTopPatologiasAlumno"
    );
  },
  async getTopNeurodivergenciasAlumno(req: Request, res: Response) {
    return obtenerTopDiagnosticosAlumnoPorTipoConcepto(
      req,
      res,
      "Neurodivergencia",
      "AlumnoService.getTopNeurodivergenciasAlumno"
    );
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const alumno: Alumno = new Alumno();
      Object.assign(alumno, req.body);
      alumno.creado_por = req.creado_por;
      alumno.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = AlumnoSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", alumno.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedAlumno = await dataService.processData(alumno);
        return FormatResponse(res, STATUS_CODES.CREATED, savedAlumno);
      }
    } catch (err) {
      errorHandler.handleError(err, res, "AlumnoService.guardar");
    }
  },
  //obseleto
  async actualizar(req: Request, res: Response) {
    console.log("Cuerpo de la solicitud:", req.body);
    try {
      const alumno: Alumno = new Alumno();
      Object.assign(alumno, req.body);
      alumno.actualizado_por = req.actualizado_por;
      let responseSent = false;

      const { error: validationError } = AlumnoSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", alumno.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(req.body.alumno_id, alumno);
        return FormatResponse(res, STATUS_CODES.OK, alumno);
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },
  //arreglar esto
  async actualizarPerfil(req: Request, res: Response) {
    try {
      const usuarioId = req.user.usuario_id;
      const authID = req.user.auth_id;
      const { encripted_password = undefined, ...rest } = req.body;

      // Validación
      const { error: validationError } = UsuarioUpdateSchema.validate(rest);
      if (validationError) {
        res.status(400).json({
          error: validationError.details[0].message,
        });
        return;
      }
      // Validar existencia

      const dataUsuario = await validarUsuarioExiste(client, usuarioId);
      const dataPersona = await validarPersonaExiste(
        client,
        dataUsuario.persona_id
      );

      // Preparar objetos
      const usuario = prepararUsuario(
        req.body,
        dataUsuario,
        req.actualizado_por
      );
      const persona = prepararPersona(req.body, dataPersona);

      if (req.file) {
        const url = await saveImage(req.supabase, req);
        usuario.url_foto_perfil = url ?? usuario.url_foto_perfil;
      }
     

      // Actualizar usuario
      await dataUsuarioService.updateById(usuarioId, usuario);

      // Actualizar imagen
      await dataImagesService.updateById(usuario.persona_id, {
        url_foto_perfil: usuario?.url_foto_perfil,
        actualizado_por: req.actualizado_por,
        fecha_actualizacion: req.fecha_creacion,
      });

      // Actualizar email en Auth
      await actualizarEmailAuth(authID, usuario.email);

      // Obtener datos actualizados
      const dataUsuarioUpdate = await obtenerUsuarioActualizado(
        client,
        usuarioId
      );

      // Actualizar persona
      await dataPersonaService.updateById(usuario.persona_id, persona);

      // Cambiar contraseña
      await cambiarContrasena(
        client,
        dataUsuarioUpdate.email,
        encripted_password
      );

      FormatResponse(res, 200, dataUsuarioUpdate);
      return;
    } catch (error) {
      errorHandler.handleError(error, res, "UsuarioService.actualizarPerfil");
    }
  },

  /**
   *
   * @param req
   * @param res
   * @returns
   */
  async actualizarAlumno(req: Request, res: Response) {
    const { alumno_id } = req.body;

    try {
      const alumnoId = parseInt(alumno_id);

      const { data: alumno } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", alumnoId)
        .single();

      if (!alumno) {
        throw new Error("El alumno no existe");
      }
      const { data: persona, error: errorPersona } = await client
        .from("personas")
        .update({
          numero_documento: req.body.numero_documento,
          nombres: req.body.nombres,
          apellidos: req.body.apellidos,
          fecha_nacimiento: req.body.fecha_nacimiento,
        })
        .eq("persona_id", alumno.persona_id)
        .select("*")
        .single();

      const { data: usuario, error: errorUsuario } = await client
        .from("usuarios")
        .update({
          telefono_contacto: req.body.telefono_contacto,
          nombres: req.body.nombres,
          apellidos: req.body.apellidos,
          email: req.body.email,
        })
        .eq("persona_id", alumno.persona_id)
        .select("*")
        .single();

      await client
        .from("alumnos")
        .update({ email: req.body.email })
        .eq("alumno_id", alumnoId);

      await client.auth.admin.updateUserById(usuario.auth_id, {
        email: req.body.email,
      });

      if (errorUsuario) {
        throw new Error(errorUsuario.message);
      }
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Alumno actualizado correctamente",
        alumno: {
          ...alumno,
          usuario,
        },
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.actualizarAlumno");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Alumno eliminado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.eliminar");
    }
  },

  async buscar(req: Request, res: Response) {
    const { termino, cursos } = req.body;
    const { colegio_id } = req.query;

    if (!termino || typeof termino !== "string") {
      throw new Error(
        "Debe proporcionar un campo 'termino' en el cuerpo de la solicitud"
      );
    }

    try {
      let resultados;
      resultados = await buscarAlumnos(client, termino, colegio_id, cursos);
      if (resultados === null) {
        resultados = [];
      }

      return FormatResponse(res, STATUS_CODES.OK, resultados);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.buscar");
    }
  },

  async obtenerRacha(req: Request, res: Response) {
    try {
      const { alumno_id } = req.query;
      if (alumno_id === undefined) {
        throw new Error("Falta el parámetro alumno_id");
      }
      const { data, error } = await client.rpc("obtener_rachas_combinadas", {
        alumno_id_param: alumno_id || null,
      });
      if (error) {
        throw new Error(error.message);
      }
      return FormatResponse(res, STATUS_CODES.OK, data[0]);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.obtenerRacha");
    }
  },

  async obtenerLogros(req: Request, res: Response) {
    try {
      const { alumno_id } = req.query;
      if (alumno_id === undefined) {
        throw new Error("Falta el parámetro alumno_id");
      }
      const { data, error } = await client.rpc("obtener_registro_hoy", {
        alumno_id_param: alumno_id || null,
      });
      if (error) {
        throw new Error(error.message);
      }
      return FormatResponse(res, STATUS_CODES.OK, data[0]);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.obtenerLogros");
    }
  },

  async obtenerRegistroSemanal(req: Request, res: Response) {
    try {
      const { alumno_id } = req.query;
      if (alumno_id === undefined) {
        throw new Error("Falta el parámetro alumno_id");
      }
      const { data, error } = await client.rpc("obtener_dias_respondidos", {
        p_alumno_id: alumno_id || null,
      });
      if (error) {
        throw new Error(error.message);
      }
      return FormatResponse(
        res,
        STATUS_CODES.OK,
        data[0].dias_respondidos_json
      );
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },
  async obtenerPerfil(req: Request, res: Response) {
    try {
      const { data: usuario_data, error: error_usuario } = await req.supabase
        .from("usuarios")
        .select(
          "*,nacionalidades(*), idiomas(*),usuarios_colegios(*,colegios(colegio_id,nombre)),personas(persona_id,tipo_documento,numero_documento,nombres,apellidos,genero_id,estado_civil_id,fecha_nacimiento),roles(rol_id,nombre,descripcion,funcionalidades_roles(*,funcionalidad_rol_id,funcionalidades(*,funcionalidad_id)))"
        )
        .eq("usuario_id", req.user.usuario_id)
        .single();
      if (error_usuario) {
        throw new Error(error_usuario.message);
      }

      const data = mapearDatosAlumno(usuario_data);

      const usuario = data.usuario;
      const persona = data.persona;
      const rol = data.rol;
      const funcionalidades = data.funcionalidades;
      const nacionalidad = usuario_data.nacionalidades;
      const { data: alumno_data, error: error_alumno } = await req.supabase
        .from("alumnos")
        .select(
          "perfil_completado ,alumno_id,colegios(nombre , colegio_id),alumnos_apoderados(*,apoderados(*,personas(persona_id,tipo_documento,numero_documento,nombres,apellidos,genero_id,estado_civil_id,fecha_nacimiento)))"
        )
        .eq("persona_id", data.persona.persona_id)
        .single();
      if (error_alumno) {
        throw new Error(error_alumno.message);
      }
      const apoderados = alumno_data.alumnos_apoderados;
      const alumno_id = alumno_data.alumno_id;
      const perfil_completado = alumno_data.perfil_completado;
      return FormatResponse(res, STATUS_CODES.OK, {
        colegio: alumno_data.colegios,
        alumno_id,
        usuario,
        persona,
        rol,
        funcionalidades,
        apoderados,
        nacionalidad,
        perfil_completado,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoService.obtenerPerfil");
    }
  },
};
