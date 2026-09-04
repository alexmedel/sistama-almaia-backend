import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Función para obtener el email de un alumno por su ID
export async function getAlumnoEmailById(client: SupabaseClient, alumnoId: string) {
  const { data, error } = await client
    .from("alumnos")
    .select("email")
    .eq("alumno_id", alumnoId)
    .single();

  if (error || !data) {
    throw new Error("Alumno no encontrado");
  }

  return data.email;
}

// Función para obtener el auth_id de un usuario por su email
export async function getAuthIdByEmail(client: SupabaseClient, email: string) {
  const { data: user, error } = await client
    .from("usuarios")
    .select("auth_id")
    .eq("email", email)
    .single();

  if (error || !user) {
    throw new Error("Usuario no existe");
  }

  return user.auth_id;
}

// Función para actualizar la contraseña del usuario en Supabase Auth
export async function updateAuthPassword(authId: string, newPassword: string) {
  const adminClient = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );

  const { data, error } = await adminClient.auth.admin.updateUserById(authId, {
    password: newPassword,
  });
  console.log(data);
  if (error) {
    throw new Error(error.message);
  }

  return data;
}