import e, { Request, Response } from "express";
import { DataService } from "../DataService";
import Joi from "joi";
import { RegistroInteraccion } from "../../../core/modelo/RegistroInteraccion";
import { errorHandler } from "../../../helpers/ErrorResponse";
import { FormatResponse } from "../../../helpers/Response";
import { STATUS_CODES } from "../../../core/interface/reponse";
import { RegistroInteraccionSchema } from "./sheman/RegistroInteraccionSchema";

const dataService: DataService<RegistroInteraccion> = new DataService(
  "registros_interacciones",
  "registro_interaccion_id"
);
export const RegistroInteraccionesService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const registrointeraccion = await dataService.getAll(["*"], where);
      return FormatResponse(res, STATUS_CODES.OK, registrointeraccion);
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "RegistroInteraccionesService.obtener"
      );
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const registrointeraccion: RegistroInteraccion =
        new RegistroInteraccion();
      registrointeraccion.creado_por = req.creado_por;
      Object.assign(registrointeraccion, req.body);
      let responseSent = false;
      const { error: validationError } = RegistroInteraccionSchema.validate(
        req.body
      );
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedregistrointeraccion = await dataService.processData(
          registrointeraccion
        );
        res.status(201).json(savedregistrointeraccion);
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "RegistroInteraccionesService.guardar"
      );
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const registrointeraccion: RegistroInteraccion =
        new RegistroInteraccion();
      Object.assign(registrointeraccion, req.body);
      let responseSent = false;
      const { error: validationError } = RegistroInteraccionSchema.validate(
        req.body
      );
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, registrointeraccion);
        res
          .status(200)
          .json({ message: "registrointeraccion actualizada correctamente" });
      }
    } catch (error) {
        errorHandler.handleError(
          error,
          res,
          "RegistroInteraccionesService.actualizar"
        );
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "registrointeraccion eliminada correctamente" });
    } catch (error) {
      errorHandler.handleError(
        error,
        res,
        "RegistroInteraccionesService.eliminar"
      );
    }
  },
};
