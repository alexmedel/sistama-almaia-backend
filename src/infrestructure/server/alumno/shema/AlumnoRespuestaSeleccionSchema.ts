import Joi from "joi";

export const   AlumnoRespuestaSeleccionSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  pregunta_id: Joi.number().integer().required(),
  respuesta_posiblle_id: Joi.number().integer().required(),
});