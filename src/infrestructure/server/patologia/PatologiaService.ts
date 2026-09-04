import { SupabaseClient } from "@supabase/supabase-js";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { Patologia } from "../../../core/modelo/Patologia";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { DataService } from "../DataService";
import { Request, Response } from "express";

const dataService: DataService<Patologia> = new DataService("patologias");
const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
export const PatologiaService = {
  async obtener(req: Request, res: Response) {
    try {
      // const patologias = [
      //   {
      //     patologia_id: 1,
      //     nombre: "Patologia 1",
      //   },
      // ];
      const { data:patologias, error } = await client.from("patologias")
      .select("*")
      .order("patologia_id", { ascending: false })
      ;
      return FormatResponse(res, STATUS_CODES.OK, patologias);
    } catch (error) {
      errorHandler.handleError(error, res, "PatologiaService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const patologia: Patologia = req.body;
      const savedPatologia = await dataService.processData(patologia);

      return FormatResponse(res, STATUS_CODES.OK, savedPatologia);
    } catch (error) {
      errorHandler.handleError(error, res, "PatologiaService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const patologia: Patologia = req.body;
      await dataService.updateById(id, patologia);
      return FormatResponse(res, STATUS_CODES.OK, patologia);
    } catch (error) {
      errorHandler.handleError(error, res, "PatologiaService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);

      return FormatResponse(res, STATUS_CODES.OK, {
        message: "Patologia eliminada correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "PatologiaService.eliminar");
    }
  },
};
