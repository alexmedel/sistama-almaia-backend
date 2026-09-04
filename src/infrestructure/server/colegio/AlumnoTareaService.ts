import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import Joi from "joi";
import { AlumnoTarea } from "../../../core/modelo/colegio/AlumnoTarea";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { DataService } from "../DataService";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const AlumnoTareaSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  fecha_programacion: Joi.string().required(),
  materia_id: Joi.number().integer().required(),
  color: Joi.string().max(50).required(),
  tipo_tarea: Joi.string().max(8).required(),
  descripcion_tarea: Joi.string().max(100).required(),
  estado_tarea: Joi.string().max(11).required(),
  creado_por: Joi.number().integer().required(), 
  actualizado_por: Joi.number().integer().required(), 
});
const dataService: DataService<AlumnoTarea> = new DataService(
  "alumnos_tareas",
  "alumno_tarea_id"
);
export const AlumnoTareasService = {
  async obtener(req: Request, res: Response) {
     console.log("Query recibido en AlumnoTareasService:", req.query);
    try {
      const { colegio_id, ...where } = req.query;
     
      let respuestaEnviada = false;
      
      if (colegio_id !== undefined) {
        const alumnotareas = await obtenerRelacionados({
          tableFilter: "alumnos",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "alumno_id",
          tableIn: "alumnos_tareas",
          inField: "alumno_id",
          selectFields: `*,                      
                              alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos)),
                              materias(materia_id,nombre)`,
        });
        respuestaEnviada = true;
        res.json(alumnotareas);
      }
      if (!respuestaEnviada) {
        const alumnotareas = await dataService.getAll(
          [
            "*",
            "alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos))",
            "materias(materia_id,nombre)",
          ],
          { ...where, activo: true }
        );
        res.json(alumnotareas);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
  async getColegioByUser( req: Request, res: Response) {
    try {}catch (error) {
      res.status(500).json(error);
    }
  },
  async guardar(req: Request, res: Response): Promise<void> {
    console.log(req.body);
    try {
        const nuevoAlumnoTarea = new AlumnoTarea();
        Object.assign(nuevoAlumnoTarea, req.body);
        console.log(nuevoAlumnoTarea);
        nuevoAlumnoTarea.creado_por = req.creado_por;
        nuevoAlumnoTarea.actualizado_por = req.actualizado_por;

        // Eliminar el campo "activo" antes de la validación
        delete req.body.activo;

        const { error: validationError } = AlumnoTareaSchema.validate(req.body);
        if (validationError) {
            console.error("Error de validación:", validationError.details[0].message);
            res.status(400).json({ message: validationError.details[0].message });
            return;
        }

        const { data: dataAlumno, error: errorAlumno } = await client
            .from("alumnos")
            .select("*")
            .eq("alumno_id", nuevoAlumnoTarea.alumno_id)
            .single();

        if (errorAlumno || !dataAlumno) {
            console.error("Error: El alumno no existe o hubo un problema con la consulta.", errorAlumno);
            res.status(404).json({ message: "El alumno no existe" });
            return;
        }

        try {
            const resultado = await dataService.processData(nuevoAlumnoTarea);
            res.status(201).json(resultado);
        } catch (processError) {
            console.error("Error al procesar los datos:", processError);
            res.status(500).json({ message: "Error al guardar la tarea." });
        }
    } catch (error) {
        console.error("Error inesperado en AlumnoTareasService.guardar:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alumnoTareaActualizado = new AlumnoTarea();
      Object.assign(alumnoTareaActualizado, req.body);
      alumnoTareaActualizado.actualizado_por = req.actualizado_por;
      alumnoTareaActualizado.activo = true;
      let responseSent = false;
      const { error: validationError } = AlumnoTareaSchema.validate(req.body);
      const { data: dataAlumno, error: errorAlumno } = await client
        .from("alumnos")
        .select("*")
        .eq("alumno_id", alumnoTareaActualizado.alumno_id)
        .single();
      if (errorAlumno || !dataAlumno) {
        throw new Error("El alumno no existe");
      }
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const resultado = await dataService.updateById(
          id,
          alumnoTareaActualizado
        );
        res.json(resultado);
      }
    } catch (error) {

      res.status(500).json(error);
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      console.log("eliminar tarea");
      const id = parseInt(req.params.id);
      const resultado = await dataService.deleteById(id);
      res.json(resultado);
    } catch (error) {
      res.status(500).json(error);
    }
  },
};
