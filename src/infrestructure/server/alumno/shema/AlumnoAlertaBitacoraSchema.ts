import Joi from "joi";

export const AlumnoAlertaBitacoraSchema = Joi.object({
  alumno_alerta_id: Joi.number().integer().required(),
  alumno_id: Joi.number().integer().required(),
  plan_accion: Joi.string().required(),
  fecha_compromiso: Joi.string().required(),
  nuevo_estado: Joi.string().optional(),
  nuevo_responsable: Joi.number().optional(),
  fecha_realizacion: Joi.string().optional(),
  alerta_prioridad_id:Joi.number().optional(),
  alerta_severidad_id:Joi.number().optional(),
  responsable_id:Joi.number().optional(),
  url_archivo: Joi.string().optional(),
});