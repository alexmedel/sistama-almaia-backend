/* eslint-disable @typescript-eslint/no-unused-vars */
import { SupabaseClient } from "@supabase/supabase-js";
import { NextFunction, Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { fetchConceptosAsociados, fetchEstados, fetchTiposEncuesta, fetchTiposPreguntas } from "./catalogoRepository";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();


export const CatalogoService = {

  async getEstados(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await fetchEstados();
      return FormatResponse(res, 200, data);
    } catch (err) {
      errorHandler.handleError(err, res, "CatalogoService.getEstados");
    }
  },

  async getConceptosAsociados(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await fetchConceptosAsociados();
      return FormatResponse(res, 200, data);
    } catch (err) {
      errorHandler.handleError(
        err,
        res,
        "CatalogoService.getConceptosAsociados"
      );
    }
  },

  async getTiposEncuesta(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await fetchTiposEncuesta();
      return FormatResponse(res, 200, data);
    } catch (err) {
      errorHandler.handleError(err, res, "CatalogoService.getTiposEncuesta");
    }
  },

  async getTiposPreguntas(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await fetchTiposPreguntas();
      return FormatResponse(res, 200, data);
    } catch (err) {
      errorHandler.handleError(err, res, "CatalogoService.getTiposPreguntas");
    }
  },
  async getAllCatalogos(req: Request, res: Response, next: NextFunction) {
    try {
      const [estados, conceptosAsociados, tiposEncuesta, tiposPreguntas] =
        await Promise.all([
          fetchEstados(),
          fetchConceptosAsociados(),
          fetchTiposEncuesta(),
          fetchTiposPreguntas(),
        ]);

      const payload = {
        estados,
        conceptosAsociados,
        tiposEncuesta,
        tiposPreguntas,
      };

      return FormatResponse(res, 200, payload);
    } catch (err) {
      errorHandler.handleError(err, res, "CatalogoService.getAllCatalogos");
    }
  },
};