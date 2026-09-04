import { Request, Response } from "express";
import { AlertaPrioridadsService } from "../AlertaPrioridadService";
import { AlertaPrioridad } from "../../../../core/modelo/alerta/AlertaPrioridad";

export const AlertaPrioridadsController = {
  async obtener(req: Request, res: Response) {
    try {
      const { colegio_id, ...where } = req.query; 
     
      const alertaPrioridad = await AlertaPrioridadsService.obtener(where );
      res.status(200).json(alertaPrioridad);
    } catch (error) {
      console.error("Error al obtener la alerta prioridad:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  },
  
  async guardar(req: Request, res: Response) {
    try {
      const alertaPrioridad: AlertaPrioridad = req.body;
      const savedAlertaPrioridad = await AlertaPrioridadsService.guardar(alertaPrioridad);
      res.status(201).json(savedAlertaPrioridad);
    } catch (error) {
      console.error("Error al guardar la alerta prioridad:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  },
  
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const alertaPrioridad: AlertaPrioridad = req.body;
      const result = await AlertaPrioridadsService.actualizar(id, alertaPrioridad);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al actualizar la alerta prioridad:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  },
  
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlertaPrioridadsService.eliminar(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al eliminar la alerta prioridad:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  },
};
