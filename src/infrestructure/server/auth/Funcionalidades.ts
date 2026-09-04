import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Funcionalidad } from "../../../core/modelo/auth/Funcionalidad";

const dataService: DataService<Funcionalidad> = new DataService("funcionalidades");
export const FuncionalidadesService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const funcionalidad = await dataService.getAll(["*"], where);
      res.json(funcionalidad);
    } catch (error) {
      console.error("Error al obtener la funcionalidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const funcionalidad: Funcionalidad = req.body;
      const savedfuncionalidad = await dataService.processData(funcionalidad);
      res.status(201).json(savedfuncionalidad);
    } catch (error) {
      console.error("Error al guardar la funcionalidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const funcionalidad: Funcionalidad = req.body;
      await dataService.updateById(id, funcionalidad);
      res.status(200).json({ message: "funcionalidad actualizada correctamente" });
    } catch (error) {
      console.error("Error al actualizar la funcionalidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res.status(200).json({ message: "funcionalidad eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la funcionalidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
