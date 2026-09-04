import { SupabaseClient } from "@supabase/supabase-js";
import { DataService } from "../../../DataService";
import { Usuario } from "../../../../../core/modelo/auth/Usuario";
import { UsuarioUpdateDataSchema } from "../../sheman/UsuarioSchema";
import {
  extractBase64Info,
  getExtensionFromMime,
  getURL,
  isBase64DataUrl,
} from "../../../../../core/services/ImagenServiceCasoUso";
import { randomUUID } from "crypto";
const dataUsuarioService: DataService<Usuario> = new DataService(
  "usuarios",
  "usuario_id"
);

// Función que actualiza solo los datos del usuario
// export async function actualizarUsuarioService(
//   client: SupabaseClient,
//   usuarioId: number,
//   body: any,
//   metaData: { actualizado_por: number; fecha_creacion: string }
// ) {
//   // 1. Validar solo los campos del usuario

//   const { error: usuarioValidationError, value: usuarioBody } =
//     UsuarioUpdateDataSchema.validate(body);
//   if (usuarioValidationError) {
//     throw new Error(
//       `Error en datos de usuario: ${usuarioValidationError.details[0].message}`
//     );
//   } // 2. Obtener datos existentes del usuario para referencia

//   const { data: dataUsuario, error: errorUsuario } = await client
//     .from("usuarios")
//     .select("*")
//     .eq("usuario_id", usuarioId)
//     .single();
//   if (errorUsuario || !dataUsuario) {
//     throw new Error("El usuario no existe");
//   } // 3. Validar las relaciones (solo si se proporcionan rol_id o idioma_id)
//   if (usuarioBody.rol_id || usuarioBody.idioma_id) {
//     await validateRelations(
//       client,
//       usuarioBody.rol_id || dataUsuario.rol_id,
//       usuarioBody.idioma_id || dataUsuario.idioma_id
//     );
//   } // 4. Procesar la imagen de perfil si es Base64

//   let urlFotoPerfil = usuarioBody.url_foto_perfil;

//   if (urlFotoPerfil && isBase64DataUrl(urlFotoPerfil)) {
//     const { mimeType, base64Data } = extractBase64Info(urlFotoPerfil);
//     const buffer = Buffer.from(base64Data, "base64");
//     const extension = getExtensionFromMime(mimeType);
//     const fileName = `${randomUUID()}.${extension}`;
//     const { error: uploadError } = await client.storage
//       .from("user-profile")
//       .upload(`private/${fileName}`, buffer, {
//         contentType: mimeType,
//         upsert: true,
//       });
//     if (uploadError) throw new Error("Error al subir la imagen");
//     urlFotoPerfil = getURL(client, "user-profile", `private/${fileName}`);
//   } else if (urlFotoPerfil === null) {
//     urlFotoPerfil = null;
//   } else {
//     urlFotoPerfil = dataUsuario.url_foto_perfil;
//   } // 5. Construir y ejecutar la actualización en la tabla 'usuarios'

//   console.log(body);
//   const updatedUsuarioData = {
//     ...body,
//     actualizado_por: metaData.actualizado_por,
//     url_foto_perfil: urlFotoPerfil,
//   };
//   await dataUsuarioService.updateById(usuarioId, updatedUsuarioData); // 6. Devolver el objeto actualizado

//   const { data: dataUsuarioUpdate } = await client
//     .from("usuarios")
//     .select("*")
//     .eq("usuario_id", usuarioId)
//     .single();

//   return dataUsuarioUpdate;
// }
export async function actualizarUsuarioService(
  client: SupabaseClient,
  usuarioId: number,
  body: any,
  metaData: { actualizado_por: number; fecha_creacion: string },
  image: string | null = null
) {
  const usuarioBody = body;
  const { apellidos, nombres, fecha_nacimiento, numero_documento } =
    usuarioBody;

  const { data: dataUsuario, error: errorUsuario } = await client
    .from("usuarios")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();
  if (errorUsuario || !dataUsuario) {
    throw new Error("El usuario no existe");
  }

  if (usuarioBody.rol_id || usuarioBody.idioma_id) {
    await validateRelations(
      client,
      usuarioBody.rol_id || dataUsuario.rol_id,
      usuarioBody.idioma_id || dataUsuario.idioma_id
    );
  }
  await updatePersona(
    client,
    {
      apellidos,
      nombres,
      fecha_nacimiento,
      numero_documento,
    },
    dataUsuario.persona_id
  );
  let urlFotoPerfil = dataUsuario.url_foto_perfil;

  if (image) {
    urlFotoPerfil = image;
  }

  if (usuarioBody.url_foto_perfil === null) {
    urlFotoPerfil = null;
  }

  const updatedUsuarioData: Record<string, unknown> = {
    url_foto_perfil: urlFotoPerfil,
  };

  const usuarioFields = [
    "nombre_social",
    "email",
    "telefono_contacto",
    "rol_id",
    "idioma_id",
  ] as const;

  for (const field of usuarioFields) {
    if (usuarioBody[field] !== undefined) {
      updatedUsuarioData[field] = usuarioBody[field];
    }
  }

  if (metaData.actualizado_por !== undefined) {
    updatedUsuarioData.actualizado_por = metaData.actualizado_por;
  }

  await dataUsuarioService.updateById(usuarioId, {
    ...updatedUsuarioData,
  } as any);

  const emailChanged =
    usuarioBody.email !== undefined && usuarioBody.email !== dataUsuario.email;

  if (emailChanged) {
    const { error: authError } = await client.auth.admin.updateUserById(
      dataUsuario.auth_id,
      { email: usuarioBody.email }
    );

    if (authError) {
      await dataUsuarioService.updateById(usuarioId, {
        email: dataUsuario.email,
      } as any);
      throw new Error("El email ya está siendo utilizado");
    }
  }

  const { data: dataUsuarioUpdate, error: updateError } = await client
    .from("usuarios")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (updateError || !dataUsuarioUpdate) {
    throw new Error("No se pudo obtener el usuario actualizado");
  }

  return dataUsuarioUpdate;
}
// Función auxiliar para validar las relaciones (se mantiene)
async function validateRelations(
  client: SupabaseClient,
  rol_id: number,
  idioma_id: number
) {
  const { data: rol, error: rolError } = await client
    .from("roles")
    .select("*")
    .eq("rol_id", rol_id)
    .single();
  if (rolError || !rol) throw new Error("El rol no existe");

  const { data: idioma, error: idiomaError } = await client
    .from("idiomas")
    .select("*")
    .eq("idioma_id", idioma_id)
    .single();
  if (idiomaError || !idioma) throw new Error("El idioma no existe");
}

async function updatePersona(
  client: SupabaseClient,
  body: any,
  persona_id: number
) {
  // 1. Filtrar los campos relevantes para la tabla 'personas'
  const validPersonaFields: {
    apellidos?: string;
    nombres?: string;
    fecha_nacimiento?: string;
    numero_documento?: string;
  } = {};

  if (body.apellidos !== undefined) {
    validPersonaFields.apellidos = body.apellidos;
  }
  if (body.nombres !== undefined) {
    validPersonaFields.nombres = body.nombres;
  }

  if (body.numero_documento !== undefined) {
    validPersonaFields.numero_documento = body.numero_documento;
  }

  if (body.fecha_nacimiento !== undefined) {
    validPersonaFields.fecha_nacimiento = normalizeBirthDate(
      body.fecha_nacimiento
    );
  }

  if (Object.keys(validPersonaFields).length === 0) {
    return;
  }
   
  // 3. Realizar la actualización con los datos filtrados.
  const { error: personaError } = await client
    .from("personas")
    .update(validPersonaFields)
    .eq("persona_id", persona_id);

  if (personaError) {
    throw new Error(`Error al actualizar la persona: ${personaError.message}`);
  }
}

function normalizeBirthDate(value: string): string {
  const trimmedValue = String(value).trim();
  const localDateMatch = trimmedValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (localDateMatch) {
    const [, day, month, year] = localDateMatch;
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("La fecha de nacimiento no es válida");
  }

  return parsedDate.toISOString().slice(0, 10);
}
