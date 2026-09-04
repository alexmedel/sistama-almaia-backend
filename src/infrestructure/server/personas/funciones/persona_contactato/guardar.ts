// Importaciones necesarias
import { SupabaseClient } from '@supabase/supabase-js';
import { PersonaContactoSchema } from '../../shemas/PersonaContactoSchema';
import { PersonaContacto } from '../../../../../core/modelo/PersonaContacto';
import { DataService } from '../../../DataService';
 
/**
 * Valida los datos del cuerpo de la solicitud contra el esquema.
 */
export const validarPersonaContactoSchema = (data: any) => {
    const { error } = PersonaContactoSchema.validate(data);
    if (error) {
        throw new Error(error.details[0].message);
    }
};

/**
 * Verifica si una persona con el ID proporcionado existe en la base de datos.
 */
export const verificarPersonaExistente = async (personaId: number, client: SupabaseClient) => {
    const { data, error } = await client
        .from('personas')
        .select('*')
        .eq('persona_id', personaId)
        .single();
    if (error || !data) {
        throw new Error('La persona no existe.');
    }
};

export const guardarPersonaContactoService = async (
    contactoData: any,
    creadoPor: number,
    actualizadoPor: number,
    supabaseClient: SupabaseClient,
    dataService: DataService<PersonaContacto>
) => {
    // 1. Validar los datos de entrada.
    validarPersonaContactoSchema(contactoData);

    // 2. Verificar que la persona de contacto existe en la base de datos.
    await verificarPersonaExistente(contactoData.persona_id, supabaseClient);

    // 3. Crear el objeto de la persona de contacto y asignar las propiedades.
    const personaContacto = new PersonaContacto();
    Object.assign(personaContacto, contactoData);
    personaContacto.creado_por = creadoPor;
    personaContacto.actualizado_por = actualizadoPor;
    
    // 4. Guardar la persona de contacto a través de tu servicio de datos.
    const savedPersonaContacto = await dataService.processData(personaContacto);

    return savedPersonaContacto;
};