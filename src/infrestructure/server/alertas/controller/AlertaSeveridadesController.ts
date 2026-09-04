import { Request, Response } from "express";
import { AlertaSeveridadesService } from "../AlertaSeveridadService";
import { AlertaSeveridad } from "../../../../core/modelo/alerta/AlertaSeveridad";
 

export const AlertaSeveridadesController = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query;
      const alertaSeveridad = await AlertaSeveridadesService.obtener(where);
      res.status(200).json(alertaSeveridad);
    } catch (error) {
      console.error("Error al obtener la alerta de severidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const alertaSeveridad: AlertaSeveridad = req.body;
      const savedAlertaSeveridad = await AlertaSeveridadesService.guardar(alertaSeveridad);
      res.status(201).json(savedAlertaSeveridad);
    } catch (error) {
      console.error("Error al guardar la alerta de severidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alertaSeveridad: AlertaSeveridad = req.body;
      const result = await AlertaSeveridadesService.actualizar(id, alertaSeveridad);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al actualizar la alerta de severidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaSeveridadesService.eliminar(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al eliminar la alerta de severidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};