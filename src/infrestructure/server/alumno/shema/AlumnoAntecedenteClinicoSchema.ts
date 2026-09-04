import Joi from "joi";

export const AlumnoAntecedenteClinicoSchema = {
    alumno_id: Joi.number().integer().required(),
    historial_medico: Joi.string().max(150).required(),
    alergias: Joi.string().max(150).required(),
    enfermedades_cronicas: Joi.string().max(150).required(),
    condiciones_medicas_relevantes: Joi.string().max(150).required(),
    medicamentos_actuales: Joi.string().max(150).required(),
    diagnosticos_previos: Joi.string().max(150).required(),
    terapias_tratamiento_curso: Joi.string().max(150).required(),
};