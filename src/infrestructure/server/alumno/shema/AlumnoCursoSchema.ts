import Joi from "joi";

export const AlumnoCursoSchema = Joi.object({
  fecha_egreso: Joi.string().required(),
  fecha_ingreso: Joi.string().required(),
  ano_escolar: Joi.number().integer().required(),
  alumno_id: Joi.number().integer().required(),
  curso_id: Joi.number().integer().required(),
});