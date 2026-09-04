import Joi from "joi";

export const AlumnoDiarioSchema = Joi.object({
  titulo: Joi.string().max(50).required(),
  descripcion: Joi.string().required(),
  fecha: Joi.string().required(),
  alumno_id: Joi.number().integer().required(),
  sentimiento: Joi.string().max(50),
  imagen: Joi.string().max(255),
});