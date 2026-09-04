import Joi from "joi";

export const AvisoSchema = Joi.object({
  docente_id: Joi.number().integer().positive().required().messages({
    "number.base": "El ID del docente debe ser un número",
    "number.integer": "El ID del docente debe ser un número entero",
    "number.positive": "El ID del docente debe ser positivo",
    "any.required": "El ID del docente es requerido",
  }),
  mensaje: Joi.string().min(1).max(1000).required().messages({
    "string.empty": "El mensaje no puede estar vacío",
    "string.max": "El mensaje no puede exceder los 1000 caracteres",
    "any.required": "El mensaje es requerido",
  }),
  dirigido: Joi.string()
    .valid("estudiantes", "padres", "general")
    .required()
    .messages({
      "any.only": "El campo dirigido debe ser: estudiantes, padres o general",
      "any.required": "El campo dirigido es requerido",
    }),
  fecha_programada: Joi.date().iso().min("now").required().messages({
    "date.base": "La fecha debe ser válida",
    "date.format": "La fecha debe estar en formato ISO",
    "date.min": "La fecha no puede ser en el pasado",
    "any.required": "La fecha programada es requerida",
  }),
  estado: Joi.string()
    .valid("activo", "inactivo", "programado")
    .max(20)
    .required()
    .messages({
      "any.only": "El estado debe ser: activo, inactivo o programado",
      "any.required": "El estado es requerido",
    }),
});

export const QuerySchema = Joi.object({
  colegio_id: Joi.number().integer().positive(),
  docente_id: Joi.number().integer().positive(),
  estado: Joi.string().max(20),
  dirigido: Joi.string().max(50),
});