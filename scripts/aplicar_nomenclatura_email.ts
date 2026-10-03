import "dotenv/config";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ───────────── CONFIG ─────────────
const COLEGIO_ID = 22; // Colegio República de Francia
const GRADOS = [63, 66, 65, 60]; // 5º, 6º, 7º, 8º Básico
const ANO = 2026;
const DOMINIO = "@almaia.cl";
const CLAVE = "Lavida21.";
const EXCLUIR = new Set<number>([1952]); // alumno_id que NO se tocan (1952: Gmail pendiente de confirmar)
const PARTICULAS = new Set(["de", "del", "la", "las", "los", "san", "santa", "y"]); // apellidos compuestos
// ──────────────────────────────────

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD_ADMIN!, opts);
const anon = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD!, opts);

const APPLY = process.argv.includes("--apply");
const RESET_PW = process.argv.includes("--reset-password");
const PROBAR_LOGIN = process.argv.includes("--login");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const n = (s?: string | null) => (s ?? "").trim().toLowerCase();

// ── Normalización EXACTA: primero se descomponen las tildes (NFD) y se quitan las marcas,
//    así á→a, é→e, í→i, ó→o, ú→u, ü→u, ñ→n. Nunca se borra una letra por tener tilde.
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const token = (s: string) => sinAcentos(s).toLowerCase().replace(/[^a-z]/g, "");

function caracterRaro(s: string): string {
  // letras que siguen sin ser a-z después de quitar tildes (ignorando espacios, guion y apóstrofe)
  return sinAcentos(s).toLowerCase().replace(/[\s\-']/g, "").replace(/[a-z]/g, "");
}

function primerNombre(nombres: string) {
  return token(nombres.trim().split(/\s+/)[0] ?? "");
}

function primerApellido(apellidos: string) {
  const t = apellidos.trim().split(/\s+/);
  let acc = "";
  for (let i = 0; i < t.length; i++) {
    const x = token(t[i]);
    acc += x;
    if (!PARTICULAS.has(x)) break; // "DE LA CRUZ" -> delacruz
  }
  return acc;
}

function rut4(doc: string) {
  const digitos = (doc.split("-")[0] ?? "").replace(/\D/g, "");
  return digitos.length >= 4 ? digitos.slice(-4) : null;
}

async function listarAuth() {
  const todos: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    todos.push(...data.users);
    if (data.users.length < 1000) return todos;
  }
}

type Fila = {
  alumno_id: number; persona_id: number; usuario_id?: number; auth_id?: string;
  nombres: string; apellidos: string; rut: string;
  esperado: string; email_alumnos: string; email_usuarios: string; email_auth: string;
  avisos: string[]; estado: string;
};

async function construir(): Promise<Fila[]> {
  const { data: cursos } = await admin.from("cursos").select("curso_id").eq("colegio_id", COLEGIO_ID).in("grado_id", GRADOS);
  const { data: mats } = await admin.from("alumnos_cursos").select("alumno_id")
    .in("curso_id", (cursos ?? []).map((c) => c.curso_id)).eq("ano_escolar", ANO).eq("activo", true);
  const ids = [...new Set((mats ?? []).map((m) => m.alumno_id))];

  const { data: alumnos } = await admin.from("alumnos").select("alumno_id,email,persona_id").eq("colegio_id", COLEGIO_ID).in("alumno_id", ids);
  const pids = (alumnos ?? []).map((a) => a.persona_id);
  const { data: personas } = await admin.from("personas").select("persona_id,tipo_documento,numero_documento,nombres,apellidos").in("persona_id", pids);
  const { data: usuarios } = await admin.from("usuarios").select("usuario_id,persona_id,email,auth_id").in("persona_id", pids);
  const auth = await listarAuth();

  const pPersona = new Map((personas ?? []).map((p) => [p.persona_id, p]));
  const uPersona = new Map((usuarios ?? []).map((u) => [u.persona_id, u]));
  const aId = new Map(auth.map((u) => [u.id, u]));
  const aEmail = new Map(auth.map((u) => [n(u.email), u]));

  const filas: Fila[] = (alumnos ?? []).map((a) => {
    const p = pPersona.get(a.persona_id)!;
    const u = uPersona.get(a.persona_id);
    const au = u?.auth_id ? aId.get(u.auth_id) : undefined;
    const avisos: string[] = [];

    const nom = primerNombre(p.nombres);
    const ape = primerApellido(p.apellidos);
    const r4 = rut4(p.numero_documento ?? "");
    const raro = caracterRaro(p.nombres.trim().split(/\s+/)[0] ?? "") + caracterRaro(p.apellidos);
    if (raro) avisos.push(`caracter raro: "${raro}"`);
    if ((p.nombres.trim().split(/\s+/)[0] ?? "").includes("-")) avisos.push("nombre con guion");
    if (p.tipo_documento !== "RUT") avisos.push("documento no es RUT");
    if (!r4) avisos.push("RUT sin 4 dígitos");
    if (!nom || !ape) avisos.push("nombre/apellido vacío");
    if (!u) avisos.push("sin fila en usuarios");
    else if (!u.auth_id) avisos.push("usuarios sin auth_id");
    else if (!au) avisos.push("auth_id no existe en Auth");

    return {
      alumno_id: a.alumno_id, persona_id: a.persona_id, usuario_id: u?.usuario_id, auth_id: u?.auth_id ?? undefined,
      nombres: p.nombres, apellidos: p.apellidos, rut: p.numero_documento,
      esperado: nom && ape && r4 ? `${nom}.${ape}${r4}${DOMINIO}` : "",
      email_alumnos: n(a.email), email_usuarios: n(u?.email), email_auth: n(au?.email),
      avisos, estado: "",
    };
  });

  // colisiones y estado
  const cuenta = new Map<string, number>();
  filas.forEach((f) => f.esperado && cuenta.set(f.esperado, (cuenta.get(f.esperado) ?? 0) + 1));
  for (const f of filas) {
    const otro = f.esperado ? aEmail.get(f.esperado) : undefined;
    if (EXCLUIR.has(f.alumno_id)) f.estado = "EXCLUIDO";
    else if (f.avisos.some((x) => /sin fila|sin auth_id|no existe|no es RUT|sin 4|vacío/.test(x)) || !f.esperado) f.estado = "ERROR";
    else if ((cuenta.get(f.esperado) ?? 0) > 1) { f.estado = "COLISION"; f.avisos.push("mismo correo esperado en otro alumno"); }
    else if (otro && otro.id !== f.auth_id) { f.estado = "COLISION"; f.avisos.push(`el correo ya existe en Auth con otro id (${otro.id})`); }
    else if (f.email_alumnos === f.esperado && f.email_usuarios === f.esperado && f.email_auth === f.esperado) f.estado = "OK";
    else f.estado = "CAMBIAR";
  }
  return filas.sort((a, b) => a.alumno_id - b.alumno_id);
}

function resumen(filas: Fila[]) {
  const c: Record<string, number> = {};
  filas.forEach((f) => (c[f.estado] = (c[f.estado] ?? 0) + 1));
  console.log("Resumen:", c, `| Total: ${filas.length}`);
}

function csv(filas: Fila[], nombre: string) {
  const cab = ["alumno_id", "estado", "nombres", "apellidos", "rut", "esperado", "email_alumnos", "email_usuarios", "email_auth", "avisos"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lineas = filas.map((f) => [f.alumno_id, f.estado, f.nombres, f.apellidos, f.rut, f.esperado, f.email_alumnos, f.email_usuarios, f.email_auth, f.avisos.join(" | ")].map(q).join(","));
  writeFileSync(nombre, "\uFEFF" + [cab.join(","), ...lineas].join("\n"), "utf8");
  console.log(`📄 ${nombre}`);
}

async function main() {
  console.log(APPLY ? "=== APLICANDO ===" : "=== SIMULACIÓN (usa --apply para aplicar) ===");
  let filas = await construir();
  resumen(filas);
  csv(filas, APPLY ? "nomenclatura_antes.csv" : "nomenclatura_simulacion.csv");

  for (const f of filas.filter((x) => x.estado === "CAMBIAR")) {
    console.log(`\n${f.alumno_id} ${f.nombres} ${f.apellidos} (${f.rut})`);
    if (f.email_alumnos !== f.esperado) console.log(`   alumnos : ${f.email_alumnos}  ->  ${f.esperado}`);
    if (f.email_usuarios !== f.esperado) console.log(`   usuarios: ${f.email_usuarios}  ->  ${f.esperado}`);
    if (f.email_auth !== f.esperado) console.log(`   auth    : ${f.email_auth}  ->  ${f.esperado}`);
    if (f.avisos.length) console.log(`   ⚠️  ${f.avisos.join(" | ")}`);
  }
  const malos = filas.filter((x) => x.estado === "ERROR" || x.estado === "COLISION");
  if (malos.length) {
    console.log("\n⛔ REVISAR A MANO (no se tocan):");
    malos.forEach((f) => console.log(`   ${f.alumno_id} ${f.nombres} ${f.apellidos}: ${f.estado} - ${f.avisos.join(" | ")}`));
  }
  if (!APPLY) return;

  for (const f of filas.filter((x) => x.estado === "CAMBIAR")) {
    // 1) Auth primero: si falla, no se toca nada más de este alumno
    if (f.email_auth !== f.esperado || RESET_PW) {
      const { error } = await admin.auth.admin.updateUserById(f.auth_id!, {
        ...(f.email_auth !== f.esperado ? { email: f.esperado, email_confirm: true } : {}),
        ...(RESET_PW ? { password: CLAVE } : {}),
      });
      if (error) { console.log(`❌ Auth ${f.alumno_id} ${f.esperado}: ${error.message}`); continue; }
    }
    // 2) usuarios
    if (f.email_usuarios !== f.esperado) {
      const { error } = await admin.from("usuarios")
        .update({ email: f.esperado, actualizado_por: 1, fecha_actualizacion: new Date().toISOString() })
        .eq("usuario_id", f.usuario_id!);
      if (error) console.log(`❌ usuarios ${f.alumno_id}: ${error.message}`);
    }
    // 3) alumnos
    if (f.email_alumnos !== f.esperado) {
      const { error } = await admin.from("alumnos").update({ email: f.esperado }).eq("alumno_id", f.alumno_id);
      if (error) console.log(`❌ alumnos ${f.alumno_id}: ${error.message}`);
    }
    console.log(`✅ ${f.alumno_id} ${f.esperado}`);
  }

  // Verificación: se vuelve a leer todo desde la base
  console.log("\n=== VERIFICACIÓN ===");
  filas = await construir();
  resumen(filas);
  csv(filas, "nomenclatura_despues.csv");

  if (PROBAR_LOGIN) {
    console.log("\n=== LOGIN ===");
    let ok = 0, mal = 0;
    for (const f of filas.filter((x) => x.estado === "OK")) {
      let r = await anon.auth.signInWithPassword({ email: f.esperado, password: CLAVE });
      if (r.error?.status === 429) { console.log("⏳ rate limit, esperando 65s..."); await sleep(65_000); r = await anon.auth.signInWithPassword({ email: f.esperado, password: CLAVE }); }
      if (r.error) { mal++; console.log(`❌ ${f.alumno_id} ${f.esperado}: ${r.error.message}`); } else ok++;
      await anon.auth.signOut();
      await sleep(400);
    }
    console.log(`Login OK: ${ok} | Fallidos: ${mal}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });