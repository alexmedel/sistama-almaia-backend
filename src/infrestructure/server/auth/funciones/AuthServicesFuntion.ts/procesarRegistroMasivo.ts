import { SupabaseClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import { limpiarEmail } from "../funtions";

type ValorRegistroMasivo = string | number | boolean | null;

function normalizarValorCelda(value: ExcelJS.CellValue): ValorRegistroMasivo {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("result" in value) {
      return value.result as string | number | boolean | null;
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((fragment) => fragment.text).join("");
    }

    if ("hyperlink" in value) {
      return value.text || value.hyperlink;
    }
  }

  return value as string | number | boolean;
}

function obtenerValoresFila(row: ExcelJS.Row): ExcelJS.CellValue[] {
  if (Array.isArray(row.values)) {
    return row.values.slice(1) as ExcelJS.CellValue[];
  }

  return Object.values(row.values);
}

function valorComoTexto(value: ValorRegistroMasivo): string {
  if (value === null) {
    return "";
  }

  return String(value);
}

function limpiarEmailDesdeCelda(value: ValorRegistroMasivo): string {
  return limpiarEmail(valorComoTexto(value));
}

async function leerFilasDesdeExcel(fileBuffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("El archivo Excel no contiene hojas para procesar");
  }

  const encabezados = obtenerValoresFila(worksheet.getRow(1)).map((header) =>
    String(normalizarValorCelda(header) ?? "").trim()
  );

  if (!encabezados.length || encabezados.every((header) => !header)) {
    throw new Error("El archivo Excel no contiene encabezados válidos");
  }

  const rows: Record<string, ValorRegistroMasivo>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = obtenerValoresFila(row);
    const parsedRow: Record<string, ValorRegistroMasivo> = {};
    let tieneContenido = false;

    encabezados.forEach((header, index) => {
      if (!header) {
        return;
      }

      const valor = normalizarValorCelda(values[index]);
      parsedRow[header] = valor;
      if (valor !== null && valor !== "") {
        tieneContenido = true;
      }
    });

    if (tieneContenido) {
      rows.push(parsedRow);
    }
  });

  return rows;
}

export async function procesarRegistroMasivo(
  supabaseAdminClient: SupabaseClient,
  fileBuffer: Buffer
)  {
  const rows = await leerFilasDesdeExcel(fileBuffer);
  const exitosos: any[] = [];
  const fallidos: any[] = [];

  // Procesar emails del archivo
  const emails = rows
    .map((r) => limpiarEmailDesdeCelda(r.email))
    .filter((e) => !!e);
  
  console.log("📧 Emails procesados:", emails);

  // ✅ Buscar en tabla usuarios
  const { data: usuarios, error: usuariosError } = await supabaseAdminClient
    .from("usuarios")
    .select("*")
    .in("email", emails);

  console.log("👥 Usuarios encontrados en tabla:", usuarios?.length || 0);
  
  if (usuariosError) {
    console.error("❌ Error en usuarios query:", usuariosError);
    throw new Error(`Error consultando usuarios: ${usuariosError.message}`);
  }

  // Indexar usuarios por email
  const userMap = new Map(usuarios?.map((u) => [u.email, u]));

  // ✅ Procesar cada fila
  const results = await Promise.allSettled(
    rows.map(async (row, index) => {
      try {
        const { email, password } = row;
        
        if (!email || !password) {
          throw { email, error: "Campos 'email' y 'password' requeridos." };
        }

        const cleanEmail = limpiarEmailDesdeCelda(email);
        const cleanPassword = valorComoTexto(password);
        const userExist = userMap.get(cleanEmail);
        
        console.log(`\n🔄 Procesando [${index + 1}]: ${cleanEmail}`);
        console.log(`   Usuario en tabla: ${!!userExist}`);
        console.log(`   Tiene auth_id: ${!!userExist?.auth_id}`);

        let userUid: string | null = null;
        let status = "";

        // 🔍 Buscar si ya existe en auth.users
        const authUser = await buscarUsuarioAuth(supabaseAdminClient, cleanEmail);
        console.log(`   Usuario en auth: ${!!authUser}`);

        if (authUser) {
          // ✅ CASO 1: Usuario existe en auth → Actualizar password y vincular
          console.log(`   🔄 Usuario existe en auth con UID: ${authUser.id}`);
          
          await actualizarPasswordAuth(supabaseAdminClient, authUser.id, cleanPassword);
          
          if (userExist) {
            // Actualizar auth_id si existe en tabla usuarios
            await actualizarUsuario(supabaseAdminClient, cleanEmail, authUser.id);
            status = "password actualizada y vinculado";
          } else {
            // Insertar en tabla usuarios si no existe
            await insertarUsuario(supabaseAdminClient, cleanEmail, authUser.id);
            status = "password actualizada y usuario insertado";
          }
          
          userUid = authUser.id;
          
        } else if (userExist && !userExist.auth_id) {
          // ✅ CASO 2: Usuario en tabla pero sin auth_id → Crear en auth y vincular
          console.log(`   ➕ Usuario sin auth_id, creando en auth...`);
          
          const newUser = await crearUsuarioAuth(supabaseAdminClient, cleanEmail, cleanPassword);
          
          if (!newUser?.user?.id) {
            throw { email: cleanEmail, error: "Error al crear usuario en auth" };
          }
          
          await actualizarUsuario(supabaseAdminClient, cleanEmail, newUser.user.id);
          
          userUid = newUser.user.id;
          status = "creado en auth y vinculado";
          
        } else if (!userExist) {
          // ✅ CASO 3: Usuario no existe en ningún lado → Crear completo
          console.log(`   🆕 Usuario no existe, creando completo...`);
          
          const newUser = await crearUsuarioAuth(supabaseAdminClient, cleanEmail, cleanPassword);
          
          if (!newUser?.user?.id) {
            throw { email: cleanEmail, error: "Error al crear usuario en auth" };
          }
          
          await insertarUsuario(supabaseAdminClient, cleanEmail, newUser.user.id);
          
          userUid = newUser.user.id;
          status = "creado completo";
          
        } else if (userExist?.auth_id) {
          // ✅ CASO 4: Usuario ya tiene auth_id → Solo actualizar password
          console.log(`   🔄 Actualizando password para UID: ${userExist.auth_id}`);
          
          await actualizarPasswordAuth(supabaseAdminClient, userExist.auth_id, cleanPassword);
          
          userUid = userExist.auth_id;
          status = "password actualizada";
        }

        console.log(`   ✅ Resultado: UID=${userUid}, Status=${status}`);
        
        if (!userUid) {
          throw { email: cleanEmail, error: "No se pudo obtener UID del usuario" };
        }

        return { email: cleanEmail, id: userUid, status };
        
      } catch (error) {
        console.error(`   ❌ Error procesando ${row.email}:`, error);
        throw error;
      }
    })
  );

  // Recolectar resultados
  for (const res of results) {
    if (res.status === "fulfilled") {
      exitosos.push(res.value);
    } else {
      const err = res.reason;
      fallidos.push({
        email: err?.email || "desconocido",
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

// 🆕 Nueva función para buscar usuario en auth
async function buscarUsuarioAuth(
  supabaseAdminClient: SupabaseClient,
  email: string
) {
  try {
    const { data, error } = await supabaseAdminClient.auth.admin.listUsers();
    
    if (error) {
      console.error(`❌ Error listando usuarios auth:`, error);
      return null;
    }
    
    // Buscar por email
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return user || null;
    
  } catch (error) {
    console.error(`❌ Error en buscarUsuarioAuth:`, error);
    return null;
  }
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

// ✅ Crear usuario en auth
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
    throw new Error('Auth user creado pero sin ID válido');
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

// ✅ Insertar nuevo usuario en tabla
async function insertarUsuario(
  supabaseAdminClient: SupabaseClient,
  email: string,
  authId: string
) {
  const { data, error } = await supabaseAdminClient
    .from("usuarios")
    .insert([{ email, auth_id: authId }])
    .select()
    .single();
    
  if (error) {
    throw new Error(`Error insertando usuario ${email}: ${error.message}`);
  }
  
  if (!data) {
    throw new Error(`Usuario ${email} no se insertó correctamente`);
  }
  
  console.log(`✅ Usuario insertado: ${email} → ${authId}`);
  return data;
}
