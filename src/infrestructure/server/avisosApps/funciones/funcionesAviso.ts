import { SupabaseClient } from "@supabase/supabase-js";
import { AvisoPendiente } from "../interfaces/avisos_pendientes";
import { CrearAvisoInput } from "../interfaces/crear_avisos_int";

export async function obtenerNotificacionesPendientes(
  client: SupabaseClient
): Promise<AvisoPendiente[]> {

  const { data, error } = await client.rpc("obtener_notificaciones_pendientes");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function crearAvisoApp(
  client: SupabaseClient,
  payload: CrearAvisoInput
): Promise<number> {
  const { data, error } = await client.rpc("crear_aviso_app", {
    p_aviso_tipos_id: payload.avisoTiposId,
    p_tipo_objetivo: payload.tipoObjetivo,
    p_dirigido_a: payload.dirigidoA,
    p_ids: payload.ids,
    p_titulo: payload.titulo,
    p_contenido: payload.contenido,
    p_fecha_programacion: payload.fechaProgramacion,
    p_ruta_archivo: payload.rutaArchivo
  });

  if (error) {
    throw new Error(`error al crear aviso: ${error.message}`);
  }

  return data;
}

export async function subirArchivoSupabase(
  client: SupabaseClient,
  archivo: Express.Multer.File,
  bucketName: string
): Promise<string> {
  // Ensure the bucket exists (idempotent – createBucket is a no-op if it already exists)
  const { error: bucketError } = await client.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
  });

  // Ignore "already exists" errors; throw on anything else
  if (bucketError && !bucketError.message?.includes("already exists")) {
    console.error("[subirArchivoSupabase] Error creating bucket:", bucketError);
    throw new Error(`Error al crear el bucket: ${bucketError.message}`);
  }

  const filePath = `avisos/${Date.now()}_${archivo.originalname}`;
  const { data, error } = await client.storage
    .from(bucketName)
    .upload(filePath, archivo.buffer, { contentType: archivo.mimetype });

  if (error) {
    throw new Error(`Error al subir el archivo: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = client.storage.from(bucketName).getPublicUrl(filePath);
  return publicUrl;
}

export async function insertarAviso(
  client: SupabaseClient,
  aviso: any
): Promise<number> {
  const { data, error } = await client
    .from("avisos_apps")
    .insert({
      aviso_tipos_id: aviso.aviso_tipos_id, 
      aviso_titulo: aviso.titulo,
      aviso_contenido: aviso.descripcion,
      aviso_fecha_programacion: aviso.fecha_programacion,
      aviso_ruta_archivo: aviso.archivo,
    })
    .select("aviso_id")
    .single();

  if (error) {
    throw new Error(`Error al insertar el aviso: ${error.message}`);
  }

  return data.aviso_id;
}

export async function insertarDestinatarios(
  client: SupabaseClient,
  avisoId: number,
  destinatarios: { id: number; tipo: string }[]
): Promise<void> {
  for (const { id: destId, tipo } of destinatarios) {
    const { error } = await client.from("aviso_destinatarios").insert({
      aviso_id: avisoId,
      destinatario_tipo: tipo,
      destinatario_id: destId,
    });

    if (error) {
      throw new Error(`Error al insertar destinatario: ${error.message}`);
    }
  }
}

export async function insertarPalabrasClave(
  client: SupabaseClient,
  avisoId: number,
  palabrasClave: string[]
): Promise<void> {
  for (const palabra of palabrasClave) {
    // Inserta la palabra clave sin upsert ni ON CONFLICT
    const { data, error } = await client
      .from("aviso_palabras_claves")
      .insert({
        nombre_crudo: palabra,
        nombre_normalizado: palabra.toLowerCase(),
      })
      .select("aviso_palabras_claves_id")
      .single();

    if (error) {
      throw new Error(`Error al insertar palabra clave: ${error.message}`);
    }

    const palabraClaveId = data.aviso_palabras_claves_id;

    const { error: palabraError } = await client.from("aviso_palabras").insert({
      aviso_id: avisoId,
      aviso_palabras_claves_id: palabraClaveId,
    });

    if (palabraError) {
      throw new Error(
        `Error al insertar relación de palabra clave: ${palabraError.message}`
      );
    }
  }
}

export async function expandirDestinatarios(
  client: SupabaseClient,
  tipo: string,
  ids: number[] | null
): Promise<{ id: number; tipo: string }[]> {
  if (ids && ids.length > 0) {
    // Si hay destinatarios específicos, delega según el tipo
    switch (tipo) {
      case "colegio":
        return await obtenerDestinatariosPorColegios(client, ids);
      case "grados":
        return await obtenerDestinatariosPorGrados(client, ids);
      default:
        return ids.map((id) => ({ id, tipo })); // Otros tipos (alumnos, apoderados)
    }
  } else {
    // Si no hay destinatarios específicos, delega según el tipo
    switch (tipo) {
      case "alumnos":
        return await obtenerTodosLosAlumnos(client);
      case "apoderados":
        return await obtenerTodosLosApoderados(client);
      case "colegio":
        return await obtenerTodosLosDestinatariosPorColegios(client);
      case "grados":
        return await obtenerTodosLosDestinatariosPorGrados(client);
      default:
        return [];
    }
  }
}

// Función para obtener destinatarios por colegios específicos
async function obtenerDestinatariosPorColegios(
  client: SupabaseClient,
  ids: number[]
): Promise<{ id: number; tipo: string }[]> {
  const { data: alumnosData } = await client
    .from("alumnos")
    .select("alumno_id")
    .in("colegio_id", ids)
    .eq("activo", true);

  const { data: apoderadosData } = await client
    .from("apoderados")
    .select("apoderado_id")
    .in("colegio_id", ids)
    .eq("activo", true);

  const alumnos = (alumnosData || []).map((a) => ({
    id: a.alumno_id,
    tipo: "alumno",
  }));
  const apoderados = (apoderadosData || []).map((a) => ({
    id: a.apoderado_id,
    tipo: "apoderado",
  }));

  return [...alumnos, ...apoderados];
}

// Función para obtener destinatarios por grados específicos
async function obtenerDestinatariosPorGrados(
  client: SupabaseClient,
  ids: number[]
): Promise<{ id: number; tipo: string }[]> {
  const { data: alumnosData } = await client
    .from("alumnos")
    .select("alumno_id")
    .in("grado_id", ids)
    .eq("activo", true);

  return (alumnosData || []).map((a) => ({ id: a.alumno_id, tipo: "alumno" }));
}

// Función para obtener todos los alumnos
async function obtenerTodosLosAlumnos(
  client: SupabaseClient
): Promise<{ id: number; tipo: string }[]> {
  const { data, error } = await client
    .from("alumnos")
    .select("alumno_id")
    .eq("activo", true);
  if (error) throw new Error("Error obteniendo alumnos");
  return (data || []).map((a: { alumno_id: number }) => ({
    id: a.alumno_id,
    tipo: "alumno",
  }));
}

// Función para obtener todos los apoderados
async function obtenerTodosLosApoderados(
  client: SupabaseClient
): Promise<{ id: number; tipo: string }[]> {
  const { data, error } = await client
    .from("apoderados")
    .select("apoderado_id")
    .eq("activo", true);
  if (error) throw new Error("Error obteniendo apoderados");
  return (data || []).map((a: { apoderado_id: number }) => ({
    id: a.apoderado_id,
    tipo: "apoderado",
  }));
}

// Función para obtener todos los destinatarios por colegios
async function obtenerTodosLosDestinatariosPorColegios(
  client: SupabaseClient
): Promise<{ id: number; tipo: string }[]> {
  const { data: colegiosData } = await client
    .from("colegios")
    .select("colegio_id")
    .eq("activo", true);
  const colegioIds = (colegiosData || []).map(
    (c: { colegio_id: number }) => c.colegio_id
  );

  const { data: alumnosData } = await client
    .from("alumnos")
    .select("alumno_id")
    .in("colegio_id", colegioIds)
    .eq("activo", true);

  const { data: apoderadosData } = await client
    .from("apoderados")
    .select("apoderado_id")
    .in("colegio_id", colegioIds)
    .eq("activo", true);

  const alumnos = (alumnosData || []).map((a) => ({
    id: a.alumno_id,
    tipo: "alumno",
  }));
  const apoderados = (apoderadosData || []).map((a) => ({
    id: a.apoderado_id,
    tipo: "apoderado",
  }));

  return [...alumnos, ...apoderados];
}

// Función para obtener todos los destinatarios por grados
async function obtenerTodosLosDestinatariosPorGrados(
  client: SupabaseClient
): Promise<{ id: number; tipo: string }[]> {
  const { data: gradosData } = await client
    .from("grados")
    .select("grado_id")
    .eq("activo", true);
  const gradoIds = (gradosData || []).map(
    (g: { grado_id: number }) => g.grado_id
  );

  const { data: alumnosData } = await client
    .from("alumnos")
    .select("alumno_id")
    .in("grado_id", gradoIds)
    .eq("activo", true);

  return (alumnosData || []).map((a) => ({ id: a.alumno_id, tipo: "alumno" }));
}


export async function marcarAvisoComoLeido(
  client: SupabaseClient,
  avisoDestinatariosId: number,
  usuarioId?: number
): Promise<boolean> {
  if (usuarioId) {
    const { data, error } = await client.rpc("marcar_usuario_notificacion_leida", {
      p_usuario_notificacion_id: avisoDestinatariosId,
      p_usuario_id: usuarioId,
    });

    if (error) {
      throw new Error(`Error al marcar aviso como leído: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await client.rpc("marcar_aviso_leido", {
    p_aviso_destinatarios_id: avisoDestinatariosId,
  });

  if (error) {
    throw new Error(`Error al marcar aviso como leído: ${error.message}`);
  }

  return data;
}

export async function obtenerMisNotificaciones(
  client: SupabaseClient,
  usuarioId: number
): Promise<any[]> {
  const { data, error } = await client.rpc("listar_mis_notificaciones_usuario", {
    p_usuario_id: usuarioId,
  });

  if (error) {
    throw new Error(`Error al listar mis notificaciones: ${error.message}`);
  }

  return data ?? [];
}
