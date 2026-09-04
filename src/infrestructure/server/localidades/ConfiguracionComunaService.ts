import { Request, Response } from "express";
import { DataService } from "../DataService";
import { ConfiguracionComuna } from "../../../core/modelo/localidades/ConfiguracionComuna";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";

const dataService: DataService<ConfiguracionComuna> = new DataService(
  "configuracioncomunas"
);
export const ConfiguracionComunaService = {
  async obtener(req: Request, res: Response) {
    try {
      const configuraciones_comunas = [
        {
          configuracion_comuna_id: 1,
          nombre: "Comunas Metropolitanas",
        },
      ];
      return FormatResponse(res, 200, configuraciones_comunas);
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const configuracioncomuna: ConfiguracionComuna = req.body;
      const savedconfiguracioncomuna = await dataService.processData(
        configuracioncomuna
      );
      return FormatResponse(res, 201, savedconfiguracioncomuna);
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const configuracioncomuna: ConfiguracionComuna = req.body;
      await dataService.updateById(id, configuracioncomuna);
      return FormatResponse(res, 200, { message: "configuracioncomuna actualizada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, { message: "configuracioncomuna eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.eliminar");
    }
  },
};
