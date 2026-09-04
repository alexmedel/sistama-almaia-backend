import Joi from "joi";

export const   AlumnoInformeSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  fecha: Joi.string().required(),
  url_reporte: Joi.string().max(255).required(),
});