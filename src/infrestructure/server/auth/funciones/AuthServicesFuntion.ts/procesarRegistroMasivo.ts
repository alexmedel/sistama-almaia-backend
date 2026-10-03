// import { SupabaseClient } from "@supabase/supabase-js";
// import { limpiarEmail } from "../funtions";

// export async function procesarRegistroMasivo(
//   supabaseAdminClient: SupabaseClient,
//   usuarios: unknown[],
//   claveUniversal: string
// ) {
//   const exitosos: any[] = [];
//   const fallidos: any[] = [];

//   const entradas = usuarios.map((usuario) => {
//     const email =
//       typeof usuario === "string"
//         ? usuario
//         : usuario && typeof usuario === "object" && "email" in usuario
//           ? String((usuario as { email: unknown }).email ?? "")
//           : "";
//     return { original: email, email: limpiarEmail(email) };
//   });
//   const emails = [...new Set(entradas.map(({ email }) => email).filter(Boolean))];

//   const { data: usuariosEncontrados, error: usuariosError } = emails.length
//     ? await supabaseAdminClient
//         .from("usuarios")
//         .select("email,auth_id")
//         .in("email", emails)
//     : { data: [], error: null };

//   if (usuariosError) {
//     throw new Error(`Error consultando usuarios: ${usuariosError.message}`);
//   }

//   const userMap = new Map(
//     (usuariosEncontrados || []).map((usuario) => [
//       limpiarEmail(usuario.email),
//       usuario,
//     ])
//   );

//   const results = await Promise.allSettled(
//     entradas.map(async ({ original, email }) => {
//       if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//         throw { email: original || "desconocido", error: "Email inválido." };
//       }

//       const userExist = userMap.get(email);
//       if (!userExist) {
//         throw {
//           email,
//           error: "El usuario no existe en la tabla usuarios; debe estar registrado antes.",
//         };
//       }

//       let authId = userExist.auth_id;
//       let status = "password actualizada";

//       if (authId) {
//         await actualizarPasswordAuth(supabaseAdminClient, authId, claveUniversal);
//       } else {
//         const authUser = await buscarUsuarioAuth(supabaseAdminClient, email);
//         if (authUser) {
//           authId = authUser.id;
//           await actualizarPasswordAuth(supabaseAdminClient, authId, claveUniversal);
//           status = "password actualizada y usuario vinculado";
//         } else {
//           const newUser = await crearUsuarioAuth(
//             supabaseAdminClient,
//             email,
//             claveUniversal
//           );
//           authId = newUser.user.id;
//           status = "usuario creado y vinculado";
//         }

//         await actualizarUsuario(supabaseAdminClient, email, authId);
//       }

//       return { email, id: authId, status };
//     })
//   );

//   // Recolectar resultados
//   for (const res of results) {
//     if (res.status === "fulfilled") {
//       exitosos.push(res.value);
//     } else {
//       const err = res.reason;
//       fallidos.push({
//         email: err?.email || "desconocido",
//         status: "fallido",
//         error: err?.error || err?.message || "Error interno",
//       });
//     }
//   }

//   console.log(`\n📊 Resumen:`);
//   console.log(`   ✅ Exitosos: ${exitosos.length}`);
//   console.log(`   ❌ Fallidos: ${fallidos.length}`);

//   return { exitosos, fallidos };
// }

// async function buscarUsuarioAuth(
//   supabaseAdminClient: SupabaseClient,
//   email: string
// ) {
//   for (let page = 1; ; page += 1) {
//     const { data, error } = await supabaseAdminClient.auth.admin.listUsers({
//       page,
//       perPage: 1000,
//     });

//     if (error) {
//       throw new Error(`Error listando usuarios Auth: ${error.message}`);
//     }

//     const user = data.users.find(
//       (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
//     );
//     if (user) return user;
//     if (data.users.length < 1000) return null;
//   }
// }

// // ✅ Actualizar password en auth
// async function actualizarPasswordAuth(
//   supabaseAdminClient: SupabaseClient,
//   userId: string,
//   newPassword: string
// ) {
//   const { data, error } = await supabaseAdminClient.auth.admin.updateUserById(
//     userId,
//     { password: newPassword }
//   );
  
//   if (error) {
//     throw new Error(`Error actualizando password: ${error.message}`);
//   }
  
//   console.log(`✅ Password actualizada para UID: ${userId}`);
//   return data;
// }

// // ✅ Crear usuario en auth
// export async function crearUsuarioAuth(
//   supabaseAdminClient: SupabaseClient,
//   email: string,
//   password: string
// ) {
//   const { data, error } = await supabaseAdminClient.auth.admin.createUser({
//     email: email.trim(),
//     password,
//     email_confirm: true,
//   });
  
//   if (error) {
//     throw new Error(`Error creando auth user: ${error.message}`);
//   }
  
//   if (!data?.user?.id) {
//     throw new Error('Auth user creado pero sin ID válido');
//   }
  
//   console.log(`✅ Auth user creado: ${data.user.id}`);
//   return data;
// }

// // ✅ Actualizar auth_id en tabla usuarios
// async function actualizarUsuario(
//   supabaseAdminClient: SupabaseClient,
//   email: string,
//   authId: string
// ) {
//   const { data, error } = await supabaseAdminClient
//     .from("usuarios")
//     .update({ auth_id: authId })
//     .eq("email", email)
//     .select()
//     .single();
    
//   if (error) {
//     throw new Error(`Error actualizando usuario ${email}: ${error.message}`);
//   }
  
//   if (!data) {
//     throw new Error(`No se encontró usuario con email: ${email}`);
//   }
  
//   console.log(`✅ Usuario vinculado: ${email} → ${authId}`);
//   return data;
// }


import { SupabaseClient, User } from "@supabase/supabase-js";
import { limpiarEmail } from "../funtions";

/* ============================================================================
 * MODO ESTRICTO (opt-in, no cambia el comportamiento actual si no se activa)
 *
 * Se activa con la variable de entorno REGISTRO_MASIVO_ESTRICTO=true
 * (o pasando { estricto: true } como 4º parámetro).
 *
 * En modo estricto:
 *  - NO usa limpiarEmail: solo trim + minúsculas. Rechaza tildes/ñ/caracteres raros.
 *  - Exige dominio @almaia.cl.
 *  - Exige nomenclatura: primernombre.primerapellido + 4 dígitos del RUT (antes del
 *    verificador) calculada desde personas (nombres, apellidos, numero_documento).
 *  - No toca una cuenta de Auth si el auth_id apunta a un correo distinto.
 *
 * En modo normal (por defecto) el comportamiento es el mismo de siempre.
 * ========================================================================== */

export interface OpcionesRegistroMasivo {
  estricto?: boolean;
  dominio?: string; // default "@almaia.cl" (solo modo estricto)
}

const DOMINIO_DEFAULT = "@almaia.cl";
const PARTICULAS = new Set(["de", "del", "la", "las", "los", "san", "santa", "y"]);
const EMAIL_ASCII = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** á→a, ñ→n, ü→u. Quita guion/apóstrofe/punto. Devuelve null si queda un carácter que no sabemos transliterar. */
function token(s: string): string | null {
  const base = sinAcentos(s).toLowerCase();
  if (/[^a-z\s\-'.]/.test(base)) return null;
  return base.replace(/[^a-z]/g, "");
}

function primerNombre(nombres: string): string | null {
  const v = token((nombres ?? "").trim().split(/\s+/)[0] ?? "");
  return v ? v : null;
}

/** Primer apellido; une partículas (DE LA CRUZ -> delacruz). */
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

/** Dígito verificador RUT chileno (módulo 11). */
function dvRut(cuerpo: string): string {
  let suma = 0;
  let mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (suma % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

/** 4 dígitos antes del verificador. Puntos se ignoran; comas/espacios se rechazan.
 *  RUT de 7–8 dígitos: el verificador debe coincidir. Cuerpo de 9 dígitos (100.xxx.xxx provisorios): sin validar DV. */
function rut4(doc: string | null | undefined): { ok: true; r4: string } | { ok: false; error: string } {
  if (!doc) return { ok: false, error: "sin RUT" };
  const limpio = doc.trim().toUpperCase().replace(/\./g, "");
  const m = /^(\d{7,9})-([0-9K])$/.exec(limpio);
  if (!m) return { ok: false, error: `RUT con formato inválido (${doc})` };
  const [, cuerpo, dv] = m;
  if (cuerpo.length <= 8 && dvRut(cuerpo) !== dv) {
    return { ok: false, error: `RUT con verificador incorrecto (${doc}; debería terminar en -${dvRut(cuerpo)})` };
  }
  return { ok: true, r4: cuerpo.slice(-4) };
}

export function emailEsperado(
  p: { nombres: string; apellidos: string; numero_documento: string | null },
  dominio: string = DOMINIO_DEFAULT
): { ok: true; email: string } | { ok: false; error: string } {
  const nom = primerNombre(p.nombres);
  if (!nom) return { ok: false, error: `nombre no transliterable (${p.nombres})` };
  const ape = primerApellido(p.apellidos);
  if (!ape) return { ok: false, error: `apellido no transliterable (${p.apellidos})` };
  const r = rut4(p.numero_documento);
  if (!r.ok) return r;
  return { ok: true, email: `${nom}.${ape}${r.r4}${dominio}` };
}

/* ============================================================================
 * Registro masivo
 * ========================================================================== */

export async function procesarRegistroMasivo(
  supabaseAdminClient: SupabaseClient,
  usuarios: unknown[],
  claveUniversal: string,
  opciones: OpcionesRegistroMasivo = {}
) {
  const estricto = opciones.estricto ?? process.env.REGISTRO_MASIVO_ESTRICTO === "true";
  const dominio = opciones.dominio ?? DOMINIO_DEFAULT;
  if (estricto) console.log(`🔒 Registro masivo en modo ESTRICTO (${dominio}, nomenclatura verificada)`);

  const exitosos: any[] = [];
  const fallidos: any[] = [];

  const entradas = usuarios.map((usuario) => {
    const email =
      typeof usuario === "string"
        ? usuario
        : usuario && typeof usuario === "object" && "email" in usuario
          ? String((usuario as { email: unknown }).email ?? "")
          : "";
    return {
      original: email,
      email: estricto ? email.trim().toLowerCase() : limpiarEmail(email),
    };
  });

  // En estricto se detectan repetidos de forma explícita
  const vistos = new Set<string>();
  const repetidos = new Set<number>();
  if (estricto) {
    entradas.forEach((e, i) => {
      if (!e.email) return;
      if (vistos.has(e.email)) repetidos.add(i);
      else vistos.add(e.email);
    });
  }

  const emails = [...new Set(entradas.map(({ email }) => email).filter(Boolean))];

  const { data: usuariosEncontrados, error: usuariosError } = emails.length
    ? await supabaseAdminClient
        .from("usuarios")
        .select("email,auth_id,persona_id")
        .in("email", emails)
    : { data: [], error: null };

  if (usuariosError) {
    throw new Error(`Error consultando usuarios: ${usuariosError.message}`);
  }

  const userMap = new Map(
    (usuariosEncontrados || []).map((usuario: any) => [
      limpiarEmail(usuario.email),
      usuario,
    ])
  );

  // Estricto: filas por correo (para detectar duplicados) y personas para la nomenclatura
  const filasPorEmail = new Map<string, number>();
  const personaMap = new Map<number, any>();
  if (estricto) {
    for (const f of usuariosEncontrados || []) {
      const k = String(f.email).trim().toLowerCase();
      filasPorEmail.set(k, (filasPorEmail.get(k) ?? 0) + 1);
    }
    const personaIds = [...new Set((usuariosEncontrados || []).map((f: any) => f.persona_id).filter(Boolean))];
    if (personaIds.length) {
      const { data: personas, error: ePe } = await supabaseAdminClient
        .from("personas")
        .select("persona_id,nombres,apellidos,numero_documento")
        .in("persona_id", personaIds);
      if (ePe) throw new Error(`Error consultando personas: ${ePe.message}`);
      for (const p of personas || []) personaMap.set(p.persona_id, p);
    }
  }

  // Auth: se lee completo UNA sola vez (no una vez por correo)
  let authCache: { porEmail: Map<string, User>; porId: Map<string, User> } | null = null;
  const cargarAuth = async () => {
    if (authCache) return authCache;
    const porEmail = new Map<string, User>();
    const porId = new Map<string, User>();
    for (let page = 1; ; page += 1) {
      const { data, error } = await supabaseAdminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`Error listando usuarios Auth: ${error.message}`);
      for (const u of data.users) {
        porId.set(u.id, u);
        if (u.email) porEmail.set(u.email.toLowerCase(), u);
      }
      if (data.users.length < 1000) break;
    }
    authCache = { porEmail, porId };
    return authCache;
  };

  // Se procesa de a uno (sin ráfagas contra la API de Auth)
  for (let i = 0; i < entradas.length; i++) {
    const { original, email } = entradas[i];
    try {
      if (estricto) {
        if (!email || !EMAIL_ASCII.test(email)) {
          throw { email: original || "desconocido", error: "Email inválido (solo a-z, 0-9, punto, guion; sin tildes ni ñ)." };
        }
        if (!email.endsWith(dominio)) {
          throw { email, error: `El correo debe terminar en ${dominio}.` };
        }
        if (repetidos.has(i)) {
          throw { email, error: "Repetido en la lista." };
        }
      } else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw { email: original || "desconocido", error: "Email inválido." };
      }

      const userExist = userMap.get(email);
      if (!userExist) {
        throw {
          email,
          error: "El usuario no existe en la tabla usuarios; debe estar registrado antes.",
        };
      }

      if (estricto) {
        const n = filasPorEmail.get(email) ?? 0;
        if (n > 1) throw { email, error: `Hay ${n} filas en usuarios con este correo; resolver antes.` };
        const persona = personaMap.get((userExist as any).persona_id);
        if (!persona) throw { email, error: `Sin persona asociada (persona_id ${(userExist as any).persona_id}).` };
        const esp = emailEsperado(persona, dominio);
        if (!esp.ok) throw { email, error: `No se puede verificar la nomenclatura: ${esp.error}` };
        if (esp.email !== email) throw { email, error: `No cumple la nomenclatura. Esperado: ${esp.email}` };
      }

      let authId: string | null = (userExist as any).auth_id ?? null;
      let status = "password actualizada";

      if (authId) {
        if (estricto) {
          const cuenta = (await cargarAuth()).porId.get(authId);
          if (!cuenta) throw { email, error: `auth_id ${authId} no existe en Auth.` };
          if ((cuenta.email ?? "").toLowerCase() !== email) {
            throw { email, error: `auth_id apunta a otra cuenta de Auth (${cuenta.email}). No se toca.` };
          }
        }
        await actualizarPasswordAuth(supabaseAdminClient, authId, claveUniversal);
      } else {
        const authUser = (await cargarAuth()).porEmail.get(email.toLowerCase()) ?? null;
        if (authUser) {
          authId = authUser.id;
          await actualizarPasswordAuth(supabaseAdminClient, authId, claveUniversal);
          status = "password actualizada y usuario vinculado";
          await actualizarUsuario(supabaseAdminClient, email, authId);
        } else {
          const newUser = await crearUsuarioAuth(supabaseAdminClient, email, claveUniversal);
          const nuevoId: string = newUser.user.id;
          authId = nuevoId;
          status = "usuario creado y vinculado";
          try {
            await actualizarUsuario(supabaseAdminClient, email, nuevoId);
          } catch (e) {
            // no dejar una cuenta de Auth huérfana si falla el vínculo
            await supabaseAdminClient.auth.admin.deleteUser(nuevoId);
            throw e;
          }
        }
      }

      exitosos.push({ email, id: authId, status });
    } catch (err: any) {
      fallidos.push({
        email: err?.email || email || original || "desconocido",
        status: "fallido",
        error: err?.error || err?.message || "Error interno",
      });
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Exitosos: ${exitosos.length}`);
  console.log(`   ❌ Fallidos: ${fallidos.length}`);

  return { exitosos, fallidos };
}

// ✅ Actualizar password en auth
async function actualizarPasswordAuth(
  supabaseAdminClient: SupabaseClient,
  userId: string,
  newPassword: string
) {
  const { data, error } = await supabaseAdminClient.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    throw new Error(`Error actualizando password: ${error.message}`);
  }

  console.log(`✅ Password actualizada para UID: ${userId}`);
  return data;
}

// ✅ Crear usuario en auth (export conservado: otros módulos pueden importarlo)
export async function crearUsuarioAuth(
  supabaseAdminClient: SupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabaseAdminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Error creando auth user: ${error.message}`);
  }

  if (!data?.user?.id) {
    throw new Error("Auth user creado pero sin ID válido");
  }

  console.log(`✅ Auth user creado: ${data.user.id}`);
  return data;
}

// ✅ Actualizar auth_id en tabla usuarios
async function actualizarUsuario(
  supabaseAdminClient: SupabaseClient,
  email: string,
  authId: string
) {
  const { data, error } = await supabaseAdminClient
    .from("usuarios")
    .update({ auth_id: authId })
    .eq("email", email)
    .select()
    .single();

  if (error) {
    throw new Error(`Error actualizando usuario ${email}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No se encontró usuario con email: ${email}`);
  }

  console.log(`✅ Usuario vinculado: ${email} → ${authId}`);
  return data;
}