import e, { Request, Response } from "express";
import { DataService } from "../DataService";
import { Pais } from "../../../core/modelo/localidades/Pais";
 
import { PaisSchema } from "./sheman/PaisSchema";
import { FormatResponse } from "../../../helpers/Response";
import { errorHandler } from "../../../helpers/ErrorResponse";

const dataService: DataService<Pais> = new DataService("paises");
 

export const PaisService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query };
      const pais = await dataService.getAll(["*"], where);
      return FormatResponse(res, 200, pais);
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.obtener");
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const pais: Pais = new Pais();
      Object.assign(pais, req.body); 
      pais.creado_por = req.creado_por; 
      let responseSent = false; 
      const { error: validationError } = PaisSchema.validate(req.body);
      if (validationError) {
        res.status(400).json({ error: validationError.details[0].message });
        responseSent = true;
      }
      if (!responseSent) {
        const savedpais = await dataService.processData(pais);
       return FormatResponse(res, 201, savedpais);
      }
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.guardar");
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const pais: Pais = req.body;
      await dataService.updateById(id, pais);
      return FormatResponse(res, 200, { message: "pais actualizada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.actualizar");
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      return FormatResponse(res, 200, { message: "pais eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(error, res, "PaisService.eliminar");
    }
  },
};
