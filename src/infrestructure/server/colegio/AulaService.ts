import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Aula } from "../../../core/modelo/colegio/Aula";
import Joi from "joi";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const AulaSchema = Joi.object({
  tipo_docente: Joi.string().max(15).required(),
  curso_id: Joi.number().integer().required(),
  colegio_id: Joi.number().integer().required(),
  materia_id: Joi.number().integer().required(),
  docente_id: Joi.number().integer().required(),
});
const dataService: DataService<Aula> = new DataService("aulas","aula_id");
export const AulasService = {
  async obtener(req: Request, res: Response) {
    try {
      const aulas = await dataService.getAll(
        [
          "*",
          "colegios(colegio_id,nombre)",
          "cursos(grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))",
          "materias(materia_id,nombre,codigo)",
          "docentes(docente_id,especialidad,estado,personas(persona_id,nombres,apellidos))",
        ],
        req.query
      );
      res.json(aulas);
    } catch (error) {
      res.status(500).json(error);
    }
  },

 guardar: async (req: Request, res: Response) => {
    try {
      const aula: Aula = new Aula();
      Object.assign(aula, req.body);
      aula.creado_por = req.creado_por;
      aula.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = AulaSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", aula.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      } const { data:datacurso, error:errorCurso } = await client
        .from("cursos")
        .select("*")
        .eq("curso_id", aula.curso_id)
        .single();
      if (errorCurso || !datacurso) {
        throw new Error("El curso no existe");
      } 
      const { data:dataMateria, error:errorMateria } = await client
        .from("materias")
        .select("*")
        .eq("materia_id", aula.materia_id)
        .single();
      if (errorMateria || !dataMateria) {
        throw new Error("La Materia no existe");
      }
      const { data:dataDocente, error:errorDocente } = await client
        .from("docentes")
        .select("*")
        .eq("docente_id", aula.docente_id)
        .single();
      if (errorDocente || !dataDocente) {
        throw new Error("El docente no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {

        const savedAula = await dataService.processData(aula);
        res.status(201).json(savedAula);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error al guardar el aula:", error);
      res.status(500).json({ message: error.message || "Error inesperado" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const aula: Aula = new Aula();
      Object.assign(aula, req.body);
      aula.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = AulaSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", aula.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      } const { data:datacurso, error:errorCurso } = await client
        .from("cursos")
        .select("*")
        .eq("curso_id", aula.curso_id)
        .single();
      if (errorCurso || !datacurso) {
        throw new Error("El curso no existe");
      } 
      const { data:dataMateria, error:errorMateria } = await client
        .from("materias")
        .select("*")
        .eq("materia_id", aula.materia_id)
        .single();
      if (errorMateria || !dataMateria) {
        throw new Error("La Materia no existe");
      }
      const { data:dataDocente, error:errorDocente } = await client
        .from("docentes")
        .select("*")
        .eq("docente_id", aula.docente_id)
        .single();
      if (errorDocente || !dataDocente) {
        throw new Error("El docente no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, aula);
        res.status(200).json({ message: "Aula actualizado correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar el aula:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res.status(200).json({ message: "Aula eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el aula:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
