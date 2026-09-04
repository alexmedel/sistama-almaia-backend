import { createClient } from "@supabase/supabase-js";

// Función para validar la contraseña actual del usuario
export async function validateCurrentPassword(email: string, currentPassword: string) {
  const admin = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );

  const { error: ErrorLoginWithPassword } = await admin.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (ErrorLoginWithPassword) {
    throw new Error("Contraseña incorrecta");
  }
}

// Función para actualizar la contraseña del usuario por su UUID
export async function updateUserPasswordById(UUID: string, newPassword: string) {
  const admin = createClient(
    process.env.SUPABASE_HOST || "",
    process.env.SUPABASE_PASSWORD_ADMIN || ""
  );

  const { data, error: updateError } = await admin.auth.admin.updateUserById(UUID, {
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data;
}

