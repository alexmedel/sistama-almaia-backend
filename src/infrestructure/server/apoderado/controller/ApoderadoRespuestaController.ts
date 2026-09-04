 
import { Request, Response } from "express";
 import { ApoderadoRespuestaService } from "../ApoderadoRespuestaService";

export const ApoderadoRespuestaController = {
  async obtener(req: Request, res: Response) {
    try {
      const data = await ApoderadoRespuestaService.obtenerRespuestas(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      console.error("Error al obtener la apoderadorespuesta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
  async guardar(req: Request, res: Response) {
    try {
      const savedApoderadoRespuesta = await ApoderadoRespuestaService.guardarRespuesta(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      res.status(201).json(savedApoderadoRespuesta);
    } catch (err: any) {
      console.error("Error al guardar el apoderadorespuesta:", err);
      res.status(500).json({ message: err.message || "Error inesperado" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await ApoderadoRespuestaService.actualizarRespuesta(
        id,
        req.body,
        req.actualizado_por
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al actualizar la apoderadorespuesta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await ApoderadoRespuestaService.eliminarRespuesta(id);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al eliminar la apoderadorespuesta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
  async responderpregunta(req: Request, res: Response) {
    try {
      const result = await ApoderadoRespuestaService.responderPregunta(
        req.body,
        req.actualizado_por,
        req.fecha_creacion
      );
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error al responder la pregunta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
};