import { Request, Response } from "express";
import { AlertaReglasService } from "../AlertaReglaService";
import { AlertaRegla } from "../../../../core/modelo/alerta/AlertaRegla";
 

export const AlertaReglasController = {
  async obtener(req: Request, res: Response) {
    try {
      const reglasAlertas = await AlertaReglasService.obtener();
      res.status(200).json(reglasAlertas);
    } catch (error) {
      console.error("Error al obtener las reglas de alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async guardar(req: Request, res: Response) {
    try {
      const alertaRegla: AlertaRegla = req.body;
      const savedAlertaRegla = await AlertaReglasService.guardar(alertaRegla);
      res.status(201).json(savedAlertaRegla);
    } catch (error) {
      console.error("Error al guardar la regla de alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alertaRegla: AlertaRegla = req.body;
      const result = await AlertaReglasService.actualizar(id, alertaRegla);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al actualizar la regla de alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaReglasService.eliminar(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al eliminar la regla de alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};