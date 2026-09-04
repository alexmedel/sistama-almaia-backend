import { Request, Response } from "express";
import { DataService } from "../DataService";
import { HistorialComunicacion } from "../../../core/modelo/colegio/HistorialComunicacion";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const HistorialComunicacionSchema = Joi.object({
    alumno_id: Joi.number().integer().required(),
    usuario_id: Joi.number().integer().required(),
    apoderado_id: Joi.number().integer().required(),
    asunto: Joi.string().max(50).required(),
    descripcion: Joi.string().max(150).required(),
    acciones_acuerdos_tomados: Joi.string().max(150).required(),
});
const dataService: DataService<HistorialComunicacion> = new DataService(
  "historiales_comunicaciones" ,"historial_comunicacion_id"
);
export const HistorialComunicacionsService = {
  async obtener(req: Request, res: Response) {
    try {
 const { colegio_id, ...where } = req.query;
      let respuestaEnviada = false;
      if (colegio_id !== undefined) {
        const historialComunicaciones = await obtenerRelacionados({
          tableFilter: "alumnos",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "alumno_id",
          tableIn: "historiales_comunicaciones",
          inField: "alumno_id",
          selectFields: `*,
          alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos)),
          apoderados(apoderado_id,personas(persona_id,nombres,apellidos),telefono_contacto1,telefono_contacto2,email_contacto1,email_contacto2),
          usuarios(usuario_id,nombre_social)`,
        });
        respuestaEnviada = true;
        res.json(historialComunicaciones);
      }
      if (!respuestaEnviada) {
        const historialComunicaciones = await dataService.getAll(
        [
          "*",
          "alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos))",
          "apoderados(apoderado_id,personas(persona_id,nombres,apellidos),telefono_contacto1,telefono_contacto2,email_contacto1,email_contacto2)",
          "usuarios(usuario_id,nombre_social)"
        ],
       where
      );
      res.json(historialComunicaciones);
      }







     
    } catch (error) {
      res.status(500).json(error);
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const historialcomunicacion = new HistorialComunicacion();
      Object.assign(historialcomunicacion, req.body);
      historialcomunicacion.creado_por = req.creado_por;
      historialcomunicacion.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = HistorialComunicacionSchema.validate(req.body);
      const { data, error } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", historialcomunicacion.alumno_id)
        .single();
      if (error || !data) {
        throw new Error("El alumno no existe");
      }
      const { data:dataUsuario, error:errorUsuario } = await client
        .from("usuarios")
        .select("*")
        .eq("usuario_id", historialcomunicacion.usuario_id)
        .single();
      if (errorUsuario || !dataUsuario) {
        throw new Error("El Usuario no existe");
      } 
      const { data:dataApoderado, error:errorApoderado} = await client
        .from("apoderados")
        .select("*")
        .eq("apoderado_id", historialcomunicacion.apoderado_id)
        .single();
      if (errorApoderado || !dataApoderado) {
        throw new Error("El apoderado no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const historialcomunicacionCreado = await dataService.processData(historialcomunicacion);
        res.status(201).json(historialcomunicacionCreado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const historialComunicacionId = parseInt(req.params.id);

const historialActualizado = new HistorialComunicacion();
      Object.assign(historialActualizado, req.body);
      historialActualizado.creado_por = req.creado_por;
      historialActualizado.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = HistorialComunicacionSchema.validate(req.body);
      const { data, error } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", historialActualizado.alumno_id)
        .single();
      if (error || !data) {
        throw new Error("El alumno no existe");
      }
      const { data:dataUsuario, error:errorUsuario } = await client
        .from("usuarios")
        .select("*")
        .eq("usuario_id", historialActualizado.usuario_id)
        .single();
      if (errorUsuario || !dataUsuario) {
        throw new Error("El Usuario no existe");
      } 
      const { data:dataApoderado, error:errorApoderado} = await client
        .from("apoderados")
        .select("*")
        .eq("apoderdo_id", historialActualizado.apoderado_id)
        .single();
      if (errorApoderado || !dataApoderado) {
        throw new Error("El apoderado no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
      const resultado = await dataService.updateById(
        historialComunicacionId,
        historialActualizado
      );
      res.status(200).json(resultado);
      }




    } catch (error) {
      res.status(500).json(error);
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const historialComunicacionId = parseInt(req.params.id);
      await dataService.deleteById(historialComunicacionId);
      res.status(200).json({ message: "Curso eliminado" });
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
