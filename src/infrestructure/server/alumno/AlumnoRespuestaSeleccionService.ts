import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import moment from "moment-timezone";
import { ParsedQs } from "qs";
import { AlumnoRespuestaSeleccion } from "../../../core/modelo/preguntasRespuestas/AlumnoRespuestaSeleccion";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { AuditoriaService } from "../../../repos/auditoria/auditoria.service";
import {
  TrazabilidadRepository
} from "../../../repos/auditoria/trazabilidadRepository";
import { DataService } from "../DataService";
import { actualizarAlumnoRespuestaSeleccionService } from "./funciones/AlumnosRespuesta/actulizar";
import { cambiarEstadoRespuestaMultipleService } from "./funciones/AlumnosRespuesta/cambiarEstadoRespuestaMultipleFuntion";
import { cambiarEstadoPreguntaService } from "./funciones/AlumnosRespuesta/omniCambiarEstadoPreguntasFuntion";
import {
  responderAbiertaService,
  responderUnicaService,
} from "./funciones/AlumnosRespuesta/omniresponderFuntion";
import { responderMultipleService } from "./funciones/AlumnosRespuesta/responderMultipleFuntion";
import { CambiarEstadoSchema } from "./shema/CambiarEstadoSchema";
import { RespuestaSchema } from "./shema/RespuestaSchema";

const dataService: DataService<AlumnoRespuestaSeleccion> = new DataService(
  "alumnos_respuestas_seleccion",
  "alumno_respuesta_seleccion_id"
);
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const auditoryRepository = new TrazabilidadRepository(supabaseService);
const auditoryService = new AuditoriaService(auditoryRepository);
export const AlumnoRespuestaSeleccionService = {
  async obtener(req: Request, res: Response) {
    try {
        console.log("[DEBUG] Iniciando método obtener");
        const requestClient = req.supabase ?? client;

        const {
            colegio_id,
            tipo_pregunta_id = 1,
            respondio = false,
            fecha,
            ...where
        } = req.query;

        const fechaValida = Array.isArray(fecha) ? fecha[0] : (fecha as string | undefined);

        const fechaChile = fechaValida
            ? moment.tz(fechaValida, "America/Santiago").format("YYYY-MM-DD")
            : moment.tz("America/Santiago").format("YYYY-MM-DD");

        console.log(`[DEBUG] Fecha utilizada para la comparación: ${fechaChile}`);

        let query = requestClient
            .from("alumnos_respuestas_seleccion")
            .select(
                [
                    "*",
                    "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)",
                    "preguntas(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,nivel_educativo_id,template_code,respuestas_posibles(respuesta_posible_id,nombre,icono))",
                    "respuestas_posibles(*)",
                ].join(",")
            )
            .eq("activo", true)
            .eq("respondio", respondio)
            .gte("fecha_pregunta::date", fechaChile)
            .order("alumno_respuesta_seleccion_id", { ascending: true });

        Object.keys(where).forEach((key) => {
            query = query.eq(key, where[key]);
        });

        const { data, error } = await query.returns<any[]>();

        if (error) {
            throw new Error(`Error en la consulta alumnos_respuestas_seleccion: ${error.message}`);
        }

        let query2 = requestClient
            .from("alumnos_respuestas")
            .select(
                [
                    "*",
                    "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)",
                    "preguntas(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,nivel_educativo_id,template_code)"
                ].join(",")
            )
            .eq("activo", true)
            .eq("respondio", respondio)
            .gte("fecha_pregunta::date", fechaChile)
            .order("alumno_respuesta", { ascending: true });

        Object.keys(where).forEach((key) => {
            query2 = query2.eq(key, where[key]);
        });

        const { data: pabiertas, error: paerror } = await query2.returns<any[]>();

        if (paerror) {
            throw new Error(`Error en la consulta alumnos_respuestas: ${paerror.message}`);
        }

        const preguntas_listado = [...data, ...pabiertas];

        const ordenGrupo: Record<string, number> = {
            Primera: 1,
            Segunda: 2,
            Tercera: 3,
        };

        preguntas_listado.sort((a, b) => {
            // Orden AM → PM
            if (a.preguntas.horario === "AM" && b.preguntas.horario === "PM") {
                return -1;
            }
            if (a.preguntas.horario === "PM" && b.preguntas.horario === "AM") {
                return 1;
            }

            // Si tienen el mismo horario, ordenar por grupo_preguntas
            return (
                (ordenGrupo[a.preguntas.grupo_preguntas] || 99) -
                (ordenGrupo[b.preguntas.grupo_preguntas] || 99)
            );
        });

        res.status(200).json(preguntas_listado);
    } catch (error: any) {
        console.error("[ERROR-HANDLER] Error en AlumnoRespuestaSeleccionService.obtener:", error.message);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const {
        colegio_id, 
        tipo_pregunta_id = 1,
        respondio = false,
        fecha = moment().format("YYYY-MM-DD"),
        ...where
      } = req.query;

      const filtros = {
        colegio_id,
        tipo_pregunta_id,
        respondio,
        fecha,
        ...where,
      };
      const preguntas = await obtenerTodasLasPreguntas(req.supabase, filtros);
      return FormatResponse(res, 200, preguntas);
    } catch (error: any) {
      errorHandler.handleError(error, res, "AlumnoController.obtener");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const requestClient = req.supabase ?? client;
      dataService.setClient(requestClient);

      // 1. Llamar al servicio de negocio para validar y obtener los datos
      const dataToUpdate = await actualizarAlumnoRespuestaSeleccionService(
        requestClient,
        id,
        req.body,
        { actualizado_por: req.actualizado_por }
      );

      // 2. Actualizar el registro en la base de datos
      const updatedRecord = await dataService.updateById(id, dataToUpdate);

      // 3. Enviar la respuesta de éxito
      res.status(200).json(updatedRecord);
    } catch (error: any) {
      // Manejar errores de forma centralizada y con mensajes más específicos
      errorHandler.handleError(
        error,
        res,
        "AlumnoRespuestaSeleccionController.actualizar"
      );
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      dataService.setClient(req.supabase ?? client);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "Curso del alumno eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el curso del alumno:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async responder(req: Request, res: Response) {
    const {
      alumno_id,
      pregunta_id,
      respuesta_posible_id,
      alumno_respuesta_seleccion_id,
    } = req.body;

    if (!alumno_id || !pregunta_id || !respuesta_posible_id) {
      throw new Error("Faltan datos obligatorios.");
    }

    const respuesta = new AlumnoRespuestaSeleccion();
    // respuesta.alumno_respuesta_seleccion_id = alumno_respuesta_seleccion_id;
    respuesta.alumno_id = alumno_id;
    respuesta.pregunta_id = pregunta_id;
    respuesta.respuesta_posible_id = respuesta_posible_id;
    respuesta.respondio = true;

    const requestClient = req.supabase ?? client;
    const { error } = await requestClient
      .from("alumnos_respuestas_seleccion")
      .update({
        respuesta_posible_id: respuesta.respuesta_posible_id,
        respondio: true,
        actualizado_por: req.actualizado_por,
        fecha_actualizacion: new Date(),
        activo: true,
      })
      .match({
        alumno_id: respuesta.alumno_id,
        pregunta_id: respuesta.pregunta_id,
      });

    if (error) {
      throw new Error(error.message);
    }

    res.json({ message: "Respuesta actualizada correctamente." });
  },

  async responderMultiple(req: Request, res: Response) {
    try {
      const result = await responderMultipleService(req.supabase, req.body, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });

      res.status(200).json(result);
    } catch (error: any) {
      errorHandler.handleError(
        error,
        res,
        "RespuestaController.responderMultiple"
      );
    }
  },

  async omniresponder(req: Request, res: Response) {
     let result; // Se declara aquí para que esté en el ámbito del .json() final

    try {
        const { error: validationError, value } = RespuestaSchema.validate(
            req.body,
            { abortEarly: false }
        );

        console.log("omniresponder.body", value);
        
        if (validationError) {
            console.log("validationError", validationError);
            res.status(400).json({
                status: "error",
                details: validationError.details.map((detail) => detail.message),
            });
            return; // 🛑 CORRECTO: Salir después de enviar el error 400.
        }

        const { tipo_pregunta_id, id_registro, ...restOfBody } = value;

        // 💡 Asumimos que 'req.usuario_id' es el ID de la persona que responde.
        const metaData = {
            creado_por: value.usuario_id, // Usar la fuente de autenticación real
            actualizado_por: value.usuario_id,
        };

        // 2. Usar un switch para redirigir al servicio correcto
        switch (tipo_pregunta_id) {
            case 1:
                result = await responderUnicaService(
                    req.supabase,
                    id_registro,
                    restOfBody.respuesta_posible_id,
                    metaData
                );
                break;
            case 2:
                // Nota: Los argumentos de responderMultipleService parecen diferentes.
                // Asegúrate de que este caso use los argumentos correctos.
                result = await responderMultipleService(
                    req.supabase,
                    {
                        alumno_id: restOfBody.alumno_id,
                        pregunta_id: tipo_pregunta_id, // Podrías usar id_registro si es el ID de la pregunta
                        respuestas_posibles: restOfBody.respuestas_posibles,
                    },
                    restOfBody.respuestas_posibles
                );
                break;
            case 3:
                result = await responderAbiertaService(
                    req.supabase,
                    id_registro,
                    restOfBody.respuesta_posible_txt,
                    metaData
                );
                break;
            default:
                
        }
        
      

      
        FormatResponse(res, 200, {
            message: "Respuesta registrada y alumno validado con éxito.",
            result: result || null // Se asegura de que siempre haya un valor para 'result'
        });
    } catch (error) {
        // El error 'La respuesta ya ha sido respondida' viene de uno de tus servicios.
        // Se pasa al manejador de errores centralizado.
        console.error("errorInfo RespuestaController.omniresponder");
        errorHandler.handleError(error, res, "RespuestaController.omniresponder");
    }
  },

  async cambiarEstadoRespuesta(req: Request, res: Response) {
    try {
      const { alumno_id, pregunta_id, nuevo_estado, fecha } = req.body;

      if (!alumno_id || !pregunta_id || typeof nuevo_estado !== "boolean") {
        throw new Error("Faltan datos obligatorios o el estado no es válido.");
      }

      // Usar la fecha proporcionada o la fecha actual como fallback
      const fechaActualizacion = fecha ? new Date(fecha) : new Date();

      const requestClient = req.supabase ?? client;
      const { error } = await requestClient
        .from("alumnos_respuestas_seleccion")
        .update({
          respondio: nuevo_estado,
          fecha_actualizacion: fechaActualizacion,
          activo: true,
        })
        .match({
          alumno_id: alumno_id,
          pregunta_id: pregunta_id,
        });

      if (error) {
        throw new Error(error.message);
      }
      return FormatResponse(res, 200, {
        message: `Estado de respuesta cambiado a ${
          nuevo_estado ? "respondido" : "no respondido"
        } correctamente.`,
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "RespuestaController.cambiarEstadoRespuesta"
      );
    }
  },

  async cambiarEstadoRespuestaMultiple(req: Request, res: Response) {
    try {
      const result = await cambiarEstadoRespuestaMultipleService(
        req.supabase,
        req.body
      );

      // La función de ayuda FormatResponse no es estándar, la reemplazamos con una respuesta HTTP directa.
      return FormatResponse(res, 200, result);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "RespuestaController.cambiarEstadoRespuestaMultiple"
      );
    }
  },

  async omniCambiarEstadoPreguntas(req: Request, res: Response) {
    try {
      // Validar los datos de entrada
      const { error: validationError, value } = CambiarEstadoSchema.validate(
        req.body,
        { abortEarly: false }
      );
      if (validationError) {
        res.status(400).json({
          status: "error",
          details: validationError.details.map((detail) => detail.message),
        });
      }

      const { tipo_pregunta_id, id_registro, nuevo_estado } = value;
      const metaData = { actualizado_por: req.actualizado_por };

      // Llamar al servicio de negocio
      const result = await cambiarEstadoPreguntaService(
        req.supabase,
        tipo_pregunta_id,
        id_registro,
        nuevo_estado,
        metaData
      );
      return FormatResponse(res, 200, result);
    } catch (error: any) {
      // Manejo de errores centralizado
      errorHandler.handleError(
        error,
        res,
        "RespuestaController.omniCambiarEstadoPreguntas"
      );
    }
  },
};
function obtenerTodasLasPreguntas(
  supabase: SupabaseClient<any, "public", any>,
  filtros: {
    colegio_id: string | ParsedQs | (string | ParsedQs)[] | undefined;
    tipo_pregunta_id: string | number | ParsedQs | (string | ParsedQs)[];
    respondio: string | boolean | ParsedQs | (string | ParsedQs)[];
    fecha: string | ParsedQs | (string | ParsedQs)[];
  }
) {
  throw new Error("Function not implemented.");
}

// auxiliares

function parseQueryParams(query: any) {
  const {
    colegio_id, // NO SE USA, DEJA POR COMO TRABAJA EL FRONT
    tipo_pregunta_id = 1,
    respondio = false,
    fecha = moment().format("YYYY-MM-DD"),
    ...where
  } = query;

  return {
    tipo_pregunta_id,
    respondio: respondio === "true" || respondio === true,
    fecha,
    where,
  };
}

/**
 * Determina si es horario AM o PM según la hora actual
 */
function determinarHorario(): "AM" | "PM" {
  const horaActual = moment().hour();

  // Definir horarios - puedes ajustar según necesidades
  // AM: 5:00 - 13:59 (5 AM a 1:59 PM)
  // PM: 14:00 - 4:59 (2:00 PM a 4:59 AM del día siguiente)

  if (horaActual >= 5 && horaActual < 12) {
    return "AM";
  } else {
    return "PM";
  }
}

/**
 * Obtiene preguntas de selección con filtro de horario
 */
async function obtenerPreguntasSeleccion(
  queryParams: any,
  horario: "AM" | "PM"
): Promise<any[]> {
  const { respondio, fecha, where } = queryParams;

  const query = client
    .from("alumnos_respuestas_seleccion")
    .select(
      [
        "*",
        "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)",
        "preguntas!inner(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,nivel_educativo_id,template_code,respuestas_posibles(respuesta_posible_id,nombre,icono))",
        "respuestas_posibles(respuesta_posible_id,nombre)",
      ].join(",")
    )
    .eq("activo", true)
    .eq("respondio", respondio)
    // FILTRO POR HORARIO
    .gte("fecha_pregunta::date", fecha)
    .order("alumno_respuesta_seleccion_id", { ascending: true })
    .order("preguntas.horario", { ascending: false });
  // Aplicar filtros adicionales
  applyWhereFilters(query, where);

  const { data, error } = await query.returns<any[]>();

  if (error) {
    throw new Error(`Error en preguntas de selección: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene preguntas abiertas con filtro de horario
 */
async function obtenerPreguntasAbiertas(
  queryParams: any,
  horario: "AM" | "PM"
): Promise<any[]> {
  const { respondio, fecha, where } = queryParams;

  const query = client
    .from("alumnos_respuestas")
    .select(
      [
        "*",
        "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)",
        "preguntas!inner(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,nivel_educativo_id,template_code)",
      ].join(",")
    )
    .eq("activo", true)
    .eq("respondio", respondio)
    .eq("preguntas.horario", horario) // FILTRO POR HORARIO
    .gte("fecha_pregunta::date", fecha)
    .order("alumno_respuesta", { ascending: true });

  // Aplicar filtros adicionales
  applyWhereFilters(query, where);

  const { data, error } = await query.returns<any[]>();

  if (error) {
    throw new Error(`Error en preguntas abiertas: ${error.message}`);
  }

  return data || [];
}

/**
 * Aplica filtros WHERE dinámicos a la query
 */
function applyWhereFilters(query: any, whereFilters: any): void {
  Object.keys(whereFilters).forEach((key) => {
    if (whereFilters[key] !== undefined && whereFilters[key] !== null) {
      query = query.eq(key, whereFilters[key]);
    }
  });
}

/**
 * Combina y organiza las preguntas de ambos tipos
 */
function combinarPreguntas(
  preguntasSeleccion: any[],
  preguntasAbiertas: any[]
): any[] {
  const todasLasPreguntas = [...preguntasSeleccion, ...preguntasAbiertas];

  // Ordenar por fecha_creacion o cualquier criterio que prefieras
  return todasLasPreguntas.sort((a, b) => {
    const fechaA = new Date(a.fecha_creacion);
    const fechaB = new Date(b.fecha_creacion);
    return fechaA.getTime() - fechaB.getTime();
  });
}

/**
 * Maneja errores de forma consistente
 */
function handleError(error: any, res: Response): void {
  console.error("Error al obtener preguntas:", error);

  const statusCode = error.statusCode || 500;
  const message = error.message || "Error interno del servidor";

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
}

// ================= VERSIÓN ALTERNATIVA CON HORARIO PERSONALIZABLE =================

/**
 * Versión alternativa que permite especificar el horario como parámetro
 */
async function obtenerConHorarioEspecifico(req: Request, res: Response) {
  try {
    const queryParams = parseQueryParams(req.query);

    // Permitir override del horario via query param
    const horarioSolicitado = req.query.horario as "AM" | "PM" | undefined;
    const horarioActual = horarioSolicitado || determinarHorario();

    console.log(
      `Obteniendo preguntas para horario: ${horarioActual} ${
        horarioSolicitado ? "(especificado)" : "(automático)"
      }`
    );

    const [preguntasSeleccion, preguntasAbiertas] = await Promise.all([
      obtenerPreguntasSeleccion(queryParams, horarioActual),
      obtenerPreguntasAbiertas(queryParams, horarioActual),
    ]);

    const preguntasListado = combinarPreguntas(
      preguntasSeleccion,
      preguntasAbiertas
    );

    res.status(200).json({
      data: preguntasListado,
      horario: horarioActual,
      hora_servidor: moment().format("HH:mm:ss"),
      total: preguntasListado.length,
      tipos: {
        seleccion: preguntasSeleccion.length,
        abiertas: preguntasAbiertas.length,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
}

// ================= CONFIGURACIÓN DE HORARIOS PERSONALIZABLE =================

interface HorarioConfig {
  AM: { inicio: number; fin: number };
  PM: { inicio: number; fin: number };
}

const HORARIO_CONFIG: HorarioConfig = {
  AM: { inicio: 5, fin: 13 }, // 5:00 AM a 1:59 PM
  PM: { inicio: 14, fin: 4 }, // 2:00 PM a 4:59 AM (siguiente día)
};
