import Joi from "joi";

export const EncuestaRespuestaSchema = Joi.object({
  encuesta_id: Joi.number().integer().required(),
  destinatario_id: Joi.number().integer().required(),
  tipo_destinatario_id: Joi.number().integer().required(),

  items: Joi.array()
    .items(
      Joi.object({
        pregunta_encuesta_id: Joi.number().integer().required(),
        tipo_pregunta_id: Joi.number().integer().valid(1, 2, 3, 4).required(),

        // opciones: solo para 1 y 2
        opciones: Joi.array()
          .items(Joi.number().integer())
          .when("tipo_pregunta_id", {
            is: Joi.valid(1, 2),
            then: Joi.required(),
            otherwise: Joi.forbidden()
          }),

        // texto: solo para 3
        texto: Joi.string().when("tipo_pregunta_id", {
          is: 3,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),

        // sociograma: solo para 4
        sociograma: Joi.array()
          .items(
            Joi.object({
              alumno_id_destino: Joi.number().integer().required(),
              label: Joi.string().required()
            })
          )
          .when("tipo_pregunta_id", {
            is: 4,
            then: Joi.required(),
            otherwise: Joi.forbidden()
          }),

        // opcional si front lo envía, no molesta
        alumno_id_origen: Joi.number().integer()
      })
    )
    .min(1)
    .required()
});
