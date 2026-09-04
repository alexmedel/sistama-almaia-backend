import { Request, Response } from "express";
import { AlumnoApoderadoService } from "../AlumnoApoderadoService";
 
export const AlumnoApoderadoController = {
  async obtener(req: Request, res: Response) {
    try {
      const result = await AlumnoApoderadoService.obtenerRelaciones(req.query);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al obtener la relación Alumno-Apoderado:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  guardar: async (req: Request, res: Response) => {
    try {
      const savedRelacion = await AlumnoApoderadoService.guardarRelacion(
        req.body,
        req.creado_por,
        req.actualizado_por
      );
      res.status(201).json(savedRelacion);
    } catch (err: any) {
      console.error("Error al guardar la relación Alumno-Apoderado:", err);
      res.status(500).json({ message: err.message || "Error inesperado" });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlumnoApoderadoService.actualizarRelacion(
        id,
        req.body,
        req.actualizado_por
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al actualizar la relación Alumno-Apoderado:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await AlumnoApoderadoService.eliminarRelacion(id);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error al eliminar la relación Alumno-Apoderado:", error);
      res.status(500).json({ message: error.message || "Error interno del servidor" });
    }
  },
};