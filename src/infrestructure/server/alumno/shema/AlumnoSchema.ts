import Joi from "joi";

export const AlumnoSchema = Joi.object({
  url_foto_perfil: Joi.string().max(255).optional(),
  telefono_contacto1: Joi.string().max(16).optional(),
  telefono_contacto2: Joi.string().max(16).optional(),
  email: Joi.string().max(45).optional(),
  colegio_id: Joi.number().integer().required(),
});