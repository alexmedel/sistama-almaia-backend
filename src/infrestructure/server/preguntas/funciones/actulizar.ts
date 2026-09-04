// Importaciones necesarias (asegúrate de que las rutas sean correctas)
import { SupabaseClient } from '@supabase/supabase-js';
import { PreguntaSchema } from '../shemas/PreguntaSchema';
import { Pregunta } from '../../../../core/modelo/preguntasRespuestas/Pregunta';
import { DataService } from '../../DataService';

// Valida el cuerpo de la solicitud con el esquema Joi
export const validarPreguntaSchema = (data: any) => {
    const { error } = PreguntaSchema.validate(data);
    if (error) {
        throw new Error(error.details[0].message);
    }
};

// Verifica si un tipo de pregunta existe en la base de datos
export const verificarTipoPregunta = async (tipoPreguntaId: number, client: SupabaseClient) => {
    const { data, error } = await client
        .from('tipos_preguntas')
        .select('*')
        .eq('tipo_pregunta_id', tipoPreguntaId)
        .single();
    if (error || !data) {
        throw new Error('El tipo de pregunta no existe.');
    }
};

// Verifica si un nivel educativo existe en la base de datos
export const verificarNivelEducativo = async (nivelEducativoId: number, client: SupabaseClient) => {
    const { data, error } = await client
        .from('niveles_educativos')
        .select('*')
        .eq('nivel_educativo_id', nivelEducativoId)
        .single();
    if (error || !data) {
        throw new Error('El nivel educativo no existe.');
    }
};

export const actualizarPreguntaService = async (
    preguntaId: number,
    preguntaData: any,
    actualizadoPor: number,
    supabaseClient: SupabaseClient,
    dataService: DataService<Pregunta>
) => {
    // 1. Validar los datos de entrada
    validarPreguntaSchema(preguntaData);

    // 2. Verificar que las referencias externas existen, pasando el cliente
    await verificarTipoPregunta(preguntaData.tipo_pregunta_id, supabaseClient);
    await verificarNivelEducativo(preguntaData.nivel_educativo_id, supabaseClient);
    
    // 3. Crear el objeto Pregunta y asignar las propiedades
    const pregunta = new Pregunta();
    Object.assign(pregunta, preguntaData);
    pregunta.actualizado_por = actualizadoPor;
    
    // 4. Actualizar el registro en la base de datos
    await dataService.updateById(preguntaId, pregunta);

    return { message: 'Pregunta actualizada correctamente' };
};