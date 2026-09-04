// Importaciones necesarias
import { SupabaseClient } from '@supabase/supabase-js';
import { PersonaContactoSchema } from '../../shemas/PersonaContactoSchema';
import { PersonaContacto } from '../../../../../core/modelo/PersonaContacto';
import { DataService } from '../../../DataService';
 
/**
 * Valida los datos del cuerpo de la solicitud con el esquema Joi.
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

export const actualizarPersonaContactoService = async (
    contactoId: number,
    contactoData: any,
    actualizadoPor: number,
    supabaseClient: SupabaseClient,
    dataService: DataService<PersonaContacto>
) => {
    // 1. Validar los datos de entrada al principio.
    validarPersonaContactoSchema(contactoData);

    // 2. Verificar que la persona a la que pertenece el contacto exista.
    await verificarPersonaExistente(contactoData.persona_id, supabaseClient);
    
    // 3. Crear el objeto y asignar la propiedad 'actualizado_por'.
    const personaContacto = new PersonaContacto();
    Object.assign(personaContacto, contactoData);
    personaContacto.actualizado_por = actualizadoPor;
    
    // 4. Actualizar el registro en la base de datos.
    await dataService.updateById(contactoId, personaContacto);

    return { message: 'PersonaContacto actualizado correctamente' };
};