import { Request, Response } from "express";

import { DataService } from "../DataService";
import { AlumnoRespuesta } from "../../../core/modelo/preguntasRespuestas/AlumnoRespuesta";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";
import { AuditoriaService } from "../../../repos/auditoria/auditoria.service";
import { TrazabilidadRepository } from "../../../repos/auditoria/trazabilidadRepository";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<AlumnoRespuesta> = new DataService(
  "alumnos_respuestas",
  "alumno_respuesta_id"
);
const AlumnoRespuestaSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  pregunta_id: Joi.number().integer().required(),
  tipo_pregunta_id: Joi.number().integer().required(),
  respuesta: Joi.string().required(),
  timestamp: Joi.string().optional(),
});

const auditoriaRepository = new TrazabilidadRepository(supabaseService);
const auditoriaservice = new AuditoriaService(auditoriaRepository);
export const AlumnoRespuestaService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query;
      let respuestaEnviada = false;
      if (colegio_id !== undefined) {
        const alumnorespuesta = await obtenerRelacionados({
          tableFilter: "alumnos",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "alumno_id",
          tableIn: "alumnos_respuestas",
          inField: "alumno_id",
          selectFields: `*,                      
                        alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos)),
                        preguntas(pregunta_id,texto_pregunta),
                        tipos_preguntas(tipo_pregunta_id,nombre)`,
        });
        respuestaEnviada = true;
        res.json(alumnorespuesta);
      }
      if (!respuestaEnviada) {
        const alumnorespuesta = await dataService.getAll(
          [
            "*",
            "alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos))",
            "preguntas(pregunta_id,texto_pregunta)",
            "tipos_preguntas(tipo_pregunta_id,nombre)",
          ],
          where
        );
        res.json(alumnorespuesta);
      }
    } catch (error) {
      console.error("Error al obtener la alumnorespuesta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const alumno: AlumnoRespuesta = new AlumnoRespuesta();
      Object.assign(alumno, req.body);
      alumno.creado_por = req.creado_por;
      alumno.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = AlumnoRespuestaSchema.validate(
        req.body
      );
      const { data, error } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", alumno.alumno_id)
        .single();
      if (error || !data) {
        throw new Error("El alumno no existe");
      }
      const { data: dataPregunta, error: errorPregunta } = await client
        .from("preguntas")
        .select("*")
        .eq("pregunta_id", alumno.pregunta_id)
        .single();
      if (errorPregunta || !dataPregunta) {
        throw new Error("La pregunta no existe");
      }
      const { data: dataTipoPregunta, error: errorTipoPregunta } = await client
        .from("tipos_preguntas")
        .select("*")
        .eq("tipo_pregunta_id", alumno.tipo_pregunta_id)
        .single();
      if (errorTipoPregunta || !dataTipoPregunta) {
        throw new Error("El tipo de pregunta no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedAlumno = await dataService.processData(alumno);
        res.status(201).json(savedAlumno);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error al guardar el alumno:", error);
      res.status(500).json({ message: error.message || "Error inesperado" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alumnorespuesta: AlumnoRespuesta = new AlumnoRespuesta();
      Object.assign(alumnorespuesta, req.body);
      alumnorespuesta.creado_por = req.creado_por;
      alumnorespuesta.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = AlumnoRespuestaSchema.validate(
        req.body
      );
      const { data, error } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", alumnorespuesta.alumno_id)
        .single();
      if (error || !data) {
        throw new Error("El alumno no existe");
      }
      const { data: dataPregunta, error: errorPregunta } = await client
        .from("preguntas")
        .select("*")
        .eq("pregunta_id", alumnorespuesta.pregunta_id)
        .single();
      if (errorPregunta || !dataPregunta) {
        throw new Error("La pregunta no existe");
      }
      const { data: dataTipoPregunta, error: errorTipoPregunta } = await client
        .from("tipos_preguntas")
        .select("*")
        .eq("tipos_pregunta_id", alumnorespuesta.tipo_pregunta_id)
        .single();
      if (errorTipoPregunta || !dataTipoPregunta) {
        throw new Error("El tipo de pregunta no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, alumnorespuesta);
        res
          .status(200)
          .json({ message: "AlumnoRespuesta actualizada correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar la alumnorespuesta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "Alumno Respuesta eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la alumnorespuesta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
