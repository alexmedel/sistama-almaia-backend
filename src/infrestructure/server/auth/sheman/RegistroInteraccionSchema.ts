import Joi from "joi";

 

export const RegistroInteraccionSchema = Joi.object({
  timestamp: Joi.string().max(50).required(),
  tipo_evento: Joi.string().max(50).required(),
  datos_evento: Joi.string().required(),
  sesion_id: Joi.number().integer().required(),
});