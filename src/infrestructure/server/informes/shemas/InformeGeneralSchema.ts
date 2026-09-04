import Joi from "joi";

export const InformeGeneralSchema = Joi.object({
  colegio_id: Joi.number().integer().required(),
  tipo: Joi.string().max(50).required(),
  nivel: Joi.string().max(50).required(),
  fecha_generacion: Joi.string().required(),
  url_reporte: Joi.string().max(255).required(),
});