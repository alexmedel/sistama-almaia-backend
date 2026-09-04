import Joi from "joi";

export const RespuestaSchema = Joi.object({
  tipo_pregunta_id: Joi.number().integer().required(),
  id_registro: Joi.number().integer().required(),
  respuestas_posibles: Joi.array().items(Joi.object<{ respuesta_posible_id: number }>()).min(1).optional(),
  respuesta_posible_id: Joi.number().integer().optional(),
  respuesta_posible_txt: Joi.string().min(1).optional(),
});