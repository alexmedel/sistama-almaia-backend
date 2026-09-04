// Importaciones necesarias
import { SupabaseClient } from '@supabase/supabase-js';
import { PersonaSchema } from '../../shemas/PersonaSchema';
import { DataService } from '../../../DataService';
import { Persona } from '../../../../../core/modelo/Persona';
 

/**
 * Valida los datos del cuerpo de la solicitud con el esquema Joi.
 */
export const validarPersonaSchema = (data: any) => {
    const { error } = PersonaSchema.validate(data);
    if (error) {
        throw new Error(error.details[0].message);
    }
};

/**
 * Verifica si un estado civil existe en la base de datos.
 */
export const verificarEstadoCivil = async (estadoCivilId: number, client: SupabaseClient) => {
    const { data, error } = await client
        .from('estados_civiles')
        .select('*')
        .eq('estado_civil_id', estadoCivilId)
        .single();
    if (error || !data) {
        throw new Error('El estado civil no existe.');
    }
};

/**
 * Verifica si un género existe en la base de datos.
 */
export const verificarGenero = async (generoId: number, client: SupabaseClient) => {
    const { data, error } = await client
        .from('generos')
        .select('*')
        .eq('genero_id', generoId)
        .single();
    if (error || !data) {
        throw new Error('El genero no existe.');
    }
};

export const guardarPersonaService = async (
    personaData: any,
    creadoPor: number,
    actualizadoPor: number,
    supabaseClient: SupabaseClient,
      dataService: DataService<Persona>
) => {
    // 1. Validar los datos de entrada al inicio
    validarPersonaSchema(personaData);

    // 2. Verificar las referencias externas, pasando el cliente a los helpers
    await verificarEstadoCivil(personaData.estado_civil_id, supabaseClient);
    await verificarGenero(personaData.genero_id, supabaseClient);

    // 3. Crear el objeto Persona y asignar las propiedades
    const persona = new Persona();
    Object.assign(persona, personaData);
    persona.creado_por = creadoPor;
    persona.actualizado_por = actualizadoPor;
    
    // 4. Guardar la persona a través de tu servicio de datos
    const savedPersona = await dataService.processData(persona);

    return savedPersona;
};