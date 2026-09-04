// src/services/InformeGeneralService.ts
 
import { Request, Response } from "express";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { MotorInformeService } from "./MotorInformeService";
import { InformeGeneralBusiness } from "./funciones/InformeGeneralBusiness";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { InformeGeneralPdfService } from "./InformeGeneralPdfService";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const InformeGeneralService = {
  async obtener(req: Request, res: Response) {
    try {
      const response = await InformeGeneralBusiness.obtener(client, req.query);
      FormatResponse(res, STATUS_CODES.OK, response);
    } catch (error) {
      errorHandler.handleError(error, res, "InformeGeneralService.obtener");
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedInformeGeneral = await InformeGeneralBusiness.guardar(client, req.body, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });
      FormatResponse(res, STATUS_CODES.CREATED, savedInformeGeneral);
    } catch (err) {
      errorHandler.handleError(err, res, "InformeGeneralService.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const informeId = parseInt(req.params.id);
      if (isNaN(informeId)) {
          res.status(400).json({ message: "ID no válido." });
      }
      const updatedInformeGeneral = await InformeGeneralBusiness.actualizar(client, informeId, req.body, {
        creado_por: req.creado_por,
        actualizado_por: req.actualizado_por,
      });
      FormatResponse(res, STATUS_CODES.OK, updatedInformeGeneral);
    } catch (error) {
      errorHandler.handleError(error, res, "InformeGeneralService.actualizar");
    }
  },

  eliminar: async (req: Request, res: Response) => {
    try {
      const informeId = parseInt(req.params.id);
      if (isNaN(informeId)) {
          res.status(400).json({ message: "ID no válido." });
      }
      await InformeGeneralBusiness.eliminar(informeId);
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Informe eliminado correctamente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "InformeGeneralService.eliminar");
    }
  },

  async generarInformeManual(req: Request, res: Response) {
    try {
      await MotorInformeService.generarInformeGenerales();
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Informe generado manualmente",
      });
    } catch (error) {
      errorHandler.handleError(error, res, "InformeGeneralService.generarInformeManual");
    }
  },

  async generarPdfGeneral(req: Request, res: Response) {
    try {
      const informeId = Number(req.params.id);
      if (!Number.isInteger(informeId) || informeId <= 0) {
        FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          message: "ID de informe no válido.",
        });
        return;
      }

      const disposition =
        req.query.disposition === "attachment" ? "attachment" : "inline";
      const { pdfBuffer, filename } =
        await InformeGeneralPdfService.generarPdfGeneral(informeId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${filename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (error) {
      errorHandler.handleError(error, res, "InformeGeneralService.generarPdfGeneral");
    }
  },
};
