import Joi from "joi";

export const CambiarEstadoSchema = Joi.object({
  tipo_pregunta_id: Joi.number().integer().required(),
  id_registro: Joi.number().integer().required(),
  estado: Joi.boolean().required(),
});