import Joi from "joi";

export const PersonaContactoSchema = Joi.object({
  telefono_contacto: Joi.string().max(16).optional(),
  direcccion: Joi.string().max(100).required(),
  persona_id: Joi.number().integer().required(),
});