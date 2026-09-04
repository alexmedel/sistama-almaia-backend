import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { client } from "../../../../../helpers/supabase-client";

const PASSWORD_RESET_CODE_TTL_MS = 15 * 60 * 1000;

// Función para obtener el usuario y la solicitud de cambio de contraseña
export async function getUsuarioAndSolicitud(email: string, pass: string , newPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();
  // Crear cliente de Supabase Admin
  const admin = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );

  // Buscar el usuario por email
  const { data: usuario } = await admin
    .from("view_auth_users")
    .select("id") // Solo selecciona el ID para ser más eficiente
    .eq("email", normalizedEmail)
    .single();
  
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  // Validar el código de autorización
  const { data: solicitud, error: errorSolicitud } = await admin
    .from("solicitudes_cambio_password")
    .select("*")
    .eq("user_auth_id", usuario.id)
    .eq("authorization_pass", pass)
    .single();

  if (errorSolicitud) {
    return null;
  }
  if (!solicitud) {
    return null;
  }
  if (solicitud.used_pass) {
    return null;
  }
  if (
    !solicitud.created_at ||
    Date.now() - new Date(solicitud.created_at).getTime() > PASSWORD_RESET_CODE_TTL_MS
  ) {
    return null;
  }
  if (solicitud.authorization_pass !== pass) {
    return null;
  }
  const {error: updateError} = await client.auth.admin.updateUserById(usuario.id, {
    password: newPassword,
  });
  if (updateError) {
    return null;
  }
  return { usuarioId: usuario.id, solicitud };
}

// Función para marcar el código de autorización como usado
export async function markCodeAsUsed(
  client: SupabaseClient,
  usuarioId: string,
  pass: string
) {
  const { error: updateError } = await client
    .from("solicitudes_cambio_password")
    .update({ used_pass: true })
    .eq("user_auth_id", usuarioId)
    .eq("authorization_pass", pass);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

// Función para actualizar la contraseña del usuario
export async function updateUserPassword(
  usuarioId: string,
  newPassword: string
) {
  const admin = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );
  const { data, error: updateError } = await admin.auth.admin.updateUserById(
    usuarioId,
    { password: newPassword }
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data;
}
