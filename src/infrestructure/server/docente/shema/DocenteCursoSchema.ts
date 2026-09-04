import Joi from "joi";

export const DocenteCursoSchema = Joi.object({
  docente_id: Joi.number().integer().required(),
  curso_id: Joi.number().integer().required(),
  ano_escolar: Joi.number().integer().required(),
});