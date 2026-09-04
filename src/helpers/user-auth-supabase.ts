import { SupabaseClient } from "@supabase/supabase-js";
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const getAuthIdByEmail = async (
  client: SupabaseClient,
  email: string
) => {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await client
    .from("usuarios")
    .select("auth_id")
    .eq("email", normalizedEmail)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data.auth_id;
};

export const verificarExistencia = async (
  client: SupabaseClient,
  email: string,
  password: string
): Promise<boolean> => {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) {
    return false;
  }
  return true;
};
