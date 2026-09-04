import Joi from "joi";

export const PaisSchema = Joi.object({
  nombre: Joi.string().max(50).required(),
});