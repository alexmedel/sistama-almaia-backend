import { SupabaseClientService } from "../supabaseClient";

const supabaseService = new SupabaseClientService();
const client = supabaseService.getClient();
export class EvalucionAsistidaService {
  async catalogos(escuela_id: number) {
    try {
      const { data: cursisData } = await client
        .from("cursos")
        .select("*")
        .eq("colegio_id", escuela_id);
      const { data, error } = await client.from("eventos_preguntas").select(
        `
            id,
            evento, 
            pregunta, 
            evento_respuestas_posibles(id,respuesta_texto) 
        `
      );
      return {
        preguntas: data,
        cursos: cursisData,
      };
    } catch (err) {
      console.error("Error al obtener encuestas:", err);
      throw err;
    }
  }

  async evaluacionAsistida(
    curso_id?: number,
    eventos_preguntas_id?: number,
    fecha_encuetada?: string
  ) {
    try {
      // 1. Validaciones iniciales
      if (!curso_id || !eventos_preguntas_id || !fecha_encuetada) {
        throw new Error(
          "Parámetros requeridos: curso_id, eventos_preguntas_id, fecha_encuetada"
        );
      }

      // 2. Determinar si la fecha es pasada
      const today = new Date().toISOString().slice(0, 10);
      const esFechaPasada = fecha_encuetada < today;

      // 3. Consultar pregunta y alumnos en paralelo
      const [preguntaResult, alumnosResult] = await Promise.all([
        this.obtenerPregunta(eventos_preguntas_id),
        this.obtenerAlumnosEncuestados(curso_id, fecha_encuetada),
      ]);

      // 4. Construir respuesta base
      const resultado = {
        pregunta: preguntaResult.data,
        alumnosEncuestados: alumnosResult.data,
        respuestas: null as any,
      };

      // 5. Si es fecha pasada, obtener respuestas
      if (esFechaPasada) {
        const respuestasResult = await this.obtenerRespuestas(
          curso_id,
          eventos_preguntas_id,
          fecha_encuetada
        );
        resultado.respuestas = respuestasResult.data;
      }

      return resultado;
    } catch (err) {
      console.error("Error al obtener encuestas:", err);
      throw err;
    }
  }

  private async obtenerPregunta(eventos_preguntas_id: number) {
    const { data, error } = await client
      .from("eventos_preguntas")
      .select(
        `
      *,
      evento_respuestas_posibles(
        id,
        respuesta_texto
      )
    `
      )
      .eq("id", eventos_preguntas_id);

    if (error) {
      throw new Error(`Error al obtener pregunta: ${error.message}`);
    }

    return { data };
  }

  private async obtenerAlumnosEncuestados(
    curso_id: number,
    fecha_encuetada: string
  ) {
    const { data, error } = await client
      .from("alumnos_cursos")
      .select(
        `
      alumnos (
        email,
        alumno_id,
        personas (
          nombres,
          apellidos,
          numero_documento
        ),
        alumnos_eventos (
          id,
          fecha,
          hora,
          observacion,
          evento_respuesta_posible_id
        )
      )
    `
      )
      .filter("alumnos.alumnos_eventos.fecha", "eq", fecha_encuetada)
      .eq("alumnos.asistido", "SI")
      .eq("curso_id", curso_id);

    if (error) {
      throw new Error(`Error al obtener alumnos: ${error.message}`);
    }

    return { data };
  }

  private async obtenerRespuestas(
    curso_id: number,
    eventos_preguntas_id: number,
    fecha_encuetada: string
  ) {
    const { data, error } = await client
      .from("alumnos_eventos")
      .select(
        `
      id,
      alumno_id,
      evento_id,
      evento_respuesta_posible_id
    `
      )
      .eq("fecha", fecha_encuetada)
      .eq("curso_id", curso_id)
      .eq("evento_id", eventos_preguntas_id);

    if (error) {
      throw new Error(`Error al obtener respuestas: ${error.message}`);
    }

    return { data };
  }

  async guardarYactulizacion(body: any) {
    try {

      if(body.observacion){
        if(!body.hora.trim() || !body.fecha.trim()){
          throw new Error("La observación no puede estar vacía");
        }
      }
      const { data: existingData, error: checkError } = await client
        .from("alumnos_eventos")
        .select("id")
        .eq("alumno_id", body.alumno_id)
        .eq("fecha", body.fecha)
        .eq("evento_id", body.evento_id);
      if (checkError) {
        throw new Error(checkError.message);
      }
      if (existingData && existingData.length > 0) {
        const idToUpdate = existingData[0].id;
        const { data: updatedData, error: updateError } = await client
          .from("alumnos_eventos")
          .update(body)
          .eq("id", idToUpdate)
          .select("* , eventos_preguntas(*)");

        if (updateError) {
          throw new Error(updateError.message);
        }

        return {
          message: "Respuesta actualizada correctamente",
          data: updatedData[0],
        };
      }
      const { data: insertedData, error: insertError } = await client
        .from("alumnos_eventos")
        .insert(body)
        .select("*");
      if (insertError) {
        throw new Error(insertError.message);
      }

      return {
        message: "Respuesta guardada correctamente",
        data: insertedData,
      };
    } catch (err) {
      console.error("Error al guardar respuesta:", err);
      throw err;
    }
  }

  async guardar(body: any) {
    try {
      const { data, error } = await client
        .from("alumnos_eventos")
        .insert(body)
        .select("*, eventos_preguntas(*)"); // si quieres traer la relación

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: "Respuesta guardada correctamente",
        data: data[0], // el insert devuelve un array
      };
    } catch (err) {
      console.error("Error al guardar respuesta:", err);
      throw err;
    }
  }

  //Metodos para las fichas del estudiantes
  //registramos una ficha

  async obtenerFichaAlumno(alumno_id: number) {
    try {
      const { data: infoAlumno, error: errorAlumno } = await client
        .from("alumnos_eventos")
        .select(
          `
             observacion,
             hora,
             fecha,
             personas(
              nombres,
              apellidos,
              numero_documento
             ),
             eventos_preguntas(evento, pregunta, tipo_respuesta),
             evento_respuestas_posibles(id, respuesta_texto),
             alumnos(alumno_id , email , personas(nombres) )
          `
        )
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false })
        .eq("alumno_id", alumno_id);
      const dataAlumno = infoAlumno?.filter(
        (alumno) => alumno.evento_respuestas_posibles != null
      );
      return dataAlumno;
    } catch (err) {
      console.error("Error al obtener la ficha alumno:", err);
      throw err;
    }
  }
}
