import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

/* ============================================================================
 * NOMENCLATURA DE CORREOS · DOCENTES
 * Colegio República de Francia (22) · docentes activos
 *
 *   primernombre.primerapellido + 4 dígitos del RUT (antes del verificador) @almaia.cl
 *
 * Uso (desde la raíz del proyecto):
 *   npx tsx scripts/nomenclatura_docentes.ts                       -> SIMULACIÓN (no toca nada)
 *   npx tsx scripts/nomenclatura_docentes.ts --apply               -> aplica (Auth + usuarios)
 *   npx tsx scripts/nomenclatura_docentes.ts --apply --reset-password --login
 *
 * Solo cambia el correo en Auth y en usuarios. No toca personas ni docentes.
 * Guarda el correo anterior en docentes_antes_despues.csv (por si hay que revertir).
 *
 * OJO RUT: en docentes el RUT viene SIN guion ni verificador (ej. 12725464). Se interpreta como
 * cuerpo del RUT y se usan sus últimos 4 dígitos. El verificador que correspondería queda en la
 * nota del CSV para que puedan contrastarlo con el RUT real.
 * ========================================================================== */

// ─── CONFIG ────────────────────────────────────────────────────────────────
const COLEGIO_ID = 22;
const DOMINIO = "@almaia.cl";
const CLAVE = "Lavida21."; // solo se usa con --reset-password
const PARTICULAS = new Set(["de", "del", "la", "las", "los", "san", "santa", "y"]);
// ───────────────────────────────────────────────────────────────────────────

const apply = process.argv.includes("--apply");
const resetPw = process.argv.includes("--reset-password");
const doLogin = process.argv.includes("--login");

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const admin: any = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD_ADMIN!, opts);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Regla de nomenclatura (transliterar, nunca borrar letras) ─────────────
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function token(s: string): string | null {
  const base = sinAcentos(s).toLowerCase();
  if (/[^a-z\s\-'.]/.test(base)) return null; // algo que no sabemos transliterar -> no adivinar
  return base.replace(/[^a-z]/g, "");
}
function primerNombre(nombres: string): string | null {
  const v = token((nombres ?? "").trim().split(/\s+/)[0] ?? "");
  return v ? v : null;
}
function primerApellido(apellidos: string): string | null {
  let acc = "";
  for (const p of (apellidos ?? "").trim().split(/\s+/).filter(Boolean)) {
    const v = token(p);
    if (v === null) return null;
    acc += v;
    if (!PARTICULAS.has(v)) break;
  }
  return acc ? acc : null;
}
function dvRut(cuerpo: string): string {
  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (suma % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}
function rut4(doc: string | null | undefined): { ok: true; r4: string; nota?: string } | { ok: false; error: string } {
  if (!doc) return { ok: false, error: "sin RUT" };
  const limpio = doc.trim().toUpperCase().replace(/\./g, "");
  // Con verificador: 12345678-5
  const m = /^(\d{7,9})-([0-9K])$/.exec(limpio);
  if (m) {
    const [, cuerpo, dv] = m;
    if (cuerpo.length <= 8 && dvRut(cuerpo) !== dv)
      return { ok: false, error: `RUT con verificador incorrecto (${doc}; debería terminar en -${dvRut(cuerpo)})` };
    return { ok: true, r4: cuerpo.slice(-4) };
  }
  // Sin verificador (como vienen los docentes): solo dígitos -> es el cuerpo del RUT
  const s = /^(\d{7,8})$/.exec(limpio);
  if (s) {
    return {
      ok: true,
      r4: s[1].slice(-4),
      nota: `RUT sin verificador (${doc}); se usan los últimos 4 del cuerpo. Verificador que correspondería: -${dvRut(s[1])}`,
    };
  }
  return { ok: false, error: `RUT con formato inválido (${doc})` };
}
function emailEsperado(p: any): { ok: true; email: string; nota?: string } | { ok: false; error: string } {
  const nom = primerNombre(p.nombres);
  if (!nom) return { ok: false, error: `nombre no transliterable (${p.nombres})` };
  const ape = primerApellido(p.apellidos);
  if (!ape) return { ok: false, error: `apellido no transliterable (${p.apellidos})` };
  const r = rut4(p.numero_documento);
  if (!r.ok) return r;
  return { ok: true, email: `${nom}.${ape}${r.r4}${DOMINIO}`, nota: r.nota };
}

// ─── Utilidades ────────────────────────────────────────────────────────────
const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
const csv = (rows: any[][]) =>
  rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

async function ok<T>(p: PromiseLike<{ data: T; error: any }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function listarAuth() {
  const todos: any[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    todos.push(...data.users);
    if (data.users.length < 1000) return todos;
  }
}

type Fila = {
  persona_id: number;
  docente_ids: number[];
  rut: string;
  nombre: string;
  apellido: string;
  actual: string;
  authId: string | null;
  nuevo: string;
  estado: "OK" | "CAMBIAR" | "ERROR" | "COLISION" | "SIN_USUARIO";
  nota: string;
};

async function main() {
  console.log(apply ? "=== APLICANDO ===" : "=== SIMULACIÓN (agrega --apply para aplicar) ===");

  // 1) docentes activos del colegio
  const docs = await ok<any[]>(
    admin.from("docentes").select("docente_id,persona_id").eq("colegio_id", COLEGIO_ID).eq("activo", true),
    "docentes"
  );
  const porPersona = new Map<number, { docente_ids: Set<number> }>();
  for (const d of docs) {
    if (d.persona_id == null) continue;
    const g = porPersona.get(d.persona_id) ?? { docente_ids: new Set() };
    g.docente_ids.add(d.docente_id);
    porPersona.set(d.persona_id, g);
  }
  const personaIds = [...porPersona.keys()];
  console.log(`Docentes (personas distintas): ${personaIds.length}\n`);

  // 2) personas y usuarios
  const personas = await ok<any[]>(
    admin.from("personas").select("persona_id,nombres,apellidos,numero_documento").in("persona_id", personaIds),
    "personas"
  );
  const personaMap = new Map(personas.map((p) => [p.persona_id, p]));
  const usuarios = await ok<any[]>(
    admin.from("usuarios").select("persona_id,email,auth_id").in("persona_id", personaIds),
    "usuarios"
  );
  const usuariosPorPersona = new Map<number, any[]>();
  for (const u of usuarios) usuariosPorPersona.set(u.persona_id, [...(usuariosPorPersona.get(u.persona_id) ?? []), u]);

  // 3) Auth
  const auth = await listarAuth();
  const authPorId = new Map(auth.map((u) => [u.id, u]));
  const authPorEmail = new Map(auth.map((u) => [norm(u.email), u]));

  // 4) correo esperado de cada uno
  const esperados = new Map<number, ReturnType<typeof emailEsperado>>();
  for (const pid of personaIds) esperados.set(pid, personaMap.has(pid) ? emailEsperado(personaMap.get(pid)) : { ok: false, error: "persona no encontrada" });

  const cuentaEsperado = new Map<string, number>();
  for (const e of esperados.values()) if (e.ok) cuentaEsperado.set(e.email, (cuentaEsperado.get(e.email) ?? 0) + 1);

  // usuarios que ya usan alguno de los correos esperados (de otra persona)
  const emailsEsp = [...cuentaEsperado.keys()];
  const usuariosConEsp = emailsEsp.length
    ? await ok<any[]>(admin.from("usuarios").select("persona_id,email").in("email", emailsEsp), "usuarios (colisiones)")
    : [];
  const duenoUsuarios = new Map(usuariosConEsp.map((u) => [norm(u.email), u.persona_id]));

  // 5) clasificar
  const filas: Fila[] = [];
  for (const pid of personaIds) {
    const g = porPersona.get(pid)!;
    const p = personaMap.get(pid);
    const us = usuariosPorPersona.get(pid) ?? [];
    const esp = esperados.get(pid)!;
    const base = {
      persona_id: pid,
      docente_ids: [...g.docente_ids],
      rut: p?.numero_documento ?? "",
      nombre: p?.nombres ?? "",
      apellido: p?.apellidos ?? "",
    };
    const f = (x: Partial<Fila>): Fila => ({ ...base, actual: "", authId: null, nuevo: "", estado: "ERROR", nota: "", ...x });

    if (!esp.ok) { filas.push(f({ estado: "ERROR", nota: esp.error, actual: us[0]?.email ?? "" })); continue; }
    if (us.length === 0) { filas.push(f({ estado: "SIN_USUARIO", nuevo: esp.email, nota: "no tiene fila en usuarios" })); continue; }
    if (us.length > 1) { filas.push(f({ estado: "ERROR", nuevo: esp.email, actual: us.map((u) => u.email).join(" | "), nota: `${us.length} filas en usuarios` })); continue; }

    const u = us[0];
    const actual = norm(u.email);
    const nuevo = esp.email;
    const notas: string[] = [];
    if (esp.nota) notas.push(esp.nota);

    if ((cuentaEsperado.get(nuevo) ?? 0) > 1) { filas.push(f({ estado: "COLISION", actual, nuevo, authId: u.auth_id, nota: "dos personas generan el mismo correo" })); continue; }
    const dueno = duenoUsuarios.get(nuevo);
    if (dueno != null && dueno !== pid) { filas.push(f({ estado: "COLISION", actual, nuevo, authId: u.auth_id, nota: `usuarios: ya lo usa persona ${dueno}` })); continue; }

    let authId: string | null = u.auth_id ?? null;
    if (authId) {
      const cuenta = authPorId.get(authId);
      if (!cuenta) { filas.push(f({ estado: "ERROR", actual, nuevo, authId, nota: "auth_id no existe en Auth" })); continue; }
      if (norm(cuenta.email) !== actual) notas.push(`Auth tiene ${cuenta.email} (distinto a usuarios)`);
      const otro = authPorEmail.get(nuevo);
      if (otro && otro.id !== authId) { filas.push(f({ estado: "COLISION", actual, nuevo, authId, nota: `Auth: ${nuevo} ya existe con otro id (${otro.id})` })); continue; }
    } else {
      const porMail = authPorEmail.get(actual);
      if (porMail) {
        authId = porMail.id;
        notas.push("auth_id vacío; se vincula por correo");
        const otro = authPorEmail.get(nuevo);
        if (otro && otro.id !== authId) { filas.push(f({ estado: "COLISION", actual, nuevo, authId, nota: `Auth: ${nuevo} ya existe con otro id` })); continue; }
      } else {
        notas.push("sin cuenta en Auth; se creará con el registro masivo");
        if (authPorEmail.has(nuevo)) { filas.push(f({ estado: "COLISION", actual, nuevo, nota: `Auth: ${nuevo} ya existe` })); continue; }
      }
    }
    if (/\-/.test(p.nombres ?? "") ) notas.push("nombre con guion (se une sin guion)");
    const igual = actual === nuevo && (!authId || norm(authPorId.get(authId)?.email) === nuevo);
    filas.push(f({ estado: igual ? "OK" : "CAMBIAR", actual, nuevo, authId, nota: notas.join("; ") }));
  }

  // 6) reporte
  const orden = { ERROR: 0, COLISION: 1, SIN_USUARIO: 2, CAMBIAR: 3, OK: 4 } as const;
  filas.sort((a, b) => orden[a.estado] - orden[b.estado] || a.apellido.localeCompare(b.apellido));
  for (const r of filas) {
    if (r.estado === "OK") continue;
    console.log(`[${r.estado}] persona ${r.persona_id} · ${r.nombre} ${r.apellido} (${r.rut}) · docente ${r.docente_ids.join(",")}`);
    if (r.actual) console.log(`   actual: ${r.actual}`);
    if (r.nuevo) console.log(`   nuevo : ${r.nuevo}`);
    if (r.nota) console.log(`   ⚠️  ${r.nota}`);
  }
  const cuenta = (e: string) => filas.filter((r) => r.estado === e).length;
  console.log(`\nResumen: OK=${cuenta("OK")}  CAMBIAR=${cuenta("CAMBIAR")}  ERROR=${cuenta("ERROR")}  COLISION=${cuenta("COLISION")}  SIN_USUARIO=${cuenta("SIN_USUARIO")}  (total ${filas.length})`);

  writeFileSync(
    "docentes_simulacion.csv",
    "﻿" + csv([
      ["estado", "persona_id", "docente_ids", "rut", "nombres", "apellidos", "email_actual", "email_nuevo", "auth_id", "nota"],
      ...filas.map((r) => [r.estado, r.persona_id, r.docente_ids.join(" "), r.rut, r.nombre, r.apellido, r.actual, r.nuevo, r.authId ?? "", r.nota]),
    ])
  );
  console.log("→ docentes_simulacion.csv");

  const aplicables = filas.filter((r) => r.estado === "CAMBIAR");
  if (!apply) {
    console.log(`\nSimulación terminada. Si todo se ve bien: npx tsx scripts/nomenclatura_docentes.ts --apply${resetPw ? " --reset-password" : ""}`);
    return;
  }

  // 7) aplicar (solo CAMBIAR). Auth primero, luego usuarios; si usuarios falla se revierte Auth.
  const hechos: Fila[] = [];
  for (const r of aplicables) {
    try {
      if (r.authId) {
        const patch: any = { email: r.nuevo, email_confirm: true };
        if (resetPw) patch.password = CLAVE;
        const { error } = await admin.auth.admin.updateUserById(r.authId, patch);
        if (error) throw new Error(`Auth: ${error.message}`);
      }
      const { data, error } = await admin.from("usuarios").update({ email: r.nuevo }).eq("persona_id", r.persona_id).select("persona_id");
      if (error || !data || data.length !== 1) {
        if (r.authId) await admin.auth.admin.updateUserById(r.authId, { email: r.actual, email_confirm: true });
        throw new Error(`usuarios: ${error?.message ?? `se esperaba 1 fila y fueron ${data?.length ?? 0}`} (Auth revertido)`);
      }
      if (r.authId && !authPorId.get(r.authId)?.email) { /* nada */ }
      hechos.push(r);
      console.log(`✅ ${r.actual} -> ${r.nuevo}`);
    } catch (e: any) {
      console.log(`❌ persona ${r.persona_id} ${r.nombre} ${r.apellido}: ${e.message}`);
    }
  }
  writeFileSync(
    "docentes_antes_despues.csv",
    "﻿" + csv([["persona_id", "email_antes", "email_despues", "auth_id"], ...hechos.map((r) => [r.persona_id, r.actual, r.nuevo, r.authId ?? ""])])
  );
  console.log(`\nAplicados: ${hechos.length}/${aplicables.length} → docentes_antes_despues.csv (guárdalo: tiene los correos anteriores)`);

  // 8) re-verificar contra la BD real
  const usDespues = await ok<any[]>(admin.from("usuarios").select("persona_id,email,auth_id").in("persona_id", hechos.map((h) => h.persona_id)), "verificación usuarios");
  const authDespues = new Map((await listarAuth()).map((u) => [u.id, u]));
  let malos = 0;
  for (const h of hechos) {
    const u = usDespues.find((x) => x.persona_id === h.persona_id);
    const a = h.authId ? authDespues.get(h.authId) : null;
    const okU = norm(u?.email) === h.nuevo;
    const okA = !h.authId || norm(a?.email) === h.nuevo;
    if (!okU || !okA) { malos++; console.log(`⚠️ verificación: persona ${h.persona_id} usuarios=${u?.email} auth=${a?.email} esperado=${h.nuevo}`); }
  }
  console.log(malos === 0 ? "✅ Verificación: usuarios y Auth coinciden con la nomenclatura." : `⚠️ ${malos} con diferencias.`);

  // 9) payload para el registro masivo (modo estricto) con todos los docentes ya correctos
  const listos = [...filas.filter((r) => r.estado === "OK"), ...hechos];
  writeFileSync(
    "payload_docentes_almaia.json",
    JSON.stringify({ clave_universal: CLAVE, usuarios: listos.map((r) => r.nuevo).sort() }, null, 2)
  );
  console.log(`→ payload_docentes_almaia.json (${listos.length} correos)`);

  // 10) login opcional (solo tiene sentido con --reset-password)
  if (doLogin) {
    if (!resetPw) { console.log("--login requiere --reset-password (si no, no se conoce la clave)."); return; }
    const anon = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD!, opts);
    let okL = 0;
    for (const h of hechos) {
      let res = await anon.auth.signInWithPassword({ email: h.nuevo, password: CLAVE });
      if ((res.error as any)?.status === 429) { await sleep(65_000); res = await anon.auth.signInWithPassword({ email: h.nuevo, password: CLAVE }); }
      if (res.error) console.log(`❌ login ${h.nuevo}: ${res.error.message}`); else okL++;
      await anon.auth.signOut();
      await sleep(400);
    }
    console.log(`Login: ${okL}/${hechos.length} OK`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

// npx tsx scripts/nomenclatura_docentes.ts                                    # simula
// npx tsx scripts/nomenclatura_docentes.ts --apply --reset-password --login   # aplica
