import Joi from "joi";

export  const AlumnoMonitoreoSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  fecha_accion: Joi.string().required(),
  tipo_accion: Joi.string().max(15).optional(),
  descripcion_accion: Joi.string().max(50).optional(),
});