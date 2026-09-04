import { Request, Response } from "express";
import { AlertaEstadosService } from "../AlertaEstadoService";
 
export const AlertaEstadosController = {
  async obtener(req: Request, res: Response) {
    try {
      const alertaEstado = await AlertaEstadosService.obtener(
        req.query,
        req.supabase
      );
      res.status(200).json(alertaEstado);
    } catch (error) {
      console.error("Error al obtener la alerta estado:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const savedAlertaEstado = await AlertaEstadosService.guardar(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      res.status(201).json(savedAlertaEstado);
    } catch (error: any) {
      console.error("Error al guardar la alerta estado:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaEstadosService.actualizar(
        id,
        req.body,
        req.actualizado_por
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al actualizar la alerta estado:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaEstadosService.eliminar(id);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al eliminar la alerta estado:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
};
