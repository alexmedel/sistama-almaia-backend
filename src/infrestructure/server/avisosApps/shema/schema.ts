import Joi from "joi";

export const AvisoCrearSchema = Joi.object({
  titulo: Joi.string().max(255).required(),
  descripcion: Joi.string().required(),
  palabras_claves: Joi.string().required(), 
  fecha_programacion: Joi.date().iso().required(),
  aviso_tipo_id: Joi.number().integer().required(),
  aviso_destinatario_tipo: Joi.string().max(50).required(),
  destinario: Joi.string().allow("").optional(), 
});