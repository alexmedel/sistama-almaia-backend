import Joi from "joi";

export const RolSchema = Joi.object({
  nombre: Joi.string().max(50).required(),
  descripcion: Joi.string().max(50).required(),
});