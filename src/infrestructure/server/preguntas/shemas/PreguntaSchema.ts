import Joi from "joi";

export const PreguntaSchema = Joi.object({
  tipo_pregunta_id: Joi.number().integer().required(),
  nivel_educativo_id: Joi.number().integer().required(),
  diagnostico: Joi.string().required(),
  sintomas: Joi.string().max(50).required(),
  grupo_preguntas: Joi.string().max(10).required(),
  palabra_clave: Joi.string().max(10).required(),
  horario: Joi.string().max(10).required(),
  texto_pregunta: Joi.string().required(),
});