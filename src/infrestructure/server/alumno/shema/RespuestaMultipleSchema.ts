import Joi from "joi";

export const RespuestaMultipleSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  pregunta_id: Joi.number().integer().required(),
  respuestas_posibles: Joi.array().items(Joi.number().integer()).min(1).required(),
});