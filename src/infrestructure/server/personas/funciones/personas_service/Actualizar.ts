// En un archivo como `persona.helpers.ts`

import { SupabaseClient } from '@supabase/supabase-js';
import { PersonaSchema } from '../../shemas/PersonaSchema';
import { DataService } from '../../../DataService';
import { Persona } from '../../../../../core/modelo/Persona';

export const validarPersonaSchema = (data: any) => {
    const { error } = PersonaSchema.validate(data);
    if (error) {
        throw new Error(error.details[0].message);
    }
};

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

export const actualizarPersonaService = async (
    personaId: number,
    personaData: any,
    actualizadoPor: number,
    supabaseClient: SupabaseClient,
      dataService: DataService<Persona>
) => {
    // 1. Validar los datos al principio.
    validarPersonaSchema(personaData);

    // 2. Verificar las referencias externas antes de proceder.
    await verificarEstadoCivil(personaData.estado_civil_id, supabaseClient);
    await verificarGenero(personaData.genero_id, supabaseClient);
    
    // 3. Crear el objeto y asignar la propiedad 'actualizado_por'.
    const persona = new Persona();
    Object.assign(persona, personaData);
    persona.actualizado_por = actualizadoPor;
    
    // 4. Actualizar la persona en la base de datos.
    await dataService.updateById(personaId, persona);

    return { message: 'Persona actualizada correctamente' };
};