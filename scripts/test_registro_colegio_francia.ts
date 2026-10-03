import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD_ADMIN!, opts);
const anon = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD!, opts);

const CLAVE = process.argv[2] ?? "Lavida21.";
const COLEGIO_ID = 22; // Colegio República de Francia
const GRADOS = [63, 66, 65, 60]; // 5º, 6º, 7º, 8º Básico
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== TEST REGISTRO · Colegio República de Francia (colegio_id 22) ===");
  console.log(`Grados: 5º, 6º, 7º y 8º Básico | Año escolar 2026 | Clave: ${CLAVE}\n`);

  const { data: cursos } = await admin
    .from("cursos")
    .select("curso_id")
    .eq("colegio_id", COLEGIO_ID)
    .in("grado_id", GRADOS);

  const { data: mats } = await admin
    .from("alumnos_cursos")
    .select("alumno_id")
    .in("curso_id", (cursos ?? []).map((c) => c.curso_id))
    .eq("ano_escolar", 2026)
    .eq("activo", true);

  const { data: alumnos } = await admin
    .from("alumnos")
    .select("alumno_id,email,persona_id")
    .eq("colegio_id", COLEGIO_ID)
    .in("alumno_id", [...new Set((mats ?? []).map((m) => m.alumno_id))]);

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("persona_id,auth_id,is_blocked,activo");
  const porPersona = new Map((usuarios ?? []).map((u) => [u.persona_id, u]));

  const fallos: string[] = [];
  let ok = 0;

  for (const a of alumnos ?? []) {
    const email = a.email.trim().toLowerCase();
    let res = await anon.auth.signInWithPassword({ email, password: CLAVE });

    // rate limit: espera y reintenta una vez
    if (res.error?.status === 429) {
      console.log("⏳ rate limit, esperando 65s...");
      await sleep(65_000);
      res = await anon.auth.signInWithPassword({ email, password: CLAVE });
    }

    if (res.error) {
      fallos.push(`${a.alumno_id} ${email}: ${res.error.message}`);
      console.log(`❌ ${a.alumno_id} ${email}: ${res.error.message}`);
    } else {
      const u = porPersona.get(a.persona_id);
      const vinculo = u?.auth_id === res.data.user?.id;
      const extra = !u
        ? "sin fila usuarios"
        : !vinculo
          ? "auth_id NO coincide"
          : u.is_blocked
            ? "is_blocked"
            : !u.activo
              ? "inactivo"
              : "";
      if (extra) {
        fallos.push(`${a.alumno_id} ${email}: login OK pero ${extra}`);
        console.log(`⚠️  ${a.alumno_id} ${email}: ${extra}`);
      } else {
        ok++;
        console.log(`✅ ${a.alumno_id} ${email}`);
      }
    }
    await anon.auth.signOut();
    await sleep(400);
  }

  console.log(`\n=== RESULTADO · Colegio República de Francia ===`);
  console.log(`Total: ${alumnos?.length} | OK: ${ok} | Con problemas: ${fallos.length}`);
  fallos.forEach((f) => console.log(" -", f));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});