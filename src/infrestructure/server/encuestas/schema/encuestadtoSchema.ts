import Joi from "joi";

export const EncuestaSchema = Joi.object({
  general: Joi.object({
    estado: Joi.number().integer().required(),
    titulo: Joi.string().min(3).max(250).required(),
    descripcion: Joi.string().allow(null, "").optional(),
    concepto_id: Joi.number().integer().required(),
    tipo_id: Joi.number().integer().required(),
    obligatoria: Joi.boolean().default(false),
  }).required(),

  preguntas: Joi.array()
    .items(
      Joi.object({
        titulo: Joi.string().min(1).required(),
        tipo_id: Joi.number().integer().required(),
        posibles_respuestas: Joi.array()
          .items(
            Joi.object({
              titulo: Joi.string().min(1).required(),
              peso: Joi.number().integer().default(0),
            })
          )
          .default([]),
      })
    )
    .default([]),

  destinatarios: Joi.object({
    tipo_id: Joi.number().integer().required(),
    destinatario_tipo: Joi.string().required(),
    objetivo_envio_id: Joi.number().integer().required(),
    destinatarios: Joi.array().items(Joi.number()).default([]),
  }).required(),

  programacion: Joi.object({
    fecha_inicio: Joi.string().isoDate().required(),
    fecha_fin: Joi.string().isoDate().required(),
    hora_ejecucion: Joi.string()
      .pattern(/^\d{2}:\d{2}(:\d{2})?$/)
      .required(),
    frecuencia: Joi.string()
      .valid("diaria", "semanal", "mensual")
      .required(),
    valores_frecuencia: Joi.array().items(Joi.number().integer()).allow(null).optional(),
  })
    .custom((v, helpers) => {
      const f = v.frecuencia;
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
    }, "validación de días por frecuencia")
    .required(),
});
