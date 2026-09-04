import { Request, Response } from "express";
import { DataService } from "../DataService";
import { AlumnoPermisoAutor } from "../../../core/modelo/alumno/AlumnoPermisoAutor";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";
import { AlumnoPermisoAutorSchema } from "./shema/AlumnoPermisoAutorSchema";
import { alumnopermisoautorQuery } from "./querys/alumnopermisoautorQuery";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { guardarAlumnoPermisoAutorService } from "./funciones/AlumnosPermisos/obtener";
import { actualizarAlumnoPermisoAutorService } from "./funciones/AlumnosPermisos/actualizar";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<AlumnoPermisoAutor> = new DataService(
  "alumnos_permisos_autores",
  "alumno_permiso_autor_id"
);

export const AlumnoPermisoAutorsService = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query;
      let respuestaEnviada = false;
      if (colegio_id !== undefined) {
        const alumnopermisoautor = await obtenerRelacionados({
          tableFilter: "alumnos",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "alumno_id",
          tableIn: "alumnos_permisos_autores",
          inField: "alumno_id",
          selectFields: `*,                      
                         alumnos(alumno_id,url_foto_perfil,telefono_contacto1,telefono_contacto2,email,personas(persona_id,nombres,apellidos)),
                         apoderados(apoderado_id,personas(persona_id,nombres,apellidos),telefono_contacto1,telefono_contacto2,email_contacto1,email_contacto2)`,
        });
        respuestaEnviada = true;
        return FormatResponse(res, 200, alumnopermisoautor);
      }
      if (!respuestaEnviada) {
        const alumnopermisoautor = await dataService.getAll(
          alumnopermisoautorQuery,
          where
        );
        return FormatResponse(res, 200, alumnopermisoautor);
      }
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoPermiso.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      // 1. Llamar al servicio de negocio para validar los datos
      const dataToSave = await guardarAlumnoPermisoAutorService(
        req.supabase,
        req.body,
        { creado_por: req.creado_por, actualizado_por: req.actualizado_por }
      );

      // 2. Guardar los datos si la validación es exitosa
      const savedAlumnoPermisoAutor = await dataService.processData(dataToSave);
      return FormatResponse(res, 201, savedAlumnoPermisoAutor);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoPermiso.guardar");
    }
  },
  actualizar: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "ID de registro no válido." });
      }
      const dataToUpdate = await actualizarAlumnoPermisoAutorService(
        req.supabase,
        id,
        req.body,
        { actualizado_por: req.actualizado_por }
      );

      // Realizamos la actualización en la base de datos.
      await dataService.updateById(id, dataToUpdate);

      FormatResponse(res, 200, {
        message: "AlumnoPermisoAutor actualizada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoPermiso.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, {
        message: "AlumnoPermisoAutor eliminada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoPermisoAutor.eliminar");
    }
  },
};
