import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Curso } from "../../../core/modelo/colegio/Curso";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const CursoSchema = Joi.object({
  nombre_curso: Joi.string().max(50).required(),
  colegio_id: Joi.number().integer().required(),
  grado_id: Joi.number().integer().required(),
  nivel_id: Joi.number().integer().required(),
});
const dataService: DataService<Curso> = new DataService("cursos");
export const CursosService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query}; // Convertir los parámetros de consulta en filtros
      console.log("Filtros de consulta:", where); // Depuración: mostrar los filtros en la consola
      const cursos = await dataService.getAll(
        [
          "*",
          "colegios(colegio_id,nombre)",
          "grados(grado_id,nombre)",
          "niveles_educativos(nivel_educativo_id,nombre)",
        ],
        where
      );
      res.json(cursos);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const curso = new Curso();
      Object.assign(curso, req.body);
      curso.creado_por = req.creado_por;
      curso.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = CursoSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", curso.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      const { data: dataGrado, error: errorGrado } = await client
        .from("grados")
        .select("*")
        .eq("grado_id", curso.grado_id)
        .single();
      if (errorGrado || !dataGrado) {
        throw new Error("El grado no existe");
      }
      const { data: dataNivelEducativo, error: errorNivelEducativo } =
        await client
          .from("niveles_educativos")
          .select("*")
          .eq("nivel_educativo_id", curso.nivel_educativo_id)
          .single();
      if (errorNivelEducativo || !dataNivelEducativo) {
        throw new Error("El nivel educativo no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const cursoCreado = await dataService.processData(curso);
        res.status(201).json(cursoCreado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const cursoId = parseInt(req.params.id);

      const curso = new Curso();
      Object.assign(curso, req.body);
      curso.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = CursoSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", curso.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      const { data: dataGrado, error: errorGrado } = await client
        .from("grados")
        .select("*")
        .eq("grado_id", curso.grado_id)
        .single();
      if (errorGrado || !dataGrado) {
        throw new Error("El grado no existe");
      }
      const { data: dataNivelEducativo, error: errorNivelEducativo } =
        await client
          .from("niveles_educativos")
          .select("*")
          .eq("nivel_educativo_id", curso.nivel_educativo_id)
          .single();
      if (errorNivelEducativo || !dataNivelEducativo) {
        throw new Error("El nivel educativo no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const resultado = await dataService.updateById(cursoId, curso);
        res.status(200).json(resultado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const cursoId = parseInt(req.params.id);
      await dataService.deleteById(cursoId);
      res.status(200).json({ message: "Curso eliminado" });
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
