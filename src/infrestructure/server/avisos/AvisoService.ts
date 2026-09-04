// AvisosService.ts - Versión Corregida
import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Aviso } from "../../../core/modelo/aviso/Aviso";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import Joi from "joi";
import { obtenerRelacionados } from "../../../core/services/ObtenerTablasColegioCasoUso";
import { errorHandler, ErrorHandler } from "../../../helpers/ErrorResponse";
import { AvisoQueryParams, MESSAGES, STATUS_CODES  } from "./types/types";
import { AvisoSchema, QuerySchema } from "./shema/Schema";
import { FormatResponse } from "../../../helpers/Response";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();

const dataService: DataService<Aviso> = new DataService("avisos", "aviso_id");

export const AvisosService = {
  async obtener(req: Request, res: Response): Promise<void> {
    try {
      // ✅ MEJORA: Validación de query parameters
      const { error: queryError, value: queryParams } = QuerySchema.validate(
        req.query
      );
      if (queryError) {
        ErrorHandler.throwValidationError(queryError.details[0].message);
      }

      const { colegio_id, ...where } = queryParams as AvisoQueryParams;

      if (colegio_id !== undefined) {
        const avisos = await obtenerRelacionados({
          tableFilter: "docentes",
          filterField: "colegio_id",
          filterValue: colegio_id,
          idField: "docente_id",
          tableIn: "avisos",
          inField: "docente_id",
          selectFields: `*,                      
                        docentes(docente_id,especialidad,estado,personas(persona_id,nombres,apellidos))`,
        });
       return FormatResponse(res,STATUS_CODES.OK,avisos);
        
      }

      const avisos = await dataService.getAll(
        [
          "*",
          "docentes(docente_id,especialidad,estado,personas(persona_id,nombres,apellidos))",
        ],
        where
      );
      FormatResponse( res  ,STATUS_CODES.OK , avisos );
      
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.obtener");
    }
  },

  async guardar(req: Request, res: Response): Promise<void> {
    try {
      
      await AvisosService.validateAvisoData(req.body);
      await AvisosService.validateDocenteExists(req.body.docente_id);

      const aviso: Aviso = new Aviso();
      Object.assign(aviso, req.body);

      // ✅ SOLUCIÓN: Validar y asignar valores por defecto
      if (req.creado_por === undefined) {
        throw new Error("Usuario creador no identificado");
      }
      if (req.actualizado_por === undefined) {
        throw new Error("Usuario actualizador no identificado");
      }

      aviso.creado_por = req.creado_por;
      aviso.actualizado_por = req.actualizado_por;

      const savedAviso = await dataService.processData(aviso);
      FormatResponse(res,STATUS_CODES.CREATED,savedAviso);
       
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.guardar");
    }
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      
      const id = AvisosService.validateAndParseId(req.params.id);
      await AvisosService.validateAvisoData(req.body);
      await AvisosService.validateDocenteExists(req.body.docente_id);

      const aviso: Aviso = new Aviso();
      if (req.creado_por === undefined) {
        throw new Error("Usuario creador no identificado");
      }
      if (req.actualizado_por === undefined) {
        throw new Error("Usuario actualizador no identificado");
      }
      Object.assign(aviso, req.body);
      aviso.actualizado_por = req.actualizado_por;

      await dataService.updateById(id, aviso);
      FormatResponse(res,STATUS_CODES.OK,aviso);
      
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.actualizar");
    }
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = AvisosService.validateAndParseId(req.params.id);

      await dataService.deleteById(id);
      FormatResponse(res,STATUS_CODES.OK,{message:MESSAGES.AVISO_DELETED});
      
    } catch (error) {
      errorHandler.handleError(error, res, "AvisosService.eliminar");
    }
  },

  // ✅ MEJORA: Métodos auxiliares para reutilización
  async validateAvisoData(data: any): Promise<void> {
    const { error } = AvisoSchema.validate(data);
    if (error) {
      ErrorHandler.throwValidationError(error.details[0].message);
    }
  },

  async validateDocenteExists(docenteId: number): Promise<void> {
    const { data, error } = await client
      .from("docentes")
      .select("docente_id")
      .eq("docente_id", docenteId)
      .single();

    if (error || !data) {
      ErrorHandler.throwCustomError(
        "DOCENTE_NOT_FOUND",
        MESSAGES.DOCENTE_NOT_FOUND,
        STATUS_CODES.NOT_FOUND
      );
    }
  },

  validateAndParseId(idParam: string): number {
    const { error, value } = Joi.number()
      .integer()
      .positive()
      .validate(parseInt(idParam));

    if (error || isNaN(parseInt(idParam))) {
      ErrorHandler.throwValidationError(MESSAGES.INVALID_ID);
    }

    return value as number;
  },

  // ✅ MEJORA: Método para logging condicional
  logInfo(context: string, message: string, data?: any): void {
    if (process.env.NODE_ENV === "development") {
      console.info(`[AvisosService.${context}] ${message}`, data || "");
    }
  },
};
