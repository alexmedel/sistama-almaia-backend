import Joi from "joi";

export const ApoderadoSchema = Joi.object({
  persona_id: Joi.number().integer().required(),
  colegio_id: Joi.number().integer().required(),
  telefono_contacto1: Joi.string().max(15).required(),
  telefono_contacto2: Joi.string().max(15).required(),
  email_contacto1: Joi.string().max(128).required(),
  email_contacto2: Joi.string().max(128).required(),
  estado: Joi.string().max(20).required(),
  profesion_id: Joi.number().integer().optional(),
  tipo_oficio_id: Joi.number().integer().optional(),
});