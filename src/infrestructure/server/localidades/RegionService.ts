import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Region } from "../../../core/modelo/localidades/Region";

const dataService: DataService<Region> = new DataService("regions");
export const RegionService = {
  async obtener(req: Request, res: Response) {
    try {

      const regiones = [
        {
          "region_id": 1,
          "nombre": "Regiones Zona Norte"
        }
      ]
      res.json(regiones);
    } catch (error) {
      console.error("Error al obtener la region:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const region: Region = req.body;
      const savedregion = await dataService.processData(region);
      res.status(201).json(savedregion);
    } catch (error) {
      console.error("Error al guardar la region:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const region: Region = req.body;
      await dataService.updateById(id, region);
      res.status(200).json({ message: "region actualizada correctamente" });
    } catch (error) {
      console.error("Error al actualizar la region:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res.status(200).json({ message: "region eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la region:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
