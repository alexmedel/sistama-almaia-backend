import Joi from "joi";

export const AlumnoPermisoAutorSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  apoderado_id: Joi.number().integer().required(),
  tipo: Joi.string().max(50).required(),
  descripcion: Joi.string().required(),
  fecha_solicitud: Joi.string().optional(),
  fecha_autorizacion: Joi.string().optional(),
  estado: Joi.string().max(20).required(),
});