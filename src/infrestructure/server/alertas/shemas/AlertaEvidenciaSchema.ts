import Joi from "joi";

export const AlertaEvidenciaSchema = Joi.object({
  alumno_alerta_id: Joi.number().integer().required(),
  url_evidencia: Joi.string().max(255).required(),
});
