// src/services/AlumnoInformeService.ts
 
import { Request, Response } from "express";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { AlumnoInformePdfService } from "./AlumnoInformePdfService";
import { MotorInformeService } from "./MotorInformeService";
import { AlumnoInformeBusiness } from "./funciones/AlumnoInformeBusiness";

const supabaseService = new SupabaseAdminService();
const client = supabaseService.getClient();

export const AlumnoInformeService = {
  async obtener(req: Request, res: Response) {
    try {
      if(req.query.alumno_id === undefined){
        
        FormatResponse(res, STATUS_CODES.NOT_FOUND, {
          message: "No se encontró ningún informe de alumno.",
        });
      }
      const alumnoInforme = await AlumnoInformeBusiness.obtener(req.query);
      
      FormatResponse(res, STATUS_CODES.OK, alumnoInforme);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoInformeService.obtener");
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedAlumnoInforme = await AlumnoInformeBusiness.guardar(
        client,
        req.body,
        {
          creado_por: req.creado_por,
          actualizado_por: req.actualizado_por,
        }
      );
      FormatResponse(res, STATUS_CODES.CREATED, savedAlumnoInforme);
    } catch (err) {
      errorHandler.handleError(err, res, "AlumnoInformeService.guardar");
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          res.status(400).json({ message: "ID no válido." });
      }
      const result = await AlumnoInformeBusiness.actualizar(
        client,
        id,
        req.body,
        {
          actualizado_por: req.actualizado_por,
        }
      );
      FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoInformeService.actualizar");
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
          res.status(400).json({ message: "ID no válido." });
      }
      const result = await AlumnoInformeBusiness.eliminar(id);
      FormatResponse(res, STATUS_CODES.OK, result);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoInformeService.eliminar");
    }
  },

  async generarInformeManual(req: Request, res: Response) {
    try {
      await MotorInformeService.generarInformeAlumnos();
      FormatResponse(res, STATUS_CODES.OK, {
        message: "Informe generado manualmente",
      });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "AlumnoInformeService.generarInformeManual"
      );
    }
  },

  async generarPdfAlumno(req: Request, res: Response) {
    try {
      const alumnoInformeId = Number(req.params.id);
      if (!Number.isInteger(alumnoInformeId) || alumnoInformeId <= 0) {
        FormatResponse(res, STATUS_CODES.BAD_REQUEST, {
          message: "ID de informe no válido.",
        });
        return;
      }

      const disposition =
        req.query.disposition === "attachment" ? "attachment" : "inline";
      const { pdfBuffer, filename } =
        await AlumnoInformePdfService.generarPdfAlumno(alumnoInformeId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${filename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (error) {
      errorHandler.handleError(error, res, "AlumnoInformeService.generarPdfAlumno");
    }
  },
  

  async obtenerInformesPendientes(tipoInforme: number) {
    const { data, error } = await client.rpc("consultar_informes_pendientes_generacion", {
      p_tipo_informes: tipoInforme,
    });
    if (error) {
      throw new Error("Error al consultar informes pendientes de generación");
    }
    return data;
  },


  async actualizarInforme(id: number, fileUrl: string) {
    const { error } = await client
      .from("alumnos_informes")
      .update({
        generado: true,
        url_reporte: fileUrl,
        fecha_actualizacion: new Date().toUTCString(),
      })
      .eq("alumno_informe_id", id);

    if (error) {
      throw new Error(`Error al actualizar el informe con ID ${id}`);
    }
  },

};
