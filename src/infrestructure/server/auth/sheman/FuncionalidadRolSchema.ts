import Joi from "joi";

export const FuncionalidadRolSchema = Joi.object({
  id_rol: Joi.number().integer().required(),
  id_funcionalidad: Joi.number().integer().required(),
});