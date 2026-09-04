import { Request, Response } from "express";
import { DataService } from "../DataService";
import { Comuna } from "../../../core/modelo/localidades/Comuna";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";

const dataService: DataService<Comuna> = new DataService("comunas");
export const ComunaService = {
  async obtener(req: Request, res: Response) {
    try {

     const comunas = [
        {
          "comuna_id": 23,
          "nombre": "Viña del Mar",
          "region_id": 5,
          "pais_id": 1
        }
      ]
      res.json(comunas);
    } catch (error) {
      console.error("Error al obtener la comuna:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const comuna: Comuna = req.body;
      const savedcomuna = await dataService.processData(comuna);
      return FormatResponse(res, 201, savedcomuna);
    } catch (error) {
      errorHandler.handleError(error, res, "ComunaService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const comuna: Comuna = req.body;
      await dataService.updateById(id, comuna);
      return FormatResponse(res, 200, { message: "comuna actualizada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "ComunaService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, { message: "comuna eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "ComunaService.eliminar");
    }
  },
};
