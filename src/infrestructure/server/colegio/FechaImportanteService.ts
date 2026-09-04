import { Request, Response } from "express";
import { DataService } from "../DataService";
import { CalendarioFechaImportante } from "../../../core/modelo/colegio/CalendarioFechaImportante";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const CalendarioFechaImportanteSchema = Joi.object({
  titulo: Joi.string().max(100).required(),
  descripcion: Joi.string().max(100).required(),
  fecha: Joi.string().required(),
  tipo: Joi.string().max(50).required(),
  colegio_id: Joi.number().integer().required(),
  calendariofechaimportante_id: Joi.number().integer().required(),
  calendario_escolar_id: Joi.number().integer().required(),
});
const dataService: DataService<CalendarioFechaImportante> = new DataService(
  "calendarios_fechas_importantes","calendario_fecha_importante_id"
);
export const CalendarioFechaImportantesService = {
  async obtener(req: Request, res: Response) {
    try {
      const fechasImportantes = await dataService.getAll(["*",
        "colegios(colegio_id,nombre)",
        "cursos(nombre_curso,grados(grado_id,nombre),niveles_educativos(nivel_educativo_id,nombre))",
        "calendarios_escolares(calendario_escolar_id,ano_escolar,fecha_inicio,fecha_fin,dias_habiles)"
      ], req.query);
            res.json(fechasImportantes);
    } catch (error) {
      (error);
      
      res.status(500).json(error);
    }
  },

 async guardar(req: Request, res: Response) {
    try {
      const calendariofechaimportante = new CalendarioFechaImportante();
      Object.assign(calendariofechaimportante, req.body);
      calendariofechaimportante.creado_por = req.creado_por;
      calendariofechaimportante.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = CalendarioFechaImportanteSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", calendariofechaimportante.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      const { data: dataCalendarioEscolar, error: errorCalendarioEscolar } = await client
        .from("calendarios_escolares")
        .select("*")
        .eq("calendario_escolar_id", calendariofechaimportante.calendario_escolar_id)
        .single();
      if (errorCalendarioEscolar || !dataCalendarioEscolar) {
        throw new Error("El calendario no existe");
      }
      const { data: dataCurso, error: errorCurso } =
        await client
          .from("cursos")
          .select("*")
          .eq("curso_id", calendariofechaimportante.curso_id)
          .single();
      if (errorCurso || !dataCurso) {
        throw new Error("El curso no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const calendariofechaimportanteCreado = await dataService.processData(calendariofechaimportante);
        res.status(201).json(calendariofechaimportanteCreado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const calendariofechaimportanteId = parseInt(req.params.id);

      const calendariofechaimportante = new CalendarioFechaImportante();
      Object.assign(calendariofechaimportante, req.body);
      calendariofechaimportante.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = CalendarioFechaImportanteSchema.validate(req.body);
      const { data, error } = await client
        .from("colegios")
        .select("*")
        .eq("colegio_id", calendariofechaimportante.colegio_id)
        .single();
      if (error || !data) {
        throw new Error("El colegio no existe");
      }
      const { data: dataCalendarioEscolar, error: errorCalendarioEscolar } = await client
        .from("calendarios_escolares")
        .select("*")
        .eq("calendario_escolar_id", calendariofechaimportante.calendario_escolar_id)
        .single();
      if (errorCalendarioEscolar || !dataCalendarioEscolar) {
        throw new Error("El calendario no existe");
      }
      const { data: dataCurso, error: errorCurso } =
        await client
          .from("cursos")
          .select("*")
          .eq("curso_id", calendariofechaimportante.curso_id)
          .single();
      if (errorCurso || !dataCurso) {
        throw new Error("El curso no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const resultado = await dataService.updateById(calendariofechaimportanteId, calendariofechaimportante);
        res.status(200).json(resultado);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const calendariofechaimportanteId = parseInt(req.params.id);
      await dataService.deleteById(calendariofechaimportanteId);
      res.status(200).json({ message: "CalendarioFechaImportante eliminado" });
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
