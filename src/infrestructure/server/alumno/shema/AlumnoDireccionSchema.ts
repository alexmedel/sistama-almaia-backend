import Joi from "joi";

export const AlumnoDireccionSchema = Joi.object({
  descripcion: Joi.string().max(50).required(),
  alumno_id: Joi.number().integer().required(),
  comuna_id: Joi.number().integer().required(),
  pais_id: Joi.number().integer().required(),
  region_id: Joi.number().integer().required(),
});