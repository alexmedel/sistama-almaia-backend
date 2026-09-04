import Joi from "joi";

export const DocenteSchema = Joi.object({
  tipo_documento: Joi.string().max(50).required(),
  numero_documento: Joi.string().max(16).required(),
  nombres: Joi.string().max(50).required(),
  apellidos: Joi.string().max(30).required(),
  genero_id: Joi.number().integer().required(),
  estado_civil_id: Joi.number().integer().required(),
  colegio_id: Joi.number().integer().required(),
  especialidad: Joi.string().max(100).required(),
  estado: Joi.string().max(20).required(),
});