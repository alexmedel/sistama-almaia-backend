import { Request, Response } from "express";
import { AlertData } from "../../../core/modelo/dashboard/AlertData";
import { Emotion } from "../../../core/modelo/dashboard/Emotion";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  mapearEmocionGrado,
  mapearGestorAlertasHoy,
  mapearPatologiaGrado,
} from "../../../core/services/DashboardServiceCasoUso";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { obtenerClienteRequest, resolverColegioDashboard } from "./dashboardAuth";

const MemoryCache = {
  data: new Map<string, { value: any; expiry: number }>(),
  get(key: string) {
    const item = this.data.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  },
  set(key: string, value: any, ttlSeconds: number) {
    this.data.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  },
};

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const COLOR_FALLBACKS: Record<string, string> = {
  "Adicciones conductuales": "#8D6E63",
  "Aislamiento social, bullying y ciberacoso": "#D81B60",
  "Ansiedad infantil y adolescente": "#FF8A65",
  "Autolesiones, pensamientos rumiantes o de daño": "#546E7A",
  "Trastorno de estrés postraumático y trauma complejo": "#6D4C41",
  "Trastornos de conducta alimentaria (TCA)": "#FFB300",
  "Trastornos del sueño": "#607D8B",
};

function parsePositiveInteger(value: unknown, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return max ? Math.min(parsed, max) : parsed;
}

function parsePeso(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (![0, 1, 2].includes(parsed)) {
    throw new Error("peso inválido. Usa 0, 1 o 2");
  }

  return parsed;
}

function parseOptionalInteger(value: unknown) {
  if (value === undefined || value === null || value === "" || value === "Todos") {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getDateRange(query: Request["query"]) {
  if (query.fecha_desde && query.fecha_hasta) {
    const hastaDate = new Date(String(query.fecha_hasta));
    hastaDate.setDate(hastaDate.getDate() + 1);
    return {
      desde: String(query.fecha_desde),
      hasta: String(query.fecha_hasta),
      hastaExclusivo: hastaDate.toISOString().slice(0, 10),
    };
  }

  const year = parseOptionalInteger(query.anio ?? query.year);
  const month = parseOptionalInteger(query.mes ?? query.month);

  if (!year) return null;

  const startMonth = month ?? 1;
  const endMonth = month ?? 12;
  const desde = new Date(Date.UTC(year, startMonth - 1, 1));
  const hasta = new Date(Date.UTC(year, endMonth, 0));
  const hastaExclusivo = new Date(Date.UTC(year, endMonth, 1));

  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
    hastaExclusivo: hastaExclusivo.toISOString().slice(0, 10),
  };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

async function getColorMap(requestClient: SupabaseClient) {
  const cacheKey = "colorMap";
  const cached = MemoryCache.get(cacheKey);
  if (cached) return cached;

  const colors: Record<string, string> = { ...COLOR_FALLBACKS };
  const { data, error } = await requestClient
    .from("diagnostico")
    .select("subcategoria, hex")
    .eq("activo", true);

  if (error) {
    console.error("Error al obtener paleta de colores:", error);
    return colors;
  }

  (data || []).forEach((row: any) => {
    if (row.subcategoria && row.hex) {
      colors[row.subcategoria] = row.hex;
    }
  });

  MemoryCache.set(cacheKey, colors, 3600); // 1 hora
  return colors;
}

function pickColor(colors: Record<string, string>, label: string) {
  const exact = colors[label];
  if (exact) return exact;

  const normalizedLabel = normalizeKey(label);
  const found = Object.entries(colors).find(
    ([name]) => normalizeKey(name) === normalizedLabel
  );

  return found?.[1] ?? "#90A4AE";
}

function withColors(rows: any[], colors: Record<string, string>) {
  if (!rows.length) return rows;

  const usedColors: Record<string, string> = {};
  rows.forEach((row) => {
    Object.keys(row)
      .filter((key) => key !== "name" && key !== "__colors")
      .forEach((key) => {
        usedColors[key] = pickColor(colors, key);
      });
  });

  return rows.map((row) => ({
    ...row,
    __colors: usedColors,
  }));
}

function isAlertAttended(alerta: any) {
  return String(alerta?.estado || "").toUpperCase() === "ATENDIDA";
}

function isAlertExpired(alerta: any) {
  if (isAlertAttended(alerta) || !alerta?.fecha_generada) {
    return false;
  }

  const resolutionDays = Number(
    alerta.alertas_tipos?.tiempo_resolucion ?? alerta.tiempo_resolucion ?? 0
  );
  if (!Number.isFinite(resolutionDays) || resolutionDays <= 0) {
    return false;
  }

  const dueDate = new Date(alerta.fecha_generada);
  dueDate.setDate(dueDate.getDate() + resolutionDays);

  return dueDate.getTime() < Date.now();
}

function uniqueByAlertId(rows: any[]) {
  return Array.from(
    new Map(rows.map((row) => [row.alumno_alerta_id, row])).values()
  );
}

export const DashboardComparativaService = {
  async getEmotionsDataCourse(req: Request, res: Response) {
    try {
      const { nivel_id, curso_id } = req.query;
      
      const cursoId = Number(curso_id);
      if (!Number.isInteger(cursoId) || cursoId <= 0) {
        FormatResponse(res, 400, "curso_id requerido y válido");
        return;
      }
      
      req.query.anio = req.query.anio ?? req.query.año;
      const range = getDateRange(req.query);
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const colors = await getColorMap(requestClient);

      let query = requestClient
        .from("alumnos_respuestas_seleccion")
        .select(`
          fecha_pregunta,
          pregunta_id,
          respuesta_posible_id,
          preguntas!inner(
            diagnostico
          ),
          alumnos!inner(
            colegio_id,
            alumnos_cursos!inner(
              activo,
              cursos!inner(
                curso_id,
                nombre_curso,
                nivel_educativo_id,
                niveles_educativos(
                  nombre
                )
              )
            )
          )
        `)
        .eq("tipo_concepto", "Emociones")
        .eq("activo", true)
        .eq("respondio", true)
        .not("respuesta_posible_id", "is", null)
        .eq("alumnos.colegio_id", colegioId)
        .eq("alumnos.alumnos_cursos.activo", true)
        .eq("alumnos.alumnos_cursos.cursos.curso_id", cursoId);

      if (nivel_id) {
        query = query.eq("alumnos.alumnos_cursos.cursos.nivel_educativo_id", nivel_id);
      }

      if (range) {
        query = query.gte("fecha_pregunta", range.desde).lt("fecha_pregunta", range.hastaExclusivo);
      }

      const { data: rawData, error } = await query;

      if (error) {
        console.error("Error al obtener emociones del curso:", error);
        throw error;
      }

      if (!rawData?.length) {
        res.json({ curso: "", nivel: "", periodo: "", emociones: [] });
        return;
      }

      const primerRegistro = rawData[0] as any;
      const cursoData = primerRegistro.alumnos?.alumnos_cursos?.[0]?.cursos;
      const cursoNombre = cursoData?.nombre_curso || "";
      const nivelNombre = cursoData?.niveles_educativos?.nombre || "";

      let periodoTexto = "Todo el periodo";
      if (range) {
        const year = req.query.anio || req.query.year;
        const mes = req.query.mes || req.query.month;
        if (year && mes) {
           const date = new Date(Number(year), Number(mes) - 1, 1);
           const mesNombre = date.toLocaleString('es-ES', { month: 'long' });
           periodoTexto = `${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} ${year}`;
        } else {
           periodoTexto = `${range.desde} al ${range.hasta}`;
        }
      }

      const totalRespuestas = rawData.length;
      const countsMap: { [key: string]: number } = {};

      rawData.forEach((row: any) => {
        const diagnostico = row.preguntas?.diagnostico?.trim();
        if (diagnostico) {
          countsMap[diagnostico] = (countsMap[diagnostico] || 0) + 1;
        }
      });

      const emociones = Object.entries(countsMap)
        .map(([name, value]) => ({
          name,
          value,
          color: pickColor(colors, name),
          porcentaje: Number(((value / totalRespuestas) * 100).toFixed(1))
        }))
        .sort((a, b) => b.value - a.value);

      res.json({
        curso: cursoNombre,
        nivel: nivelNombre,
        periodo: periodoTexto,
        emociones
      });
      return;

    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.getEmotionsDataCourse"
      );
    }
  },

  async obtenerAniosDisponibles(req: Request, res: Response) {
    try {
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);

      // Usamos alumnos_respuestas_seleccion y consultamos fecha_pregunta
      const { data, error } = await requestClient
        .from("alumnos_respuestas_seleccion")
        .select(`
          fecha_pregunta,
          alumnos!inner(colegio_id)
        `)
        .eq("activo", true)
        .eq("respondio", true)
        .eq("alumnos.colegio_id", colegioId)
        .not("fecha_pregunta", "is", null);

      if (error) {
        console.error("Error al obtener años disponibles:", error);
        throw error;
      }

      // Extraer el año de la fecha_pregunta y hacerlos únicos
      const aniosUnicos = Array.from(
        new Set(
          data?.map((row) => {
            if (!row.fecha_pregunta) return null;
            return Number(String(row.fecha_pregunta).slice(0, 4));
          }).filter(a => typeof a === "number" && Number.isInteger(a))
        )
      ).sort((a, b) => (a as number) - (b as number));

      res.json(aniosUnicos);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.obtenerAniosDisponibles"
      );
    }
  },

  async obtenerGestorAlertasHoy(req: Request, res: Response) {
    try {
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const { grado_id, curso_id } = req.query;
      const gradoId = parseOptionalInteger(grado_id);
      const cursoId = parseOptionalInteger(curso_id);
      const range = getDateRange(req.query);

      let query = requestClient
        .from("alumnos_alertas")
        .select(`
          alumno_alerta_id,
          fecha_generada,
          fecha_resolucion,
          estado,
          alertas_tipos(
            tiempo_resolucion
          ),
          alumnos!inner(
            colegio_id,
            alumnos_cursos!inner(
              activo,
              cursos!inner(
                curso_id,
                grado_id
              )
            )
          )
        `)
        .eq("activo", true)
        .eq("alumnos.colegio_id", colegioId)
        .eq("alumnos.alumnos_cursos.activo", true);

      if (gradoId) {
        query = query.eq("alumnos.alumnos_cursos.cursos.grado_id", gradoId);
      }
      if (cursoId) {
        query = query.eq("alumnos.alumnos_cursos.cursos.curso_id", cursoId);
      }
      if (range) {
        query = query.gte("fecha_generada", range.desde).lt("fecha_generada", range.hastaExclusivo);
      }

      const { data: alertas, error } = await query;
      if (error) {
        console.error("Error al obtener cantidades:", error);
        throw error;
      }

      const grouped = new Map<string, any>();
      uniqueByAlertId(alertas || []).forEach((alerta: any) => {
        if (!alerta.fecha_generada) return;
        const mes = String(alerta.fecha_generada).slice(0, 7);
        const current = grouped.get(mes) || {
          mes,
          alertas_vencidas: 0,
          alertas_atendidas: 0,
          alertas_pendientes: 0,
        };

        if (isAlertExpired(alerta)) {
          current.alertas_vencidas++;
        } else if (isAlertAttended(alerta)) {
          current.alertas_atendidas++;
        } else {
          current.alertas_pendientes++;
        }

        grouped.set(mes, current);
      });

      return FormatResponse(
        res,
        200,
        mapearGestorAlertasHoy(
          Array.from(grouped.values()).sort((a, b) => a.mes.localeCompare(b.mes))
        )
      );
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.obtenerGestorAlertasHoy"
      );
    }
  },
  async obtenerGestorHistorial(req: Request, res: Response) {
    try {
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const { grado_id, curso_id } = req.query;
      const gradoId = parseOptionalInteger(grado_id);
      const cursoId = parseOptionalInteger(curso_id);
      const range = getDateRange(req.query);

      let query = requestClient
        .from("alumnos_alertas_bitacoras")
        .select(`
          fecha_creacion,
          alumno_alerta_id,
          alumnos_alertas!inner(
            alumno_alerta_id,
            fecha_generada,
            fecha_resolucion,
            estado,
            alertas_tipos(
              tiempo_resolucion
            ),
            alumnos!inner(
              colegio_id,
              alumnos_cursos!inner(
                activo,
                cursos!inner(
                  curso_id,
                  grado_id
                )
              )
            )
          )
        `)
        .eq("activo", true)
        .eq("alumnos_alertas.alumnos.colegio_id", colegioId)
        .eq("alumnos_alertas.alumnos.alumnos_cursos.activo", true);

      if (gradoId) {
        query = query.eq("alumnos_alertas.alumnos.alumnos_cursos.cursos.grado_id", gradoId);
      }
      if (cursoId) {
        query = query.eq("alumnos_alertas.alumnos.alumnos_cursos.cursos.curso_id", cursoId);
      }
      if (range) {
        query = query.gte("fecha_creacion", range.desde).lt("fecha_creacion", range.hastaExclusivo);
      }

      const { data: bitacoras, error } = await query;
      if (error) {
        console.error("Error al obtener cantidades:", error);
        throw error;
      }

      const grouped = new Map<string, any>();
      (bitacoras || []).forEach((bitacora: any) => {
        if (!bitacora.fecha_creacion) return;
        const alerta = bitacora.alumnos_alertas;
        const mes = String(bitacora.fecha_creacion).slice(0, 7);
        const current = grouped.get(mes) || {
          mes,
          alertas_vencidas: 0,
          alertas_atendidas: 0,
          alertas_pendientes: 0,
        };

        if (isAlertExpired(alerta)) {
          current.alertas_vencidas++;
        } else if (isAlertAttended(alerta)) {
          current.alertas_atendidas++;
        } else {
          current.alertas_pendientes++;
        }

        grouped.set(mes, current);
      });

      const data: AlertData[] = mapearGestorAlertasHoy(
        Array.from(grouped.values()).sort((a, b) => a.mes.localeCompare(b.mes))
      );
      res.json(data);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.obtenerGestorHistorial"
      );
    }
  },
  async obtenerEmocionesGrado(req: Request, res: Response) {
    try {
      const { grado_id, curso_id, limit, peso } = req.query;
      const gradoId = Number(grado_id);
      if (!Number.isInteger(gradoId) || gradoId <= 0) {
        return FormatResponse(res, 400, "grado_id inválido");
      }

      const limiteDiagnosticos = parsePositiveInteger(limit, 10, 10);
      const pesoObjetivo = parsePeso(peso);
      const cursoId = parseOptionalInteger(curso_id);
      const range = getDateRange(req.query);
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const cacheKey = `emocionesGrado:${colegioId}:${req.originalUrl}`;
      const cached = MemoryCache.get(cacheKey);
      if (cached) {
        return FormatResponse(res, 200, cached);
      }
      const colors = await getColorMap(requestClient);
      let query = requestClient
        .from("alumnos_respuestas_seleccion")
        .select(`
          fecha_pregunta,
          pregunta_id,
          respuesta_posible_id,
          preguntas!inner(
            diagnostico
          ),
          alumnos!inner(
            colegio_id,
            alumnos_cursos!inner(
              ano_escolar,
              activo,
              cursos!inner(
                curso_id,
                nombre_curso,
                grado_id,
                grados!inner(
                  nombre
                )
              )
            )
          )
        `)
        .eq("tipo_concepto", "Emociones")
        .eq("activo", true)
        .eq("respondio", true)
        .not("respuesta_posible_id", "is", null)
        .eq("alumnos.colegio_id", colegioId)
        .eq("alumnos.alumnos_cursos.activo", true)
        .eq("alumnos.alumnos_cursos.cursos.grado_id", gradoId);

      if (cursoId) {
        query = query.eq("alumnos.alumnos_cursos.cursos.curso_id", cursoId);
      }
      if (range) {
        query = query.gte("fecha_pregunta", range.desde).lt("fecha_pregunta", range.hastaExclusivo);
      }

      const { data: rawData, error } = await query;

      if (error) {
        console.error("Error al obtener cantidades de emociones por grado:", error);
        throw error;
      }

      if (!rawData?.length) {
        return FormatResponse(res, 200, []);
      }

      const preguntaIds = Array.from(
        new Set(
          rawData
            .map((row: any) => Number(row.pregunta_id))
            .filter((id: number) => Number.isInteger(id))
        )
      );

      const { data: pesosData, error: pesosError } = await requestClient
        .from("respuestas_posibles_has_preguntas")
        .select("pregunta_id, respuesta_posible_id, peso")
        .eq("activo", true)
        .in("pregunta_id", preguntaIds);

      if (pesosError) {
        console.error("Error al obtener pesos de respuestas por pregunta:", pesosError);
        throw pesosError;
      }

      const pesoPorPreguntaRespuesta = new Map<string, number>();
      (pesosData || []).forEach((row: any) => {
        pesoPorPreguntaRespuesta.set(
          `${row.pregunta_id}:${row.respuesta_posible_id}`,
          Number(row.peso)
        );
      });

      const countsMap: { [key: string]: any } = {};
      const totalPerCurso: { [key: number]: number } = {};
      const totalPerDiagnostico: { [key: string]: number } = {};

      rawData.forEach((row: any) => {
        const respuestaPeso = pesoPorPreguntaRespuesta.get(
          `${row.pregunta_id}:${row.respuesta_posible_id}`
        );

        if (pesoObjetivo !== null && respuestaPeso !== pesoObjetivo) {
          return;
        }

        const diagnostico = row.preguntas?.diagnostico?.trim();
        if (!diagnostico) return;
        
        const enrollment = row.alumnos?.alumnos_cursos?.[0];
        if (!enrollment) return;
        
        const curso = enrollment.cursos;
        if (!curso) return;
        
        const cId = curso.curso_id;
        const cNombre = curso.nombre_curso;
        const gId = curso.grado_id;
        const gNombre = curso.grados?.nombre || "";
        
        const key = `${cId}:${diagnostico}`;
        if (!countsMap[key]) {
          countsMap[key] = {
            curso_id: cId,
            curso_nombre: cNombre,
            grado_id: gId,
            grado_nombre: gNombre,
            respuesta_nombre: diagnostico,
            cantidad: 0,
            porcentaje: 0
          };
        }
        countsMap[key].cantidad++;
        totalPerCurso[cId] = (totalPerCurso[cId] || 0) + 1;
        totalPerDiagnostico[diagnostico] = (totalPerDiagnostico[diagnostico] || 0) + 1;
      });

      const diagnosticosPermitidos = new Set(
        Object.entries(totalPerDiagnostico)
          .sort(([, cantidadA], [, cantidadB]) => cantidadB - cantidadA)
          .slice(0, limiteDiagnosticos)
          .map(([diagnostico]) => diagnostico)
      );

      const data_emociones = Object.values(countsMap)
        .filter((item: any) => diagnosticosPermitidos.has(item.respuesta_nombre))
        .map((item: any) => {
          const total = totalPerCurso[item.curso_id] || 1;
          item.porcentaje = (item.cantidad / total) * 100;
          return item;
        });

      const responseData = withColors(mapearEmocionGrado(data_emociones), colors);
      MemoryCache.set(cacheKey, responseData, 60); // Cache 60 segundos
      return FormatResponse(res, 200, responseData);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.obtenerEmocionesGrado"
      );
    }
  },
  async obtenerPatologiasGrado(req: Request, res: Response) {
    try {
      const { grado_id, curso_id, limit, peso } = req.query;
      const gradoId = Number(grado_id);
      if (!Number.isInteger(gradoId) || gradoId <= 0) {
        return FormatResponse(res, 400, "grado_id inválido");
      }

      const limiteDiagnosticos = parsePositiveInteger(limit, 10, 10);
      const pesoObjetivo = parsePeso(peso);
      const cursoId = parseOptionalInteger(curso_id);
      const range = getDateRange(req.query);
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const cacheKey = `patologiasGrado:${colegioId}:${req.originalUrl}`;
      const cached = MemoryCache.get(cacheKey);
      if (cached) {
        return FormatResponse(res, 200, cached);
      }
      const colors = await getColorMap(requestClient);

      let query = requestClient
        .from("alumnos_respuestas_seleccion")
        .select(`
          fecha_pregunta,
          pregunta_id,
          respuesta_posible_id,
          preguntas!inner(
            diagnostico
          ),
          alumnos!inner(
            colegio_id,
            alumnos_cursos!inner(
              activo,
              cursos!inner(
                curso_id,
                nombre_curso,
                grado_id,
                grados!inner(
                  nombre
                )
              )
            )
          )
        `)
        .eq("tipo_concepto", "Patologica")
        .eq("activo", true)
        .eq("respondio", true)
        .not("respuesta_posible_id", "is", null)
        .eq("alumnos.colegio_id", colegioId)
        .eq("alumnos.alumnos_cursos.activo", true)
        .eq("alumnos.alumnos_cursos.cursos.grado_id", gradoId);

      if (cursoId) {
        query = query.eq("alumnos.alumnos_cursos.cursos.curso_id", cursoId);
      }
      if (range) {
        query = query.gte("fecha_pregunta", range.desde).lt("fecha_pregunta", range.hastaExclusivo);
      }

      const { data: rawData, error } = await query;
      if (error) {
        console.error("Error al obtener cantidades:", error);
        throw error;
      }

      if (!rawData?.length) {
        return FormatResponse(res, 200, []);
      }

      const preguntaIds = Array.from(
        new Set(
          rawData
            .map((row: any) => Number(row.pregunta_id))
            .filter((id: number) => Number.isInteger(id))
        )
      );

      const { data: pesosData, error: pesosError } = await requestClient
        .from("respuestas_posibles_has_preguntas")
        .select("pregunta_id, respuesta_posible_id, peso")
        .eq("activo", true)
        .in("pregunta_id", preguntaIds);

      if (pesosError) {
        console.error("Error al obtener pesos de respuestas por pregunta:", pesosError);
        throw pesosError;
      }

      const pesoPorPreguntaRespuesta = new Map<string, number>();
      (pesosData || []).forEach((row: any) => {
        pesoPorPreguntaRespuesta.set(
          `${row.pregunta_id}:${row.respuesta_posible_id}`,
          Number(row.peso)
        );
      });

      const countsMap: { [key: string]: any } = {};
      const totalPerCurso: { [key: number]: number } = {};
      const totalPerDiagnostico: { [key: string]: number } = {};

      rawData.forEach((row: any) => {
        const respuestaPeso = pesoPorPreguntaRespuesta.get(
          `${row.pregunta_id}:${row.respuesta_posible_id}`
        );

        if (pesoObjetivo !== null && respuestaPeso !== pesoObjetivo) {
          return;
        }

        const diagnostico = row.preguntas?.diagnostico?.trim();
        if (!diagnostico) return;

        const enrollment = row.alumnos?.alumnos_cursos?.[0];
        const curso = enrollment?.cursos;
        if (!curso) return;

        const key = `${curso.curso_id}:${diagnostico}`;
        if (!countsMap[key]) {
          countsMap[key] = {
            curso_id: curso.curso_id,
            curso_nombre: curso.nombre_curso,
            grado_id: curso.grado_id,
            grado_nombre: curso.grados?.nombre || "",
            diagnostico,
            respuesta_id: row.respuesta_posible_id,
            cantidad: 0,
            porcentaje: 0,
          };
        }
        countsMap[key].cantidad++;
        totalPerCurso[curso.curso_id] = (totalPerCurso[curso.curso_id] || 0) + 1;
        totalPerDiagnostico[diagnostico] = (totalPerDiagnostico[diagnostico] || 0) + 1;
      });

      const diagnosticosPermitidos = new Set(
        Object.entries(totalPerDiagnostico)
          .sort(([, cantidadA], [, cantidadB]) => cantidadB - cantidadA)
          .slice(0, limiteDiagnosticos)
          .map(([diagnostico]) => diagnostico)
      );

      const dataPatologias = Object.values(countsMap)
        .filter((item: any) => diagnosticosPermitidos.has(item.diagnostico))
        .map((item: any) => {
          const total = totalPerCurso[item.curso_id] || 1;
          item.porcentaje = (item.cantidad / total) * 100;
          return item;
        });

      const responseData = withColors(mapearPatologiaGrado(dataPatologias), colors);
      MemoryCache.set(cacheKey, responseData, 60); // Cache 60 segundos
      return FormatResponse(res, 200, responseData);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.obtenerPatologiasGrado"
      );
    }
  },
  async obtenerNeurodivergenciasGrado(req: Request, res: Response) {
    try {
      const { grado_id, curso_id, limit, peso } = req.query;
      const gradoId = Number(grado_id);
      if (!Number.isInteger(gradoId) || gradoId <= 0) {
        return FormatResponse(res, 400, "grado_id inválido");
      }

      const limiteDiagnosticos = parsePositiveInteger(limit, 10, 10);
      const pesoObjetivo = parsePeso(peso);
      const cursoId = parseOptionalInteger(curso_id);
      const range = getDateRange(req.query);
      const requestClient = obtenerClienteRequest(req, client);
      const colegioId = await resolverColegioDashboard(req, requestClient);
      const cacheKey = `neuroGrado:${colegioId}:${req.originalUrl}`;
      const cached = MemoryCache.get(cacheKey);
      if (cached) {
        return FormatResponse(res, 200, cached);
      }
      const colors = await getColorMap(requestClient);

      let query = requestClient
        .from("alumnos_respuestas_seleccion")
        .select(`
          fecha_pregunta,
          pregunta_id,
          respuesta_posible_id,
          preguntas!inner(
            diagnostico
          ),
          alumnos!inner(
            colegio_id,
            alumnos_cursos!inner(
              activo,
              cursos!inner(
                curso_id,
                nombre_curso,
                grado_id,
                grados!inner(
                  nombre
                )
              )
            )
          )
        `)
        .eq("tipo_concepto", "Neurodivergencia")
        .eq("activo", true)
        .eq("respondio", true)
        .not("respuesta_posible_id", "is", null)
        .eq("alumnos.colegio_id", colegioId)
        .eq("alumnos.alumnos_cursos.activo", true)
        .eq("alumnos.alumnos_cursos.cursos.grado_id", gradoId);

      if (cursoId) {
        query = query.eq("alumnos.alumnos_cursos.cursos.curso_id", cursoId);
      }
      if (range) {
        query = query.gte("fecha_pregunta", range.desde).lt("fecha_pregunta", range.hastaExclusivo);
      }

      const { data: rawData, error } = await query;
      if (error) {
        console.error("Error al obtener neurodivergencias:", error);
        throw error;
      }

      if (!rawData?.length) {
        return FormatResponse(res, 200, []);
      }

      const preguntaIds = Array.from(
        new Set(
          rawData
            .map((row: any) => Number(row.pregunta_id))
            .filter((id: number) => Number.isInteger(id))
        )
      );

      const { data: pesosData, error: pesosError } = await requestClient
        .from("respuestas_posibles_has_preguntas")
        .select("pregunta_id, respuesta_posible_id, peso")
        .eq("activo", true)
        .in("pregunta_id", preguntaIds);

      if (pesosError) {
        console.error("Error al obtener pesos de respuestas por pregunta:", pesosError);
        throw pesosError;
      }

      const pesoPorPreguntaRespuesta = new Map<string, number>();
      (pesosData || []).forEach((row: any) => {
        pesoPorPreguntaRespuesta.set(
          `${row.pregunta_id}:${row.respuesta_posible_id}`,
          Number(row.peso)
        );
      });

      const countsMap: { [key: string]: any } = {};
      const totalPerCurso: { [key: number]: number } = {};
      const totalPerDiagnostico: { [key: string]: number } = {};

      rawData.forEach((row: any) => {
        const respuestaPeso = pesoPorPreguntaRespuesta.get(
          `${row.pregunta_id}:${row.respuesta_posible_id}`
        );

        if (pesoObjetivo !== null && respuestaPeso !== pesoObjetivo) {
          return;
        }

        const diagnostico = row.preguntas?.diagnostico?.trim();
        if (!diagnostico) return;

        const enrollment = row.alumnos?.alumnos_cursos?.[0];
        const curso = enrollment?.cursos;
        if (!curso) return;

        const key = `${curso.curso_id}:${diagnostico}`;
        if (!countsMap[key]) {
          countsMap[key] = {
            curso_id: curso.curso_id,
            curso_nombre: curso.nombre_curso,
            grado_id: curso.grado_id,
            grado_nombre: curso.grados?.nombre || "",
            diagnostico,
            respuesta_id: row.respuesta_posible_id,
            cantidad: 0,
            porcentaje: 0,
          };
        }
        countsMap[key].cantidad++;
        totalPerCurso[curso.curso_id] = (totalPerCurso[curso.curso_id] || 0) + 1;
        totalPerDiagnostico[diagnostico] = (totalPerDiagnostico[diagnostico] || 0) + 1;
      });

      const diagnosticosPermitidos = new Set(
        Object.entries(totalPerDiagnostico)
          .sort(([, cantidadA], [, cantidadB]) => cantidadB - cantidadA)
          .slice(0, limiteDiagnosticos)
          .map(([diagnostico]) => diagnostico)
      );

      const dataNeurodivergencias = Object.values(countsMap)
        .filter((item: any) => diagnosticosPermitidos.has(item.diagnostico))
        .map((item: any) => {
          const total = totalPerCurso[item.curso_id] || 1;
          item.porcentaje = (item.cantidad / total) * 100;
          return item;
        });

      const responseData = withColors(mapearPatologiaGrado(dataNeurodivergencias), colors);
      MemoryCache.set(cacheKey, responseData, 60); // Cache 60 segundos
      return FormatResponse(res, 200, responseData);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "DashboardComparativaService.obtenerNeurodivergenciasGrado"
      );
    }
  },
};
