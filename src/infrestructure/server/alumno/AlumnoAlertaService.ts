/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { Request, Response } from "express";
import { DataService } from "../DataService";
import { AlumnoAlerta } from "../../../core/modelo/alumno/AlumnoAlerta";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  contarAlertasPendientesPorColegio,
  mapearAlertaDetalleV2,
  mapearAlertas,
} from "../../../core/services/AlertasServiceCasoUso";

import { EmailService } from "../../../core/services/EmailService";
import { AlumnoAlertaSchema } from "./shema/AlumnoAlertaSchema";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import {
  actualizarAlumnoAlerta,
  getDestinatarios,
  procesarArchivos,
  validarReferencias,
} from "./funciones/AlumnoAlerta/AlumnoAlertaBusiness";

import { AuditoriaService } from "../../../repos/auditoria/auditoria.service";
import { TrazabilidadRepository } from "../../../repos/auditoria/trazabilidadRepository";
const emailService = new EmailService();

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<Partial<AlumnoAlerta>> = new DataService(
  "alumnos_alertas",
  "alumno_alerta_id"
);

const auditoriaService = new AuditoriaService(
  new TrazabilidadRepository(supabaseService)
);

const procesarNotificacionAlerta = async ({
  adminClient,
  alumnoId,
  tipoAlertaId,
  codigoAlerta,
  ipOrigen,
}: {
  adminClient: SupabaseClient;
  alumnoId: number;
  tipoAlertaId: number;
  codigoAlerta: number;
  ipOrigen?: string;
}) => {
  try {
    const [destinatariosResult, alertaResult] = await Promise.all([
      getDestinatarios(adminClient, alumnoId, tipoAlertaId),
      adminClient
        .from("alertas_tipos")
        .select("nombre")
        .eq("alerta_tipo_id", tipoAlertaId),
    ]);

    const alerta = alertaResult.data?.[0];
    if (alertaResult.error || !alerta) {
      throw new Error("No se pudo obtener el tipo de alerta");
    }

    const tipoAlerta = alerta.nombre;
    const { destinatarios, colegio_id } = destinatariosResult;

    await Promise.allSettled([
      emailService.enviarNotificacionAlerta(
        {
          tipo: tipoAlerta,
          codigo: codigoAlerta,
          enlace: "https://www.almaiacolegios.app/",
        },
        destinatarios
      ),
      auditoriaService.guardarAuditoria({
        tipo_auditoria_id: 1,
        colegio_id: Number(colegio_id),
        fecha: new Date(),
        usuario_id: alumnoId,
        descripcion: "alerta_alumnos",
        modulo_afectado: "AlumnoAlertaService.guardar",
        accion_realizada: `ejecucion de una alerta tipo ${tipoAlerta}`,
        ip_origen: ipOrigen,
        model: "Guardar alerta del alumno",
        referencia_id: codigoAlerta,
      }),
    ]);
  } catch (error) {
    console.error("Error procesando notificacion posterior del SOS:", error);
  }
};

export const AlumnoAlertaService = {
  /**
   * regresa todas las alertas de un colegio
   * @param req
   * @param res
   */
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, page, perPage, ...filters } = req.query;

      if (!colegio_id) {
        throw new Error("colegio_id es requerido");
      }

      const limit = Number(perPage);
      const from = (Number(page) - 1) * limit;
      const to = from + limit - 1;

      let query = client
        .from("alumnos_alertas")
        .select(
          `*,
            alumnos!inner(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos)),
            alertas_reglas(alerta_regla_id,nombre),
            alertas_origenes(alerta_origen_id,nombre),
            alertas_severidades(alerta_severidad_id,nombre),
            alertas_prioridades(alerta_prioridad_id,nombre),
            alertas_tipos(alerta_tipo_id,nombre),
            personas(persona_id,nombres,apellidos)
        `,
          { count: "exact" }
        )
        .eq("alumnos.colegio_id", colegio_id)
        .eq("activo", true)
        .order("fecha_generada", { ascending: false });

      if (filters?.alertas_tipo_alerta_tipo_id) {
        query = query.eq(
          "alertas_tipo_alerta_tipo_id",
          filters.alertas_tipo_alerta_tipo_id
        );
      }

      if (filters?.prioridad_id) {
        query = query.eq("prioridad_id", filters.prioridad_id);
      }

      if (filters?.estado) {
        query = query.eq("estado", filters.estado);
      }

      if (filters?.motores && Number(filters.motores)) {
        query = query.in("alertas_tipo_alerta_tipo_id", [3, 4, 5]);
      }

      if (filters?.dateFilter && filters?.selectedDate) {
        const typeFilter = filters.dateFilter;

        if (typeFilter == "Hoy") {
          const today = new Date(filters?.selectedDate as string);
          const startOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0,
            0,
            0
          ).toISOString();
          const endOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59
          ).toISOString();
          query = query
            .gte("fecha_generada", startOfDay)
            .lte("fecha_generada", endOfDay);
        }

        if (typeFilter == "Hasta...") {
          const selectedDate = new Date(filters?.selectedDate as string);
          const endOfDay = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            23,
            59,
            59
          ).toISOString();
          query = query.lte("fecha_generada", endOfDay);
        }
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalItems = count ?? 0;
      const totalPages = Math.ceil(totalItems / limit);

      FormatResponse(res, STATUS_CODES.OK, {
        data,
        totalItems,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error al obtener la alerta del alumnoalerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async detalle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const where = { alumno_alerta_id: id }; // Convertir los parámetros de consulta en filtros

      const alumnoalertaAlerta_data = await dataService.getAll(
        [
          "*",
          "alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos),alumnos_cursos(alumno_curso_id,ano_escolar,cursos(curso_id,nombre_curso,colegios(colegio_id,nombre),grados(grado_id,nombre))))",
          "alertas_reglas(alerta_regla_id,nombre)",
          "alertas_origenes(alerta_origen_id,nombre)",
          "alertas_severidades(alerta_severidad_id,nombre)",
          "alertas_prioridades(alerta_prioridad_id,nombre)",
          "alertas_tipos(alerta_tipo_id,nombre)",

          "personas(persona_id,nombres,apellidos,usuarios(usuario_id,nombre_social,url_foto_perfil,roles(rol_id,nombre)))",
        ],
        where
      );
      const alumnoalertaAlerta = mapearAlertaDetalleV2(alumnoalertaAlerta_data);
      res.json(alumnoalertaAlerta);
    } catch (error) {
      console.error("Error al obtener la alerta del alumnoalerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  //#pisa papel
  guardar: async (req: Request, res: Response) => {
    try {
      const { anonimo = false, alumno_id, ...body } = req.body;
      const requestClient = req.supabase ?? client;
      const adminClient = req.supabaseAdmin ?? requestClient;
      const requestDataService: DataService<Partial<AlumnoAlerta>> =
        new DataService("alumnos_alertas", "alumno_alerta_id");
      requestDataService.setClient(requestClient);

      const alumnoalerta: AlumnoAlerta = new AlumnoAlerta();
      Object.assign(alumnoalerta, body);
      alumnoalerta.creado_por = req.creado_por;
      alumnoalerta.actualizado_por = req.actualizado_por;

      // Validación
      const { error: validationError } = AlumnoAlertaSchema.validate(req.body);
      if (validationError) {
        throw new Error(validationError.details[0].message);
      }

      // Verificar claves foráneas
      await validarReferencias(adminClient, alumnoalerta);

      // Archivos
      await procesarArchivos(requestClient, req, alumnoalerta);

      const savedAlumnoAlerta = await requestDataService.processData({
        ...alumnoalerta,
        anonimo,
        alumno_id,
      });

      FormatResponse(res, STATUS_CODES.CREATED, savedAlumnoAlerta);

      void procesarNotificacionAlerta({
        adminClient,
        alumnoId: Number(alumno_id),
        tipoAlertaId: Number(
          savedAlumnoAlerta.alertas_tipo_alerta_tipo_id
        ),
        codigoAlerta: Number(savedAlumnoAlerta.alumno_alerta_id),
        ipOrigen: req.ip,
      });
    } catch (err) {
      errorHandler.handleError(err, res, "AlumnoAlertaService.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await actualizarAlumnoAlerta(id, req, client, dataService);
      FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoAlertaService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res.status(200).json({ message: "AlumnoAlerta eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el alumnoalerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async contarAlertasPendientes(req: Request, res: Response) {
    try {
      const { colegio_id } = req.query;

      if (colegio_id) {
        const colegioIdNumber = Number(colegio_id);
        if (isNaN(colegioIdNumber)) {
          throw new Error("colegio_id debe ser un número");
        }

        const count = await contarAlertasPendientesPorColegio(
          client,
          colegioIdNumber
        );
        res.json({ count });
      } else {
        res.json({ count: 0 });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error al contar alertas" });
    }
  },
  async DistribucionAlertas(req: Request, res: Response) {
    try {
      console.log("Distribucion Alertas");
      const { colegio_id } = req.query;

      if (colegio_id) {
        const colegioIdNumber = Number(colegio_id);
        if (isNaN(colegioIdNumber)) {
          throw new Error("colegio_id debe ser un número");
        }

        const { data, error } = await client.rpc("contar_alertas_por_estado", {
          p_colegio_id: colegio_id,
        });
        
        // Obtener ids de alumnos del colegio para contar no leidas
        const { data: alumnosData } = await client
          .from("alumnos")
          .select("alumno_id")
          .eq("colegio_id", colegioIdNumber);
          
        const alumnoIds = alumnosData?.map(a => a.alumno_id) || [];
        
        let noLeidasCount = 0;
        if (alumnoIds.length > 0) {
          const { count } = await client
            .from("alumnos_alertas")
            .select("*", { count: "exact", head: true })
            .eq("activo", true)
            .eq("leida", false)
            .in("alumno_id", alumnoIds);
            
          noLeidasCount = count || 0;
        }

        const responseData = data ? { ...data[0] } : {};
        responseData.no_leidas = noLeidasCount;

        res.json(responseData);
      } else {
        res.json({ count: 0, no_leidas: 0 });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error al contar alertas" });
    }
  },

  async obtenerAlertasPorId(req: Request, res: Response) {
    try {
      const { colegio_id, alerta_tipo_id, ...where } = req.query;
      let respuestaEnviada = false;
      console.log("Distribucion Alertas");
      if (!alerta_tipo_id) {
        const { data: alumnoalertaAlerta_data, error } = await client
          .from("alumnos_alertas")
          .select(
            `*,
          alumnos!inner(
            alumno_id,
            url_foto_perfil,
            activo,
            colegio_id,
            personas(persona_id, nombres, apellidos)
          ),
          alertas_reglas(alerta_regla_id, nombre),
          alertas_origenes(alerta_origen_id, nombre),
          alertas_severidades(alerta_severidad_id, nombre),
          alertas_prioridades(alerta_prioridad_id, nombre),
          alertas_tipos(alerta_tipo_id, nombre)
        `
          )
          .eq("activo", true)
          .eq("alumnos.activo", true)
          .eq("alumnos.colegio_id", colegio_id);
        if (error) throw error;

        res.json(mapearAlertas(alumnoalertaAlerta_data || []));
      }
      if (colegio_id && alerta_tipo_id) {
        const { data: alumnoalertaAlerta_data, error } = await client
          .from("alumnos_alertas")
          .select(
            `
          *,
          alumnos!inner(
            alumno_id,
            url_foto_perfil,
            activo,
            colegio_id,
            personas(persona_id, nombres, apellidos)
          ),
          alertas_reglas(alerta_regla_id, nombre),
          alertas_origenes(alerta_origen_id, nombre),
          alertas_severidades(alerta_severidad_id, nombre),
          alertas_prioridades(alerta_prioridad_id, nombre),
          alertas_tipos(alerta_tipo_id, nombre)
        `
          )
          .eq("activo", true)
          .eq("alumnos.activo", true)
          .eq("alumnos.colegio_id", colegio_id)
          .eq("alertas_tipo_alerta_tipo_id", alerta_tipo_id);

        if (error) throw error;

        respuestaEnviada = true;
        res.json(alumnoalertaAlerta_data);
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoAlertaService.obtenerAlertasPorId"
      );
    }
  },
};
