// funciones/perfilFunctions.ts
import { SupabaseClient, createClient } from '@supabase/supabase-js';
 
import { randomUUID } from 'crypto';
import { Usuario } from '../../../../core/modelo/auth/Usuario';
import { Persona } from '../../../../core/modelo/Persona';

// Validar que usuario existe
export async function validarUsuarioExiste(client: SupabaseClient, usuarioId: number) {
  const { data: dataUsuario, error: errorUsuario } = await client
    .from("usuarios")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (errorUsuario || !dataUsuario) {
    throw new Error("El usuario no existe");
  }
  return dataUsuario;
}

// Validar que persona existe
export async function validarPersonaExiste(client: SupabaseClient, personaId: number) {
  const { data: dataPersona, error: errorPersona } = await client
    .from("personas")
    .select("*")
    .eq("persona_id", personaId)
    .single();

  if (errorPersona || !dataPersona) {
    throw new Error("La persona no existe");
  }
  return dataPersona;
}

// Preparar objeto Usuario
export function prepararUsuario(requestBody: any, dataUsuario: any, actualizadoPor?: number): Usuario {
  const usuario = new Usuario();
  
  Object.assign(usuario, {
    nombre_social: requestBody.nombre_social,
    email: requestBody.email,
    telefono_contacto: requestBody.telefono_contacto,
    url_foto_perfil: requestBody.url_foto_perfil,
    idioma_id: requestBody.idioma_id,
  });

  
  usuario.persona_id = dataUsuario.persona_id;
  usuario.rol_id = dataUsuario.rol_id;
  usuario.idioma_id = dataUsuario.idioma_id;

  return usuario;
}

// Preparar objeto Persona
export function prepararPersona(requestBody: any, dataPersona: any): Persona {
  const persona = new Persona();
  
  Object.assign(persona, dataPersona);
  persona.nombres = requestBody.nombres;
  persona.apellidos = requestBody.apellidos;
  persona.numero_documento = requestBody.numero_documento;

  if (requestBody.fecha_nacimiento) {
    persona.fecha_nacimiento = new Date(requestBody.fecha_nacimiento);
  }

  return persona;
}

// Procesar imagen de perfil
export async function procesarImagenPerfil(urlFotoPerfil: string | undefined, supabaseClient: SupabaseClient): Promise<string | undefined> {
  if (!urlFotoPerfil || !isBase64DataUrl(urlFotoPerfil)) {
    return urlFotoPerfil;
  }

  const { mimeType, base64Data } = extractBase64Info(urlFotoPerfil);
  const buffer = Buffer.from(base64Data, "base64");
  const extension = getExtensionFromMime(mimeType);
  const fileName = `${randomUUID()}.${extension}`;

  const { error } = await supabaseClient.storage
    .from("user-profile")
    .upload(`private/${fileName}`, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  return getURL(supabaseClient, "user-profile", `private/${fileName}`);
}

// Actualizar email en Auth
export async function actualizarEmailAuth(authId: string, email?: string) {
  if (!email) return;

  const admin = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );

  const { error: updateAuthUserError } = await admin.auth.admin.updateUserById(authId, {
    email: email,
  });

  if (updateAuthUserError) {
    throw new Error(updateAuthUserError.message);
  }
}

// Obtener usuario actualizado
export async function obtenerUsuarioActualizado(client: SupabaseClient, usuarioId: number) {
  const { data: dataUsuarioUpdate, error: errorUsuarioUpdate } = await client
    .from("usuarios")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (errorUsuarioUpdate) {
    throw new Error(errorUsuarioUpdate.message);
  }

  return dataUsuarioUpdate;
}

// Cambiar contraseña
export async function cambiarContrasena(client: SupabaseClient, email: string, nuevaContrasena?: string) {
  if (!nuevaContrasena || String(nuevaContrasena).trim() === "") {
    return;
  }

  const { error: updateError } = await client.rpc("cambiar_contrasena", {
    p_email: email,
    p_nueva_contrasena: nuevaContrasena,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }
}

// Funciones auxiliares para imagen
function isBase64DataUrl(str: string): boolean {
  return str.startsWith('data:') && str.includes(';base64,');
}

function extractBase64Info(dataUrl: string): { mimeType: string; base64Data: string } {
  const matches = dataUrl.match(/data:([^;]+);base64,(.+)/);
  if (!matches) throw new Error('Formato base64 inválido');
  
  return {
    mimeType: matches[1],
    base64Data: matches[2]
  };
}

function getExtensionFromMime(mimeType: string): string {
  const extensions: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg', 
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return extensions[mimeType] || 'jpg';
}

function getURL(client: SupabaseClient, bucket: string, path: string): string {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}