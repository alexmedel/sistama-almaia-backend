import Joi from "joi";

export const AlumnoAlertaSchema = Joi.object({
  alumno_id: Joi.number().integer().allow(null).optional(),
  alerta_regla_id: Joi.number().integer().optional(),
  mensaje: Joi.string().max(100).required(),
  fecha_generada: Joi.string(),
  fecha_resolucion: Joi.string().optional(),
  alerta_origen_id: Joi.number().integer().required(),
  prioridad_id: Joi.number().integer().required(),
  severidad_id: Joi.number().integer().required(),
  accion_tomada: Joi.string().max(200).optional(),
  leida: Joi.boolean().required(),
  estado: Joi.string().max(20).required(),
  anonimo: Joi.boolean().optional(),
  responsable_actual_id: Joi.number().integer().optional(),
  alertas_tipo_alerta_tipo_id: Joi.number().integer().required(),
});

export const AlumnoAlertaUpdateSchema = Joi.object({
  alumno_id: Joi.number().integer().optional(),
  alerta_regla_id: Joi.number().integer().optional(),
  mensaje: Joi.string().max(100).optional(),
  fecha_resolucion: Joi.string().optional(),
  prioridad_id: Joi.number().integer().required(),
  severidad_id: Joi.number().integer().required(),
  responsable_actual_id: Joi.number().integer().required(),
  accion_tomada: Joi.string().max(200).optional().allow(null),
  leida: Joi.boolean().default(true).required(),
  estado: Joi.string().max(20).required(),
  // alertas_tipo_alerta_tipo_id: Joi.number().integer().optional(),
  anonimo: Joi.boolean().optional(),
});