 
import { DataService } from "../DataService";
import { SupabaseAdminService } from "../../../core/services/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import { ApoderadoRespuesta } from "../../../core/modelo/apoderado/ApoderadoRespuesta";
import { distinctPorCampo } from "../../../helpers/objectformat";
import { ApoderadoRespuestaSchema } from "./shemas/ApoderadoRespuestaSchema";
import { RespuestaSchema } from "./shemas/RespuestaSchema";

const supabaseService = new SupabaseAdminService();
const client: SupabaseClient = supabaseService.getClient();
const dataService: DataService<ApoderadoRespuesta> = new DataService(
  "apoderados_respuestas",
  "apoderado_respuesta_id"
);

export const ApoderadoRespuestaService = {
  async obtenerRespuestas(queryParams: any) {
    const { respondio = false, fecha, ...where } = queryParams;

    let query = client
      .from("apoderados_respuestas")
      .select(
        [
          "*",
          "alumnos(alumno_id,url_foto_perfil,personas(persona_id,nombres,apellidos),colegios(colegio_id,nombre,nombre_fantasia,tipo_colegio))",
          "preguntas(pregunta_id,texto_pregunta,horario,grupo_preguntas,tipo_pregunta_id,template_code,respuestas_posibles(respuesta_posible_id,nombre))",
          "apoderados(apoderado_id,personas(persona_id,nombres,apellidos),telefono_contacto1,telefono_contacto2,email_contacto1,email_contacto2)",
          "respuestas_posibles(respuesta_posible_id,nombre)",
        ].join(",")
      )
      .eq("activo", true)
      .eq("respondio", respondio)
      // .gte('fecha_creacion::date', fecha) // Comentado según el código original
      .order("fecha_creacion", { ascending: true });

    Object.keys(where).forEach((key) => {
      query = query.eq(key, where[key]);
    });

    const { data, error } = await query.returns<any[]>();

    if (error) {
      throw error;
    }

    return data;
  },

  async guardarRespuesta(respuestaData: any, creado_por: number, actualizado_por: number) {
    const { error: validationError } = ApoderadoRespuestaSchema.validate(respuestaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const { data: apoderadoData, error: apoderadoError } = await client
      .from("apoderados")
      .select("*")
      .eq("apoderado_id", respuestaData.apoderado_id)
      .single();
    if (apoderadoError || !apoderadoData) {
      throw new Error("El apoderado no existe");
    }
    const { data: alumnoData, error: alumnoError } = await client
      .from("alumnos")
      .select("*")
      .eq("alumno_id", respuestaData.alumno_id)
      .single();
    if (alumnoError || !alumnoData) {
      throw new Error("El Alumno no existe");
    }
    const { data: preguntaData, error: preguntaError } = await client
      .from("preguntas")
      .select("*")
      .eq("pregunta_id", respuestaData.pregunta_id)
      .single();
    if (preguntaError || !preguntaData) {
      throw new Error("La pregunta no existe");
    }

    const apoderadorespuesta: ApoderadoRespuesta = new ApoderadoRespuesta();
    Object.assign(apoderadorespuesta, respuestaData);
    apoderadorespuesta.creado_por = creado_por;
    apoderadorespuesta.actualizado_por = actualizado_por;

    return await dataService.processData(apoderadorespuesta);
  },

  async actualizarRespuesta(id: number, respuestaData: any, actualizado_por: number) {
    const { error: validationError } = ApoderadoRespuestaSchema.validate(respuestaData);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }
    const { data: apoderadoData, error: apoderadoError } = await client
      .from("apoderados")
      .select("*")
      .eq("apoderado_id", respuestaData.apoderado_id)
      .single();
    if (apoderadoError || !apoderadoData) {
      throw new Error("El apoderado no existe");
    }
    const { data: alumnoData, error: alumnoError } = await client
      .from("alumnos")
      .select("*")
      .eq("alumno_id", respuestaData.alumno_id)
      .single();
    if (alumnoError || !alumnoData) {
      throw new Error("El Alumno no existe");
    }
    const { data: preguntaData, error: preguntaError } = await client
      .from("preguntas")
      .select("*")
      .eq("pregunta_id", respuestaData.pregunta_id)
      .single();
    if (preguntaError || !preguntaData) {
      throw new Error("La pregunta no existe");
    }

    const apoderadorespuesta: ApoderadoRespuesta = new ApoderadoRespuesta();
    Object.assign(apoderadorespuesta, respuestaData);
    apoderadorespuesta.actualizado_por = actualizado_por;

    await dataService.updateById(id, apoderadorespuesta);
    return { message: "ApoderadoRespuesta actualizado correctamente" };
  },

  async eliminarRespuesta(id: number) {
    await dataService.deleteById(id);
    return { message: "ApoderadoRespuesta eliminada correctamente" };
  },

  async responderPregunta(
    respuestaData: any,
    actualizado_por: number,
    fecha_creacion: string
  ) {
    const {
      respuesta_posible_id,
      tipo_pregunta_id,
      respuestas_posibles,
      respuesta_posible_txt,
      id_registro,
    } = respuestaData;

    const { error: validationError } = RespuestaSchema.validate(respuestaData, { abortEarly: false });
    if (validationError) {
      throw new Error(validationError.details.map(d => d.message).join(", "));
    }

    if (tipo_pregunta_id === 3) {
      if (!id_registro) throw new Error("Falta el ID del registro.");
      if (!respuesta_posible_txt) throw new Error("Falta el texto de la respuesta.");

      const { error } = await client
        .from("apoderados_respuestas")
        .update({
          respuesta_txt: respuesta_posible_txt,
          respondio: true,
          actualizado_por: actualizado_por,
          fecha_actualizacion: fecha_creacion || new Date(),
          activo: true,
        })
        .match({ apoderado_respuesta_id: id_registro });

      if (error) throw new Error(error.message);

      return { message: "Respuesta actualizada correctamente." };
    } else {
      const { data: rowOriginal, error: errorSelect } = await client
        .from("apoderados_respuestas")
        .select("*")
        .match({ apoderado_respuesta_id: id_registro })
        .single();

      if (errorSelect) throw new Error(errorSelect.message);
      if (!rowOriginal) throw new Error("Registro no encontrado.");
      if (rowOriginal.respuesta_posible_id && tipo_pregunta_id === 1) {
        throw new Error("La respuesta ya ha sido respondida.");
      }

      switch (tipo_pregunta_id) {
        case 1: // Selección única
          if (!respuesta_posible_id) throw new Error("Falta el ID de la respuesta posible.");
          if (!id_registro) throw new Error("Falta el ID del registro.");
          
          const { error: updateError } = await client
            .from("apoderados_respuestas")
            .update({
              respuesta_posible_id: respuesta_posible_id,
              respondio: true,
              actualizado_por: actualizado_por,
              fecha_actualizacion: fecha_creacion || new Date(),
              activo: true,
            })
            .match({ apoderado_respuesta_id: id_registro });

          if (updateError) throw new Error(updateError.message);
          return { message: "Respuesta actualizada correctamente." };

        case 2: // Selección múltiple
          if (!Array.isArray(respuestas_posibles) || respuestas_posibles.length === 0) {
            throw new Error("Faltan respuestas posibles.");
          }
          if (!id_registro) throw new Error("Falta el ID del registro.");

          const filterdata = distinctPorCampo(respuestas_posibles, 'respuesta_posible_id');
          
          await Promise.all(filterdata.map(async (respuesta: any, index: number) => {
            if (index === 0) {
              const { error } = await client
                .from("apoderados_respuestas")
                .update({
                  respuesta_posible_id: respuesta.respuesta_posible_id,
                  respondio: true,
                  actualizado_por: actualizado_por,
                  fecha_actualizacion: fecha_creacion || new Date(),
                  activo: true,
                })
                .match({ apoderado_respuesta_id: id_registro });
              if (error) throw new Error(error.message);
            } else {
              const { error } = await client.from("apoderados_respuestas").insert({
                alumno_id: rowOriginal.alumno_id,
                apoderado_id: rowOriginal.apoderado_id,
                pregunta_id: rowOriginal.pregunta_id,
                respondio: true,
                respuesta_posible_id: respuesta.respuesta_posible_id,
                creado_por: actualizado_por,
                actualizado_por: actualizado_por,
                fecha_creacion: rowOriginal.fecha_creacion,
                fecha_actualizacion: fecha_creacion || new Date(),
                activo: true,
              });
              if (error) throw new Error(error.message);
            }
          }));
          return { message: "Respuestas actualizadas correctamente." };

        default:
          throw new Error("Tipo de pregunta no soportado para esta operación.");
      }
    }
  },
};