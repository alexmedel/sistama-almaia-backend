import { Request, Response } from "express";
import { MotorPreguntasService } from "../MotorPreguntaService";
 
export const MotorPreguntasController = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query };
      const motorPreguntas = await MotorPreguntasService.obtener(where);
      res.status(200).json(motorPreguntas);
    } catch (error) {
      console.error("Error al obtener el motor de pregunta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedMotorPregunta = await MotorPreguntasService.guardar(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      res.status(201).json(savedMotorPregunta);
    } catch (err: any) {
      console.error("Error al guardar el motor de pregunta:", err);
      res.status(500).json({ message: err.message || "Error inesperado" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await MotorPreguntasService.actualizar(
        id,
        req.body,
        req.actualizado_por
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al actualizar el motor de pregunta:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await MotorPreguntasService.eliminar(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al eliminar el motor de pregunta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async ejecutarMotor(req: Request, res: Response) {
    try {
      const colegioId = parseInt(req.params.colegio_id);
      if (isNaN(colegioId)) {
        res.status(400).json({ message: "ID de colegio no válido." });
        return;
      }
      const result = await MotorPreguntasService.ejecutarMotor(colegioId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al ejecutar el motor de preguntas:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
};