import Joi from "joi";

export const EncuestaUpdateSchema = Joi.object({
  general: Joi.object({
    estado: Joi.number().integer().optional(),
    titulo: Joi.string().min(3).max(250).optional(),
    descripcion: Joi.string().allow(null, "").optional(),
    concepto_id: Joi.number().integer().optional(),
    tipo_id: Joi.number().integer().optional(),
    obligatoria: Joi.boolean().optional(),
  }).optional(),

  programacion: Joi.object({
    fecha_inicio: Joi.string().isoDate().optional(),
    fecha_fin: Joi.string().isoDate().optional(),
    hora_ejecucion: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    frecuencia: Joi.string().valid("diaria", "semanal", "mensual").optional(),
    valores_frecuencia: Joi.array().items(Joi.number().integer()).allow(null).optional(),
  })
    .custom((v, helpers) => {
      if (!v) return v;
      const f = v.frecuencia;
      if (!f) return v; // si no se cambia la frecuencia, no imponemos reglas adicionales
      if (f === "diaria") {
        if (v.valores_frecuencia != null && v.valores_frecuencia.length > 0) {
          return helpers.error("any.custom", { message: "valores_frecuencia debe estar vacío o null para frecuencia diaria" });
        }
      }
      if (f === "semanal") {
        if (!Array.isArray(v.valores_frecuencia) || v.valores_frecuencia.length === 0) {
          return helpers.error("any.custom", { message: "valores_frecuencia requerido (1..7) para frecuencia semanal" });
        }
        const invalid = v.valores_frecuencia.some((n: number) => n < 1 || n > 7);
        if (invalid) return helpers.error("any.custom", { message: "valores_frecuencia debe estar entre 1 y 7 para semanal" });
      }
      if (f === "mensual") {
        if (!Array.isArray(v.valores_frecuencia) || v.valores_frecuencia.length === 0) {
          return helpers.error("any.custom", { message: "valores_frecuencia requerido (1..31) para frecuencia mensual" });
        }
        const invalid = v.valores_frecuencia.some((n: number) => n < 1 || n > 31);
        if (invalid) return helpers.error("any.custom", { message: "valores_frecuencia debe estar entre 1 y 31 para mensual" });
      }
      return v;
    }, "validación programacion update")
    .optional(),

  destinatarios: Joi.object({
    tipo_id: Joi.number().integer().required(),
    objetivo_envio_id: Joi.number().integer().required(),
    destinatarios: Joi.array().items(Joi.number().integer()).min(1).required(),
  }).optional(),

  preguntas: Joi.array().items(
    Joi.object({
      pregunta_encuesta_id: Joi.number().integer().optional(), // si viene, se actualiza; si no, se crea
      titulo: Joi.string().min(1).optional(),
      tipo_id: Joi.number().integer().optional(),
      obligatorio: Joi.boolean().optional(),
      orden: Joi.number().integer().optional(),
      activo: Joi.boolean().optional(),
      posibles_respuestas: Joi.array().items(
        Joi.object({
          titulo: Joi.string().min(1).required(),
          peso: Joi.number().integer().required(),
          orden: Joi.number().integer().optional(),
        })
      ).optional(), // si viene, reemplaza las alternativas existentes
    })
  ).optional(),
}).min(1);
