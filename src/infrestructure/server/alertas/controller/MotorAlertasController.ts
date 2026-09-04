import { Request, Response } from "express";
import { MotorAlertasService } from "../MotorAlertaService";
 
export const MotorAlertasController = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query };
      const motoresAlerta = await MotorAlertasService.obtener(where);
      res.status(200).json(motoresAlerta);
    } catch (error) {
      console.error("Error al obtener el motor de alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedMotorAlerta = await MotorAlertasService.guardar(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      res.status(201).json(savedMotorAlerta);
    } catch (err: any) {
      console.error("Error al guardar el motor de alerta:", err);
      res.status(500).json({ message: err.message || "Error inesperado" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await MotorAlertasService.actualizar(
        id,
        req.body,
        req.actualizado_por
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al actualizar el motor de alerta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await MotorAlertasService.eliminar(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al eliminar el motor de alerta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async ejecutarMotor(req: Request, res: Response) {
    try {
      const result = await MotorAlertasService.ejecutarMotor();
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al ejecutar el motor de alerta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
};