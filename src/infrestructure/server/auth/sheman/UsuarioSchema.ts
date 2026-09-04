import Joi from "joi";

export const UsuarioSchema = Joi.object({
  nombre_social: Joi.string().max(50).required(),
  email: Joi.string().max(150).required(),
  encripted_password: Joi.string().max(35).required(),
  rol_id: Joi.number().integer().required(),
  telefono_contacto: Joi.string().max(150).required(),
  url_foto_perfil: Joi.string().max(255).required(),
  persona_id: Joi.number().integer().required(),
  idioma_id: Joi.number().integer().required(),
}).unknown(true);

export const UsuarioUpdateDataSchema = Joi.object({
  nombre_social: Joi.string().max(50).optional(),
  email: Joi.string().email().max(150).optional(),
  rol_id: Joi.number().integer().optional(),
  telefono_contacto: Joi.string().max(150).optional(),
  url_foto_perfil: Joi.string().max(255).optional().allow(null),
  idioma_id: Joi.number().integer().optional(),
  persona_id: Joi.number().integer().optional(),
  nombres: Joi.string().max(50).optional().allow(null, ''), // <-- Nuevo campo opcional
  apellidos: Joi.string().max(50).optional().allow(null, ''), // <-- Nuevo campo opcional
  fecha_nacimiento: Joi.string().max(50).optional().allow(null, ''), // <-- Nuevo campo opcionals
  numero_documento: Joi.string().max(20).optional().allow(null, ''), // <-- Nuevo campo opcionals
}).min(1).unknown(false);  // Al menos un campo debe ser enviado