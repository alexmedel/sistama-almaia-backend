import { client } from "./supabase-client";

export async function enviarPush(destinatarioId: number, aviso: any): Promise<void> {
  // 1. Buscar el token push del usuario en Supabase
  const { data: tokenData, error } = await client
    .from("perfiles") // O la tabla donde guardas el token
    .select("expo_push_token")
    .eq("id", destinatarioId)
    .single();

  if (error || !tokenData?.expo_push_token) {
    console.log(`[PUSH ERROR] No se encontró token para usuario ${destinatarioId}`);
    return;
  }

  await client.functions.invoke("push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: tokenData.expo_push_token,
      title: aviso.aviso_titulo,
      body: aviso.aviso_contenido,
    }),
  });

  console.log(`[PUSH] Aviso "${aviso.aviso_titulo}" enviado a usuario ${destinatarioId}.`);
}