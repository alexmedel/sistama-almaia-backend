import Joi from "joi";

export const passwordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required(),
  pass: Joi.string().min(6).required(),
});
export const passwordSchemaAlumno = Joi.object({
  alumno_id: Joi.number().required(),
  newPassword: Joi.string().min(6).required(),
});
