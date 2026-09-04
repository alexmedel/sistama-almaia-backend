import { Request, Response } from "express";
import { DataService } from "../DataService";
import { AlumnoActividad } from "../../../core/modelo/alumno/AlumnoActividad";
import Joi from "joi";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";

import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../avisos/types/types";
import { saveSilgleFile } from "../../../helpers/upload-supabase";

const dataService: DataService<AlumnoActividad> = new DataService(
  "alumnos_actividades",
  "alumno_actividad_id"
);
const AlumnoActividadSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  actividad_id: Joi.number().integer().required(),
});
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

export const AlumnoActividadService = {
  async completarPerfil(req: Request, res: Response) {
    console.log("Cuerpo de la solicitud:", req.body);
    try {
      const { data, error } = await client
        .from("alumnos")
        .update({
          perfil_completado: true,
        })
        .eq("alumno_id", req.body.alumno_id);
      if (error) {
        throw new Error(error.message);
      }

      const image = await saveSilgleFile(
        client,
        req,
        "user-profile",
        "url_foto_perfil"
      );

      const { data: usuario } = await client
        .from("usuarios")
        .update({
          url_foto_perfil: image,
          nombre_social: req.body.nombre_social,
        })
        .eq("usuario_id", req.body.usuario_id)
        .single();
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Perfil completado correctamente",
        data,
        usuario,
        image,
      });
    } catch (error) {
      console.error("Error al completar el perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async guardarPreferencias(req: Request, res: Response) {
    try {
      // Recibimos el ID del alumno y el array de preferencias del frontend
      const { alumno_id, preferencias_array } = req.body;

      const { data, error } = await client
        .from("preferencias")
        .upsert([
          // Usamos upsert para insertar o actualizar
          {
            alumno_id: alumno_id,
            lista_preferencias: preferencias_array, // El array se guarda directamente
          },
        ])
        .select(); // Devolvemos la fila actualizada

      if (error) {
        throw error;
      }

      FormatResponse(res, STATUS_CODES.OK, {
        message: "Preferencias guardadas exitosamente",
        data,
      });
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query;
      let respuestaEnviada = false;
      if (colegio_id !== undefined) {
        const alumnoActividad = await obtenerRelacionados({
          tableFilter: "alumnos",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "alumno_id",
          tableIn: "alumnos_actividades",
          inField: "alumno_id",
          selectFields: `*,
                         alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)"
                        ,"actividades(actividad_id,nombre)`,
        });
        respuestaEnviada = true;
        res.json(alumnoActividad);
      }
      if (!respuestaEnviada) {
        const alumnoActividad = await dataService.getAll(
          [
            "*",
            "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email)",
            "actividades(actividad_id,nombre)",
          ],
          where
        );
        res.json(alumnoActividad);
      }
    } catch (error) {
      console.error("Error al obtener el curso del alumno:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const alumnoActividad: AlumnoActividad = new AlumnoActividad();
      Object.assign(alumnoActividad, req.body);
      alumnoActividad.creado_por = req.creado_por;
      alumnoActividad.actualizado_por = req.actualizado_por;
      alumnoActividad.activo = true;
      let responseSent = false;
      const { error: validationError } = AlumnoActividadSchema.validate(
        req.body
      );
      const { data: dataAlumno, error: errorAlumno } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", alumnoActividad.alumno_id)
        .single();
      if (errorAlumno || !dataAlumno) {
        throw new Error("El alumno no existe");
      }
      const { data: dataActividad, error: errorActividad } = await client
        .from("actividades")
        .select("*")
        .eq("actividad_id", alumnoActividad.actividad_id)
        .single();
      if (errorActividad || !dataActividad) {
        throw new Error("La actividad no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedAlumnoActividad = await dataService.processData(
          alumnoActividad
        );
        res.status(201).json(savedAlumnoActividad);
      }
    } catch (error) {
      console.error("Error al guardar el curso del alumno:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alumnoActividad: AlumnoActividad = new AlumnoActividad();
      Object.assign(alumnoActividad, req.body);
      alumnoActividad.creado_por = req.creado_por;
      alumnoActividad.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = AlumnoActividadSchema.validate(
        req.body
      );
      const { data: dataAlumno, error: errorAlumno } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", alumnoActividad.alumno_id)
        .single();
      if (errorAlumno || !dataAlumno) {
        throw new Error("El alumno no existe");
      }
      const { data: dataActividad, error: errorActividad } = await client
        .from("actividades")
        .select("*")
        .eq("actividad_id", alumnoActividad.actividad_id)
        .single();
      if (errorActividad || !dataActividad) {
        throw new Error("La Actividad  no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const alumnoActividad: AlumnoActividad = req.body;
        await dataService.updateById(id, alumnoActividad);
        res
          .status(200)
          .json({ message: "Curso del alumno actualizado correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar el curso del alumno:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "Curso del alumno eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el curso del alumno:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
