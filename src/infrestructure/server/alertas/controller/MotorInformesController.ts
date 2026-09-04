import { Request, Response } from "express";
import { MotorInformesService } from "../MotorInformeService";
 
export const MotorInformesController = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query };
      const motoresInforme = await MotorInformesService.obtener(where);
      res.status(200).json(motoresInforme);
    } catch (error) {
      console.error("Error al obtener el motor de informe:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedMotorInforme = await MotorInformesService.guardar(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      res.status(201).json(savedMotorInforme);
    } catch (err: any) {
      console.error("Error al guardar el motor de informe:", err);
      res.status(500).json({ message: err.message || "Error inesperado" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await MotorInformesService.actualizar(
        id,
        req.body,
        req.actualizado_por
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al actualizar el motor de informe:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await MotorInformesService.eliminar(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al eliminar el motor de informe:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};