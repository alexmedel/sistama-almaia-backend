import { SupabaseClient } from "@supabase/supabase-js";

const SUFIJO = "almaia2025";
const DOMINIO_CORRUPTO = `@almaia.cl${SUFIJO}`;

async function listarTodosAuth(admin: SupabaseClient) {
  const todos: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    todos.push(...data.users);
    if (data.users.length < 1000) return todos;
  }
}

export async function repararCorruptos(
  admin: SupabaseClient,
  claveUniversal: string,
  opciones: { dryRun?: boolean; limite?: number } = {}
) {
  const { dryRun = true, limite } = opciones;

  const todos = await listarTodosAuth(admin);
  const porEmail = new Map(todos.map((u) => [u.email?.toLowerCase(), u]));

  let corruptos = todos.filter((u) =>
    u.email?.toLowerCase().endsWith(DOMINIO_CORRUPTO)
  );
  if (limite) corruptos = corruptos.slice(0, limite);

  const resumen = { renombrados: 0, duplicadosEliminados: 0, fallidos: [] as any[] };
  console.log(`Corruptos encontrados: ${corruptos.length} | dryRun: ${dryRun}`);

  for (const u of corruptos) {
    const corrupto = u.email!.toLowerCase();
    const correcto = corrupto.slice(0, -SUFIJO.length);
    const existente = porEmail.get(correcto);

    try {
      if (existente) {
        // DUPLICADO: el correcto ya existe. Vincular usuarios al correcto y borrar el corrupto.
        console.log(`DUP  ${corrupto} (${u.id}) -> correcto ${existente.id}`);
        if (!dryRun) {
          const { error: e1 } = await admin
            .from("usuarios")
            .update({ auth_id: existente.id })
            .eq("email", correcto);
          if (e1) throw new Error(`vincular usuarios: ${e1.message}`);

          const { error: e2 } = await admin.auth.admin.updateUserById(existente.id, {
            password: claveUniversal,
          });
          if (e2) throw new Error(`password correcto: ${e2.message}`);

          const { error: e3 } = await admin.auth.admin.deleteUser(u.id);
          if (e3) throw new Error(`deleteUser: ${e3.message}`);
        }
        resumen.duplicadosEliminados++;
      } else {
        // RENOMBRAR: mismo id, email y password corregidos.
        console.log(`REN  ${corrupto} -> ${correcto}`);
        if (!dryRun) {
          const { error } = await admin.auth.admin.updateUserById(u.id, {
            email: correcto,
            password: claveUniversal,
            email_confirm: true,
          });
          if (error) throw new Error(error.message);

          // Asegura que usuarios apunte a este id
          await admin.from("usuarios").update({ auth_id: u.id }).eq("email", correcto);
        }
        resumen.renombrados++;
      }
    } catch (err: any) {
      console.error(`ERR  ${corrupto}: ${err.message}`);
      resumen.fallidos.push({ email: corrupto, error: err.message });
    }
  }

  console.log("Resumen:", resumen);
  return resumen;
}