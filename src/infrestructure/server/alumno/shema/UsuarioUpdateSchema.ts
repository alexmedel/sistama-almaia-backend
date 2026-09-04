import Joi from "joi";

export const UsuarioUpdateSchema = Joi.object({
  nombre_social: Joi.string().max(50).allow("", null).optional(),
  email: Joi.string().max(150).optional(),
  encripted_password: Joi.string().max(35).optional(),
  nombres: Joi.string().max(35).optional(),
  apellidos: Joi.string().max(35).optional(),
  fecha_nacimiento: Joi.date().optional(),
  numero_documento: Joi.string().optional(),
  alumno_id: Joi.number().integer().optional(),
  telefono_contacto: Joi.string().max(150).optional(),
  url_foto_perfil: Joi.string().allow("", null).optional(),
  persona_id: Joi.number().integer().optional(),
  idioma_id: Joi.number().integer().optional(),
});
