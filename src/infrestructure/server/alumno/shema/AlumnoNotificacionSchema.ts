import Joi from "joi";

export const   AlumnoNotificacionSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  tipo: Joi.string().max(20).required(),
  asunto: Joi.string().max(150).required(),
  cuerpo: Joi.string().required(),
  enviada: Joi.boolean().required(),
  fecha_envio: Joi.string().required(),
});