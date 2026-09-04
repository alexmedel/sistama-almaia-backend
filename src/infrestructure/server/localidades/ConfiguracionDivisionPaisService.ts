import { Request, Response } from "express";
import { DataService } from "../DataService";
import { ConfiguracionDivisionPais } from "../../../core/modelo/localidades/ConfiguracionDivisionPais";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";

const dataService: DataService<ConfiguracionDivisionPais> = new DataService("configuraciondivisionpaiss");
export const ConfiguracionDivisionPaisService = {
  async obtener(req: Request, res: Response) {
    try {

      const configuracionesDivisionesPais = [
        {
          configuracion_division_pais_id: 1,
          pais: {
            nombre: "Chile"
          },
          configuracion_region: {
            configuracion_region_id: 1,
            nombre: "Región Metropolitana"
          },
          configuracion_comuna: {
            configuracion_comuna_id: 1,
            nombre: "Santiago"
          }
        }
      ];
       return FormatResponse(res, 200, configuracionesDivisionesPais);
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const configuraciondivisionpais: ConfiguracionDivisionPais = req.body;
      const savedconfiguraciondivisionpais = await dataService.processData(configuraciondivisionpais);
      res.status(201).json(savedconfiguraciondivisionpais);
      return FormatResponse(res, 201, savedconfiguraciondivisionpais);
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const configuraciondivisionpais: ConfiguracionDivisionPais = req.body;
      await dataService.updateById(id, configuraciondivisionpais);
      return FormatResponse(res, 200, { message: "configuraciondivisionpais actualizada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, { message: "configuraciondivisionpais eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.eliminar");
    }
  },
};
