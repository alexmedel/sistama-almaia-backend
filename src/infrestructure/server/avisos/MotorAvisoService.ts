import { Request, Response } from "express";
import { DataService } from "../DataService";
import { MotorAviso } from "../../../core/modelo/aviso/MotorAviso";
import Joi from "joi";

const dataService: DataService<MotorAviso> = new DataService(
  "motores_avisos",
  "motor_aviso_id"
);
const MotorAvisoSchema = Joi.object({
  intervalo_min: Joi.number().integer().required(),
});
export const MotorAvisoService = {
  async obtener(req: Request, res: Response) {
    try {
      const where = { ...req.query }; // Convertir los parámetros de consulta en filtros
      const motores_avisos = await dataService.getAll(["*"], where);
      res.json(motores_avisos);
    } catch (error) {
      console.error("Error al obtener la motoraviso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  guardar: async (req: Request, res: Response) => {
    try {
      const motoraviso: MotorAviso = new MotorAviso();
      Object.assign(motoraviso, req.body);
      motoraviso.creado_por = req.creado_por;
      motoraviso.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = MotorAvisoSchema.validate(req.body);
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        const savedMotorAviso = await dataService.processData(motoraviso);
        res.status(201).json(savedMotorAviso);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error al guardar el motoraviso:", error);
      res.status(500).json({ message: error.message || "Error inesperado" });
    }
  },
  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const motoraviso: MotorAviso = new MotorAviso();
      Object.assign(motoraviso, req.body);
      motoraviso.creado_por = req.creado_por;
      motoraviso.actualizado_por = req.actualizado_por;
      let responseSent = false;
      const { error: validationError } = MotorAvisoSchema.validate(req.body);
      if (validationError) {
        responseSent = true;
        throw new Error(validationError.details[0].message);
      }
      if (!responseSent) {
        await dataService.updateById(id, motoraviso);
        res
          .status(200)
          .json({ message: "motoraviso actualizada correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar la motoraviso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dataService.deleteById(id);
      res.status(200).json({ message: "motoraviso eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la motoraviso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
