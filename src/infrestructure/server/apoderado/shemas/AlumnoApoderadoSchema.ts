import Joi from "joi";

export const AlumnoApoderadoSchema = Joi.object({
  tipo_apoderado: Joi.string().max(20).optional(),
  observaciones: Joi.string().max(200).optional(),
  estado_usuario: Joi.string().max(20).optional(),
  alumno_id: Joi.number().integer().required(),
  apoderado_id: Joi.number().integer().required(),
});