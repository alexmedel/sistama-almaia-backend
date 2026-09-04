import Joi from "joi";

export const AlumnoAntecedenteFamiliarSchema = Joi.object({
  alumno_id: Joi.number().integer().required(),
  informacion_socio_economica: Joi.string().max(30).optional(),
  composicion_familiar: Joi.string().max(30).optional(),
  situacion_laboral_padres: Joi.string().max(150).optional(),
  recursos_disponibles: Joi.string().max(50).optional(),
  dinamica_familiar: Joi.string().max(150).optional(),
  relaciones_familiares: Joi.string().max(50).optional(),
  apoyo_emocional: Joi.string().max(150).optional(),
  factores_riesgo: Joi.string().max(50).optional(),
  observaciones_entrevistador: Joi.string().max(150).optional(),
  resumen_entrevista: Joi.string().max(150).optional(),
  impresiones_recomendaciones: Joi.string().max(150).optional(),
  procesos_pisicoteurapeuticos_adicionales: Joi.string().max(150).optional(),
  desarrrollo_social: Joi.string().max(150).optional(),
  fecha_inicio_escolaridad: Joi.string().optional(),
  personas_apoya_aprendzaje_alumno: Joi.string().max(50).optional(),
  higiene_sueno: Joi.string().max(50).optional(),
  uso_plantillas: Joi.string().max(50).optional(),
  otros_antecedentes_relevantes: Joi.string().max(50).optional(),
});