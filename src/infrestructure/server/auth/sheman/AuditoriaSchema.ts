import Joi from "joi";

export const AuditoriaSchema = Joi.object({
  tipo_auditoria_id: Joi.number().integer().required(),
  colegio_id: Joi.number().integer().required(),
  fecha: Joi.string().required(),
  usuario_id: Joi.number().integer().required(),
  descripcion: Joi.string().max(150).required(),
  modulo_afectado: Joi.string().max(50).required(),
  accion_realizada: Joi.string().max(50).required(),
  ip_origen: Joi.string().ip().required(),
  referencia_id: Joi.number().integer().required(),
  model: Joi.string().max(45).required(),
});