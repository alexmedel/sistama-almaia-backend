// En un archivo como `pregunta.helpers.ts`

import { SupabaseClient } from "@supabase/supabase-js";
import { PreguntaSchema } from "../shemas/PreguntaSchema";
import { Pregunta } from "../../../../core/modelo/preguntasRespuestas/Pregunta";
import { DataService } from "../../DataService";

// Valida el cuerpo de la solicitud con el esquema de la pregunta
export const validarPreguntaSchema = (data: any) => {
    const { error } = PreguntaSchema.validate(data);
    if (error) {
        throw new Error(error.details[0].message);
    }
};

// Verifica si un tipo de pregunta existe
export const verificarTipoPregunta = async (tipoPreguntaId: number , client:SupabaseClient) => {
    const { data, error } = await client
        .from("tipos_preguntas")
        .select("*")
        .eq("tipo_pregunta_id", tipoPreguntaId)
        .single();
    if (error || !data) {
        throw new Error("El tipo de pregunta no existe.");
    }
};

// Verifica si un nivel educativo existe
export const verificarNivelEducativo = async (nivelEducativoId: number , client:SupabaseClient) => {
    const { data, error } = await client
        .from("niveles_educativos")
        .select("*")
        .eq("nivel_educativo_id", nivelEducativoId)
        .single();
    if (error || !data) {
        throw new Error("El nivel educativo no existe.");
    }
};

export const guardarPreguntaService = async (
    preguntaData: any, 
    creadoPor: number, 
    actualizadoPor: number,
    client: SupabaseClient, // El cliente de Supabase se pasa como dependencia
    dataService: DataService<Pregunta> // El servicio de datos se pasa como dependencia
) => {
    // 1. Validar los datos de entrada
    validarPreguntaSchema(preguntaData);

    // 2. Verificar las referencias externas, pasando el cliente a los helpers
    await verificarTipoPregunta(preguntaData.tipo_pregunta_id, client);
    await verificarNivelEducativo(preguntaData.nivel_educativo_id, client);

    // 3. Crear el objeto Pregunta y asignar las propiedades
    const pregunta = new Pregunta();
    Object.assign(pregunta, preguntaData);
    pregunta.creado_por = creadoPor;
    pregunta.actualizado_por = actualizadoPor;
    
    // 4. Guardar la pregunta a través de tu servicio de datos
    const savedPregunta = await dataService.processData(pregunta);

    return savedPregunta;
};