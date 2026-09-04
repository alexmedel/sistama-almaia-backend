import Joi from "joi";

export const ApoderadoRespuestaSchema = Joi.object({
  pregunta_id: Joi.number().integer().required(),
  respuesta_posible_id: Joi.number().integer().optional(),
  apoderado_id: Joi.number().integer().required(),
  alumno_id: Joi.number().integer().required(),
  texto_respuesta: Joi.string().max(50).optional(),
  estado_respuesta: Joi.string().max(20).required(),
});