import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Joi from 'joi';
import { UsuarioSchema } from '../../sheman/UsuarioSchema';
import { Usuario } from '../../../../../core/modelo/auth/Usuario';
 

// Función para validar las relaciones antes de crear el usuario
export async function validateUserRelations(client: SupabaseClient, usuario: Usuario) {
  const { rol_id, persona_id, idioma_id } = usuario;

  // 1. Validar el rol
  const { data: rol, error: rolError } = await client.from('roles').select('*').eq('rol_id', rol_id).single();
  if (rolError || !rol) throw new Error('El rol no existe');

  // 2. Validar la persona
  const { data: persona, error: personaError } = await client.from('personas').select('*').eq('persona_id', persona_id).single();
  if (personaError || !persona) throw new Error('La persona no existe');

  // 3. Validar el idioma
  const { data: idioma, error: idiomaError } = await client.from('idiomas').select('*').eq('idioma_id', idioma_id).single();
  if (idiomaError || !idioma) throw new Error('El nivel educativo no existe');
}

// Función principal para procesar la creación del usuario
export async function processUserCreation(client: SupabaseClient, usuarioData: any) {
  // Validar el esquema de datos
  const { error: validationError } = UsuarioSchema.validate(usuarioData);
  if (validationError) {
    throw new Error(validationError.details[0].message);
  }

  // Desestructurar los datos necesarios para la autenticación
  const { email, encripted_password } = usuarioData;

  // 1. Crear usuario en Supabase Auth
  const { data: dataAuth, error: errorAuth } = await client.auth.signUp({
    email,
    password: encripted_password,
  });

  if (errorAuth) {
    throw new Error(errorAuth.message);
  }

  // 2. Validar las relaciones de forma atómica
  await validateUserRelations(client, usuarioData);

  // 3. Preparar el objeto para la inserción en la tabla 'usuarios'
  const nuevoUsuario = {
    ...usuarioData,
    auth_id: dataAuth.user?.id,
  };

  return nuevoUsuario;
}