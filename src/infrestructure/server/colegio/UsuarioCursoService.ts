import { Request, Response } from "express";
import { DataService } from "../DataService";
import { UsuarioCurso } from "../../../core/modelo/colegio/UsuarioCurso";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const UsuarioCursoSchema = Joi.object({
  fecha_asignacion: Joi.date().required(),
  curso_id: Joi.number().integer().required(),
  usuarios_colegio_id: Joi.number().integer().required(),
});
const dataService: DataService<UsuarioCurso> = new DataService("usuarios_cursos");
export const UsuarioCursosService = {
  async obtener(req: Request, res: Response) {
    try {    
      const usuariocursos = await dataService.getAll(
        [
          "*",
          "usuarios_colegios(usuarios_colegio_id,fecha_asignacion,usuarios(usuario_id,nombre_social))",
         "cursos(curso_id,nombre_curso)",
        ],
        req.query
      );
      res.json(usuariocursos);
    } catch (error) {
      
      res.status(500).json(error);
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const usuariocurso = new UsuarioCurso();
      Object.assign(usuariocurso, req.body);
      usuariocurso.creado_por = req.creado_por;
      usuariocurso.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = UsuarioCursoSchema.validate(req.body);
      const { data, error } = await client
        .from("cursos")
        .select("*")
        .eq("curso_id", usuariocurso.curso_id)
        .single();
      if (error || !data) {
        throw new Error("El curso no existe");
      }
      const { data:dataUsuario, error:errorUsuario } = await client
        .from("usuarios_colegios")
        .select("*")
        .eq("usuarios_colegio_id", usuariocurso.usuarios_colegio_id)
        .single();
      if (errorUsuario || !dataUsuario) {
        
        throw new Error("El Usuario no existe");
      } 
    
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const usuariocursoCreado = await dataService.processData(usuariocurso);
        res.status(201).json(usuariocursoCreado);
      }
    } catch (error) {
      
      res.status(500).json(error);
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const usuariocursoId = parseInt(req.params.id);

      const usuariocurso = new UsuarioCurso();
      Object.assign(usuariocurso, req.body);
      usuariocurso.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = UsuarioCursoSchema.validate(req.body);
       const { data, error } = await client
        .from("cursos")
        .select("*")
        .eq("curso_id", usuariocurso.curso_id)
        .single();
      if (error || !data) {
        throw new Error("El curso no existe");
      }
      const { data:dataUsuario, error:errorUsuario } = await client
        .from("usuarios_colegios")
        .select("*")
        .eq("usuario_colegio_id", usuariocurso.usuarios_colegio_id)
        .single();
      if (errorUsuario || !dataUsuario) {
        throw new Error("El Usuario no existe");
      } 
    
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const resultado = await dataService.updateById(usuariocursoId, usuariocurso);
        res.status(200).json(resultado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const usuariocursoId = parseInt(req.params.id);
      await dataService.deleteById(usuariocursoId);
      res.status(200).json({ message: "UsuarioCurso eliminado" });
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
