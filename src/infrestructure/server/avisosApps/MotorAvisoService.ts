import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import { STATUS_CODES } from "../../../../types/status_code";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { CustomError, ErrorCodes, errorHandler } from "../../../helpers/ErrorResponse";
import { createPaginationFromSupabase, optionPaginationSupabase, validatePagination } from "../../../helpers/paginate-supabase";
import { FormatResponse } from "../../../helpers/Response";
import NotificationPushService from "../../../repos/notification_push/notification_push.service";
import {
  insertarAviso,
  insertarDestinatarios,
  insertarPalabrasClave,
  marcarAvisoComoLeido,
  obtenerMisNotificaciones,
  subirArchivoSupabase,
  crearAvisoApp
} from "./funciones/funcionesAviso";
import { enviarNotificacionesPendientes } from "./services/NotificacionProgramadaSender";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();
const supabaseAdminService = new SupabaseAdminService();
const adminClient = supabaseAdminService.getClient();

export const AvisosService = {
  async crear(req: Request, res: Response): Promise<void> {
    let avisoId: number | null = null;
    try {
      console.log("[AVISO-CREAR] content-type:", req.headers["content-type"]);
      console.log("[AVISO-CREAR] req.file:", req.file ? { fieldname: req.file.fieldname, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : "NO FILE");
      console.log("[AVISO-CREAR] req.body keys:", Object.keys(req.body || {}));
      if (process.env.HTTP_DEBUG === "true") {
        console.log("req.body:", req.body);
        console.log("req.file:", req.file);
      }
      const {
        titulo,
        descripcion,
        palabras_claves,
        fecha_programacion,
        aviso_tipo_id,
        aviso_destinatario_tipo,
        destinario,
      } = req.body;

      const isMissing = (v: any) =>
        v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

      const missingFields: string[] = [];
      if (isMissing(titulo)) missingFields.push("titulo");
      if (isMissing(descripcion)) missingFields.push("descripcion");
      if (isMissing(palabras_claves)) missingFields.push("palabras_claves");
      if (isMissing(fecha_programacion)) missingFields.push("fecha_programacion");
      if (isMissing(aviso_tipo_id)) missingFields.push("aviso_tipo_id");
      if (isMissing(aviso_destinatario_tipo)) missingFields.push("aviso_destinatario_tipo");
      if (isMissing(destinario)) missingFields.push("destinario");

      if (missingFields.length > 0) {
        throw new CustomError(
          ErrorCodes.MISSING_REQUIRED_FIELD,
          `Campos obligatorios faltantes: ${missingFields.join(", ")}`,
          400,
          { missingFields }
        );
      }
      let destinatarioArray: number[];
      try {
        if (typeof destinario === "string") {
          destinatarioArray = destinario
            .split(',')
            .map((id: string) => parseInt(id.trim(), 10))
            .filter((id: number) => !isNaN(id));
        } else if (Array.isArray(destinario)) {
          destinatarioArray = destinario
            .map((id) => parseInt(id, 10))
            .filter((id: number) => !isNaN(id));
        } else {
          throw new Error("El campo 'destinario' debe ser un ID válido o un arreglo de IDs.");
        }
        if (!destinatarioArray || destinatarioArray.length === 0) {
          throw new Error("El campo 'destinario' debe contener al menos un ID válido y no puede estar vacío.");
        }
      } catch (parseError) {
        throw new Error("El campo 'destinario' debe ser una lista de IDs válida.");
      }
      const avisoTipoId = parseInt(aviso_tipo_id, 10);
      if (isNaN(avisoTipoId)) {
        throw new Error("El campo 'aviso_tipo_id' debe ser un número válido.");
      }
      let publicUrl = null;
      if (req.file) {
        publicUrl = await subirArchivoSupabase(client, req.file, "avisos");
      }

      let fechaProgNormalized = fecha_programacion;
      if (fecha_programacion && typeof fecha_programacion === "string") {
        const parsedDate = new Date(fecha_programacion);
        if (!isNaN(parsedDate.getTime())) {
          fechaProgNormalized = parsedDate.toISOString();
        }
      }

      const tipoObjetivoMap: Record<number, "colegio" | "grado" | "curso" | "alumno"> = {
        1: "colegio",
        2: "grado",
        3: "curso",
        4: "alumno",
      };
      
      const tipoObjetivo = tipoObjetivoMap[avisoTipoId];
      if (!tipoObjetivo) {
        throw new Error("tipo de destinatario inválido");
      }

      avisoId = await crearAvisoApp(client, {
        avisoTiposId: avisoTipoId,
        tipoObjetivo,
        dirigidoA: aviso_destinatario_tipo === "apoderado" ? "apoderado" : "alumno",
        ids: destinatarioArray,
        titulo,
        contenido: descripcion,
        fechaProgramacion: fechaProgNormalized,
        rutaArchivo: publicUrl
      });
      await insertarPalabrasClave(client, avisoId, palabras_claves.split(',').map((p: string) => p.trim()));

      // Enviar notificaciones de inmediato (especialmente si es tipo "Ahora")
      enviarNotificacionesPendientes(client).catch(err => {
        console.error("Error al enviar avisos de inmediato tras la creación:", err);
      });

      FormatResponse(res, STATUS_CODES.CREATED, {
        message: "Aviso creado exitosamente",
        aviso_id: avisoId,
      });
    } catch (error) {
      if (avisoId) {
        await client.from("avisos_apps").delete().eq("aviso_id", avisoId);
      }
      errorHandler.handleError(error, res, "AvisosService.crear");
    }
  },

  async listarPorUsuario(req: Request, res: Response): Promise<void> {
    try {
      const usuarioIdParam = (req.params && (req.params as any).usuarioId) || (req.query && (req.query as any).usuario_id);
      const usuarioId = parseInt(String(usuarioIdParam), 10);
      if (isNaN(usuarioId)) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          success: false,
          message: "El parámetro 'usuarioId' es obligatorio y debe ser numérico.",
          data: null,
        });
      }

      // Intento 1: con nombre de parámetro con prefijo 'p_'
      let rpcData: any[] | null = null;
      let rpcError: any = null;
      {
        const { data, error } = await client.rpc("listar_avisos_por_usuario", {
          p_usuario_id: usuarioId,
        } as any);
        rpcData = data as any[] | null;
        rpcError = error;
      }

      // Si falla, intento 2: nombre sin prefijo
      if (rpcError) {
        const { data, error } = await client.rpc("listar_avisos_por_usuario", {
          usuario_id: usuarioId,
        } as any);
        rpcData = data as any[] | null;
        rpcError = error;
      }

      if (rpcError) {
        throw new Error(rpcError.message || "Error ejecutando listar_avisos_por_usuario");
      }

      return FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        message: "Avisos del usuario obtenidos correctamente",
        data: rpcData || [],
      });
    } catch (error) {
      return errorHandler.handleError(error, res, "AvisosService.listarPorUsuario");
    }
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const avisoId = parseInt(id, 10);
      if (isNaN(avisoId)) {
        throw new Error("El ID del aviso debe ser un número válido.");
      }
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);
      const {
        titulo,
        descripcion,
        palabras_claves,
        fecha_programacion,
        aviso_tipo_id,
        aviso_destinatario_tipo,
        destinario,
        activo,
      } = req.body;

      // Validar que al menos un campo se proporcione
      if (
        titulo === undefined &&
        descripcion === undefined &&
        palabras_claves === undefined &&
        fecha_programacion === undefined &&
        aviso_tipo_id === undefined &&
        aviso_destinatario_tipo === undefined &&
        destinario === undefined &&
        activo === undefined &&
        !req.file
      ) {
        throw new Error("Debe proporcionar al menos un campo para actualizar.");
      }

      // Validar dependencias: si se proporciona 'destinario', deben estar 'aviso_destinatario_tipo' y 'aviso_tipo_id'
      if (destinario !== undefined) {
        if (aviso_destinatario_tipo === undefined || aviso_tipo_id === undefined) {
          throw new Error("Para actualizar destinatarios, debe proporcionar 'aviso_destinatario_tipo' y 'aviso_tipo_id'.");
        }
      }
      // Procesar campos opcionales
      const avisoData: any = {};
      if (titulo !== undefined) avisoData.aviso_titulo = titulo;
      if (descripcion !== undefined) avisoData.aviso_contenido = descripcion;
      if (fecha_programacion !== undefined) {
        avisoData.aviso_fecha_programacion = fecha_programacion;
      }
      if (aviso_tipo_id !== undefined) {
        const avisoTipoId = parseInt(aviso_tipo_id, 10);
        if (isNaN(avisoTipoId)) {
          throw new Error("El campo 'aviso_tipo_id' debe ser un número válido.");
        }
        avisoData.aviso_tipos_id = avisoTipoId;
      }
      if (activo !== undefined) {
        avisoData.aviso_activo = activo === 'true';
      }

      // Procesar archivo si se proporciona
      if (req.file) {
        const publicUrl = await subirArchivoSupabase(client, req.file, "avisos");
        avisoData.aviso_ruta_archivo = publicUrl;
      }
      const { data: existingAviso, error: fetchError } = await client
        .from("avisos_apps")
        .select("aviso_id")
        .eq("aviso_id", avisoId)
        .single();

      if (fetchError || !existingAviso) {
        throw new Error("Aviso no encontrado.");
      }
      // Actualizar solo si hay campos en avisoData
      if (Object.keys(avisoData).length > 0) {
        const { error: updateError } = await client
          .from("avisos_apps")
          .update(avisoData)
          .eq("aviso_id", avisoId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      if (aviso_destinatario_tipo !== undefined && destinario !== undefined) {
        let destinatarioArray: number[];
        try {
          if (typeof destinario === "string") {
            destinatarioArray = destinario
              .split(',')
              .map((id: string) => parseInt(id.trim(), 10))
              .filter((id: number) => !isNaN(id));
          } else if (Array.isArray(destinario)) {
            destinatarioArray = destinario
              .map((id) => parseInt(id, 10))
              .filter((id: number) => !isNaN(id));
          } else {
            throw new Error("El campo 'destinario' debe ser un ID válido o un arreglo de IDs.");
          }
          if (!destinatarioArray || destinatarioArray.length === 0) {
            throw new Error("El campo 'destinario' debe contener al menos un ID válido y no puede estar vacío.");
          }
        } catch (parseError) {
          throw new Error("El campo 'destinario' debe ser una lista de IDs válida.");
        }
        const avisoTipoId = parseInt(aviso_tipo_id, 10);
        if (isNaN(avisoTipoId)) {
          throw new Error("El campo 'aviso_tipo_id' debe ser un número válido.");
        }
        const destinatariosFinales = await procesarDestinatarios(
          client,
          avisoTipoId,
          aviso_destinatario_tipo,
          destinatarioArray
        );
        await client
          .from("aviso_destinatarios")
          .delete()
          .eq("aviso_id", avisoId);
        await insertarDestinatarios(
          client,
          avisoId,
          destinatariosFinales.map((d) => ({
            ...d,
            tipo: aviso_destinatario_tipo,
          }))
        );
      }

      if (palabras_claves !== undefined) {
        await client
          .from("aviso_palabras_clave")
          .delete()
          .eq("aviso_id", avisoId);
        await insertarPalabrasClave(client, avisoId, palabras_claves.split(',').map((p: string) => p.trim()));
      }

      // Enviar notificaciones de inmediato (especialmente si es tipo "Ahora")
      enviarNotificacionesPendientes(client).catch(err => {
        console.error("Error al enviar avisos de inmediato tras la actualización:", err);
      });

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Aviso actualizado exitosamente",
        aviso_id: avisoId,
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.actualizar");
    }
  },

  async enviarAvisosProgramados(req?: Request, res?: Response): Promise<void> {
    try {
      const resultado = await enviarNotificacionesPendientes(client);

      if (res) {
        return FormatResponse(res, STATUS_CODES.OK, {
          message: "Avisos programados procesados",
          resultado,
        });
      }
      console.log("Avisos programados procesados:", resultado);
    } catch (error) {
      if (res) {
        return errorHandler.handleError(error, res, "AvisosService.enviarAvisosProgramados");
      }
      console.error("Error en enviarAvisosProgramados (cron):", error);
    }
  },

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { tipo, activo, dirigido, fecha_programacion } = req.query;
      const { page, perPage } = req.query;

      const { page: validatedPage, perPage: validatedPerPage } = validatePagination(page, perPage);
      const { skip, take } = optionPaginationSupabase(validatedPage, validatedPerPage);

      const { data, error } = await client.rpc("listar_avisos_v2", {
        _destinatario_tipo: dirigido || null,
        _aviso_tipo: tipo || null,
        _fecha_programacion: fecha_programacion
          ? new Date(fecha_programacion as string).toISOString().substring(0, 10)
          : null,
        _activo: activo === "true" || activo === undefined || activo === null,
        _page: page ?? 1,
        _skip: perPage ?? 10
      });

      if (error) throw new Error(error.message);

      const paginatedResult = createPaginationFromSupabase(
        data,
        data?.[0]?.total,
        skip,
        take
      );

      FormatResponse(res, STATUS_CODES.OK, paginatedResult);
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.listar");
    }
  },

  // Borrado lógico: aviso_activo = false
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const avisoId = parseInt(id, 10);
      if (isNaN(avisoId)) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          success: false,
          message: "El parámetro 'id' debe ser numérico.",
          data: null,
        });
      }

      // Verificar existencia
      const { data: exists, error: fetchError } = await client
        .from("avisos_apps")
        .select("aviso_id, aviso_activo")
        .eq("aviso_id", avisoId)
        .single();

      if (fetchError || !exists) {
        return FormatResponse(res, STATUS_CODES.NOT_FOUND, {
          success: false,
          message: "Aviso no encontrado.",
          data: null,
        });
      }

      const { error: updateError } = await client
        .from("avisos_apps")
        .update({ aviso_activo: false })
        .eq("aviso_id", avisoId);

      if (updateError) throw new Error(updateError.message);

      return FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        message: "Aviso eliminado (borrado lógico) correctamente",
        aviso_id: avisoId,
      });
    } catch (error) {
      return errorHandler.handleError(error, res, "AvisosService.eliminar");
    }
  },


  async resumen(req: Request, res: Response): Promise<void> {
    try {
      const { colegio_id, aviso_id } = req.query;

      // Validar que colegio_id esté presente y sea un número válido
      if (!colegio_id || isNaN(Number(colegio_id))) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          success: false,
          message: "El parámetro 'colegio_id' es obligatorio y debe ser un número válido.",
          data: null
        });
      }

      // Validar aviso_id si está presente
      let avisoId: number | null = null;
      if (aviso_id !== undefined) {
        if (isNaN(Number(aviso_id))) {
          return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
            success: false,
            message: "El parámetro 'aviso_id' debe ser un número válido si se proporciona.",
            data: null
          });
        }
        avisoId = Number(aviso_id);
      }

      const colegioId = Number(colegio_id);

      const { data, error } = await client.rpc("consultar_resumen_avisos", {
        p_colegio_id: colegioId,
        p_aviso_id: avisoId,
      });

      if (error) {
        throw new Error(error.message);
      }

      FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        message: "Resumen de avisos obtenido exitosamente",
        data: { resumen: data }
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.resumen");
    }
  },

  async generarAvisosInactividadPorColegios(): Promise<void> {
    try {
      console.log("Iniciando generación de avisos de inactividad por colegios...");

      // 1. Obtener todos los colegios activos
      const { data: colegios, error: colegiosError } = await adminClient
        .from("colegios")
        .select("colegio_id")
        .eq("activo", true);

      if (colegiosError) throw new Error(colegiosError.message);
      if (!colegios || colegios.length === 0) {
        console.log("No hay colegios activos para procesar.");
        return;
      }

      // 2. Definir configuraciones de avisos por días
      const avisosConfig = [
        { dias: 1, titulo: "Recordatorio de actividad reciente", descripcion: "Hace 1 día que no participas en la app. ¡Vuelve pronto!" },
        { dias: 3, titulo: "Recordatorio de actividad", descripcion: "Hace 3 días que no participas en la app. ¡Vuelve!" },
        { dias: 5, titulo: "Recordatorio de inactividad prolongada", descripcion: "Hace 5 días que no participas en la app. ¡Es hora de volver!" },
      ];

      // 3. Recorrer cada colegio y generar avisos
      for (const colegio of colegios) {
        console.log(`Procesando colegio ID: ${colegio.colegio_id}`);

        for (const config of avisosConfig) {
          try {
            const { error } = await adminClient.rpc("generar_aviso_inactividad_colegio", {
              colegio_id: colegio.colegio_id,
              dias_inactividad: config.dias,
              titulo: config.titulo,
              descripcion: config.descripcion,
              tipo_aviso: 4,
            });

            if (error) {
              console.error(`Error generando aviso para colegio ${colegio.colegio_id}, ${config.dias} días:`, error.message);
            } else {
              console.log(`Aviso generado para colegio ${colegio.colegio_id}, ${config.dias} días.`);
            }
          } catch (rpcError) {
            console.error(`Excepción en RPC para colegio ${colegio.colegio_id}, ${config.dias} días:`, rpcError);
          }
        }
      }

      console.log("Generación de avisos de inactividad completada.");
    } catch (error) {
      console.error("Error general en generarAvisosInactividadPorColegios:", error);
    }
  },

  async generarAvisosInformesApoderados(): Promise<void> {
    try {
      console.log("Iniciando generación de avisos de informes disponibles para apoderados...");

      // 1. Obtener todos los colegios activos
      const { data: colegios, error: colegiosError } = await adminClient
        .from("colegios")
        .select("colegio_id")
        .eq("activo", true);

      if (colegiosError) throw new Error(colegiosError.message);
      if (!colegios || colegios.length === 0) {
        console.log("No hay colegios activos para procesar.");
        return;
      }

      // 2. Definir título y descripción fijos
      const titulo = "Nuevo informe disponible";
      const descripcion = "Ya puedes revisar el nuevo informe mensual de tu hijo en la app.";
      const avisoTipoId = 4;

      // 3. Recorrer cada colegio y generar avisos
      for (const colegio of colegios) {
        console.log(`Procesando colegio ID: ${colegio.colegio_id}`);

        try {
          const { error } = await adminClient.rpc("generar_aviso_informes_apoderados", {
            p_colegio_id: colegio.colegio_id,
            p_titulo: titulo,
            p_contenido: descripcion,
            p_aviso_tipos_id: avisoTipoId,
          });

          if (error) {
            console.error(`Error generando aviso para colegio ${colegio.colegio_id}:`, error.message);
          } else {
            console.log(`Aviso generado para colegio ${colegio.colegio_id}.`);
          }
        } catch (rpcError) {
          console.error(`Excepción en RPC para colegio ${colegio.colegio_id}:`, rpcError);
        }
      }

      console.log("Generación de avisos de informes disponibles completada.");
    } catch (error) {
      console.error("Error general en generarAvisosInformesApoderados:", error);
    }
  },

  async testEnvio(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id, titulo, contenido, data } = req.body;

      if (!usuario_id || !titulo || !contenido) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          message: "Faltan datos. Se requiere: usuario_id, titulo, contenido",
          data: null
        });
      }

      const { data: usuario, error } = await client
        .from("usuarios")
        .select("expo_push_token")
        .eq("usuario_id", usuario_id)
        .single();

      if (error || !usuario) {
        return FormatResponse(res, STATUS_CODES.NOT_FOUND, {
          message: "Usuario no encontrado en la base de datos",
          data: null
        });
      }

      if (!usuario.expo_push_token) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          message: `El usuario ${usuario_id} existe pero no tiene un expo_push_token registrado`,
          data: null
        });
      }

      const pushService = new NotificationPushService();
      
      const result = await pushService.sendNotifications(
        [usuario.expo_push_token],
        titulo,
        contenido,
        data || {}
      );

      return FormatResponse(res, STATUS_CODES.OK, {
        message: `Prueba enviada al usuario ${usuario_id}`,
        token_usado: usuario.expo_push_token,
        resultado: result
      });

    } catch (error) {
      return errorHandler.handleError(error, res, "AvisosService.testEnvio");
    }
  },

  async marcarLeido(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const avisoDestinatariosId = parseInt(id, 10);

      if (isNaN(avisoDestinatariosId)) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          success: false,
          message: "El ID debe ser numérico.",
          data: null,
        });
      }

      const usuarioId = req.user?.usuario_id;
      const leido = await marcarAvisoComoLeido(client, avisoDestinatariosId, usuarioId);

      return FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        message: leido ? "Aviso marcado como leído." : "El aviso ya estaba leído o no existe.",
        data: { leido },
      });
    } catch (error) {
      return errorHandler.handleError(error, res, "AvisosService.marcarLeido");
    }
  },

  async listarMisNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params; 
      const idUsuario = parseInt(usuarioId, 10);

      if (isNaN(idUsuario)) {
        return FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          success: false,
          message: "Usuario ID inválido.",
          data: null,
        });
      }

      const notificaciones = await obtenerMisNotificaciones(client, idUsuario);

      return FormatResponse(res, STATUS_CODES.OK, {
        success: true,
        message: "Buzón obtenido correctamente",
        data: notificaciones,
      });
    } catch (error) {
      return errorHandler.handleError(error, res, "AvisosService.listarMisNotificaciones");
    }
  },

};

async function procesarDestinatarios(
  client: SupabaseClient,
  aviso_tipo_id: number,
  aviso_destinatario_tipo: string,
  destinario: number[] | null
): Promise<{ id: number; tipo: string }[]> {
  switch (aviso_tipo_id) {
    case 1: // Colegio
      return await obtenerDestinatariosPorColegios(
        client,
        aviso_destinatario_tipo,
        destinario
      );
    case 2: // Grado
      return await obtenerDestinatariosPorGrados(
        client,
        aviso_destinatario_tipo,
        destinario
      );
    case 3: // Curso
      return await obtenerDestinatariosPorCursos(
        client,
        aviso_destinatario_tipo,
        destinario
      );
    case 4: // Alumno
      return await obtenerDestinatariosPorAlumnos(
        client,
        aviso_destinatario_tipo,
        destinario
      );
    default:
      throw new Error("Tipo de aviso no soportado");
  }
}

async function obtenerDestinatariosPorColegios(
  client: SupabaseClient,
  tipo: string,
  ids: number[] | null
): Promise<{ id: number; tipo: string }[]> {
  if (ids && ids.length > 0) {
    const { data: alumnosData } = await client
      .from("alumnos")
      .select("alumno_id")
      .in("colegio_id", ids)
      .eq("activo", true);

    if (tipo === "alumno") {
      return (alumnosData || []).map((a: { alumno_id: number }) => ({
        id: a.alumno_id,
        tipo: "alumno",
      }));
    }
  } else {
    const { data: alumnosData } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("activo", true);
    if (tipo === "alumno") {
      return (alumnosData || []).map((a: { alumno_id: number }) => ({
        id: a.alumno_id,
        tipo: "alumno",
      }));
    }
  }
  return [];
}

async function obtenerDestinatariosPorGrados(
  client: SupabaseClient,
  tipo: string,
  ids: number[] | null
): Promise<{ id: number; tipo: string }[]> {
  console.log("[DEBUG] obtenerDestinatariosPorGrados - Input IDs:", ids);

  if (ids && ids.length > 0) {
    // 1. Obtener los cursos del grado solicitado
    const { data: cursosData, error: cursosError } = await client
      .from("cursos")
      .select("curso_id, grado_id")
      .in("grado_id", ids);
    if (cursosError) {
      console.error("[ERROR] Error fetching cursos:", cursosError.message);
      throw new Error(cursosError.message);
    }
    console.log("[DEBUG] Cursos obtenidos:", cursosData);

    const cursoIds = (cursosData || []).map((c: any) => c.curso_id);
    if (cursoIds.length === 0) {
      console.log("[DEBUG] No se encontraron cursos para los grados proporcionados.");
      return [];
    }

    // 2. Obtener los alumnos de esos cursos
    const { data: alumnosCursosData, error: alumnosCursosError } = await client
      .from("alumnos_cursos")
      .select("alumno_id, curso_id")
      .in("curso_id", cursoIds);
    if (alumnosCursosError) {
      console.error("[ERROR] Error fetching alumnos_cursos:", alumnosCursosError.message);
      throw new Error(alumnosCursosError.message);
    }
    console.log("[DEBUG] Alumnos obtenidos de alumnos_cursos:", alumnosCursosData);

    const alumnosUnicos = Array.from(
      new Set((alumnosCursosData || []).map((ac: any) => ac.alumno_id))
    );
    console.log("[DEBUG] IDs únicos de alumnos:", alumnosUnicos);

    if (tipo === "alumno") {
      return alumnosUnicos.map((id: number) => ({
        id,
        tipo: "alumno",
      }));
    } else if (tipo === "apoderado") {
      if (alumnosUnicos.length === 0) {
        console.log("[DEBUG] No se encontraron alumnos para buscar apoderados.");
        return [];
      }
      const { data: apoderadosData, error: apoderadosError } = await client
        .from("alumnos_apoderados")
        .select("apoderado_id, alumno_id")
        .in("alumno_id", alumnosUnicos);
      if (apoderadosError) {
        console.error("[ERROR] Error fetching alumnos_apoderados:", apoderadosError.message);
        throw new Error(apoderadosError.message);
      }
      console.log("[DEBUG] Apoderados obtenidos:", apoderadosData);

      const apoderadosUnicos = Array.from(
        new Set((apoderadosData || []).map((a: any) => a.apoderado_id))
      );
      return apoderadosUnicos.map((id: number) => ({
        id,
        tipo: "apoderado",
      }));
    }
    return [];
  }
  console.log("[DEBUG] No IDs proporcionados para grados.");
  return [];
}

async function obtenerDestinatariosPorCursos(
  client: SupabaseClient,
  tipo: string,
  ids: number[] | null
): Promise<{ id: number; tipo: string }[]> {

  if (!ids || ids.length === 0) {
    return [];
  }

  const { data: alumnosCursos, error: alumnosError } = await client
    .from("alumnos_cursos")
    .select("alumno_id")
    .in("curso_id", ids);

  if (alumnosError) {
    throw new Error(alumnosError.message);
  }

  const alumnoIds = Array.from(
    new Set((alumnosCursos || []).map((a: any) => a.alumno_id))
  );

  if (alumnoIds.length === 0) return [];

  if (tipo === "alumno") {
    return alumnoIds.map(id => ({
      id,
      tipo: "alumno"
    }));
  }

  if (tipo === "apoderado") {
    const { data: apoderadosData, error: apoderadoError } = await client
      .from("alumnos_apoderados")
      .select("apoderado_id, alumno_id")
      .in("alumno_id", alumnoIds);

    if (apoderadoError) throw new Error(apoderadoError.message);

    const apoderadosUnicos = Array.from(
      new Set((apoderadosData || []).map((a: any) => a.apoderado_id))
    );

    return apoderadosUnicos.map(id => ({
      id,
      tipo: "apoderado"
    }));
  }

  return [];
}


async function obtenerDestinatariosPorAlumnos(
  client: SupabaseClient,
  tipo: string,
  ids: number[] | null
): Promise<{ id: number; tipo: string }[]> {
  if (ids && ids.length > 0) {
    return ids.map((id) => ({ id, tipo: "alumno" }));
  } else {
    const { data: alumnosData } = await client
      .from("alumnos")
      .select("alumno_id")
      .eq("activo", true);
    return (alumnosData || []).map((a: { alumno_id: number }) => ({
      id: a.alumno_id,
      tipo: "alumno",
    }));
  }
}






