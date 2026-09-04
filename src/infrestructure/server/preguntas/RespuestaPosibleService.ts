import { Request, Response } from "express";
import { DataService } from "../DataService";
import { RespuestaPosible } from "../../../core/modelo/preguntasRespuestas/RespuestaPosible";
import Joi from "joi";

const dataService: DataService<RespuestaPosible> = new DataService(
  "respuestas_posibles", "respuesta_posible_id"
);
const RespuestaPosibleSchema = Joi.object({
  nombre: Joi.string().max(50).required(),
});
export const RespuestaPosibleService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const respuestas = await dataService.getAll(["*"], where);
      res.json(respuestas);
    } catch (error) {
      console.error("Error al obtener la respuestaposible:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const respuestaposible: RespuestaPosible = new RespuestaPosible();
      Object.assign(respuestaposible, req.body);
      respuestaposible.creado_por = req.creado_por;
      respuestaposible.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = RespuestaPosibleSchema.validate(
        req.body
      );
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedRespuestaPosible = await dataService.processData(
          respuestaposible
        );
        res.status(201).json(savedRespuestaPosible);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error al guardar el respuestaposible:", error);
      res.status(500).json({ message: error.message || "Error inesperado" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const respuestaposible: RespuestaPosible = new RespuestaPosible();
      Object.assign(respuestaposible, req.body);
      respuestaposible.creado_por = req.creado_por;
      respuestaposible.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = RespuestaPosibleSchema.validate(
        req.body
      );
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, respuestaposible);
        res
          .status(200)
          .json({ message: "RespuestaPosible actualizada correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar la respuestaposible:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res
        .status(200)
        .json({ message: "RespuestaPosible eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la respuestaposible:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
