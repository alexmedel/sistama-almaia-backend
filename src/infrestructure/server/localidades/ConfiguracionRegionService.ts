import { Request, Response } from "express";
import { DataService } from "../DataService";
import { ConfiguracionRegion } from "../../../core/modelo/localidades/ConfiguracionRegion";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";

const dataService: DataService<ConfiguracionRegion> = new DataService("configuracionregions");
export const ConfiguracionRegionService = {
  async obtener(req: Request, res: Response) {
    try {
      const configuracionesregiones = [
        {
          "configuracion_region_id": 1,
          "nombre": "Regiones Zona Norte"
        }
      ]
      return FormatResponse(res, 200, configuracionesregiones);
    } catch (error) {
       errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const configuracionregion: ConfiguracionRegion = req.body;
      const savedconfiguracionregion = await dataService.processData(configuracionregion);
      return FormatResponse(res, 201, savedconfiguracionregion);
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const configuracionregion: ConfiguracionRegion = req.body;
      await dataService.updateById(id, configuracionregion);
      return FormatResponse(res, 200, { message: "configuracionregion actualizada correctamente" });
    } catch (error) {
     errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, { message: "configuracionregion eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
};
