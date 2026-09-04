import { SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";

export const saveSilgleFile = async (
  client: SupabaseClient,
  req: Request,
  bucketName: string,
  folder: string
) => {
  // 1. Validar que el archivo exista en el request
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const file = req.file ?? files?.[folder]?.[0];

  if (!file) {
    console.error("No se encontró ningún archivo en la solicitud (req.file).");
    return null;
  }

  // Se reemplazan espacios en el nombre para evitar problemas en la URL
  const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
  const filePath = `${folder}/${fileName}`;

  // 2. Subir el archivo al bucket de Supabase
  const { error: uploadError } = await client.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    console.error(`Error al subir el archivo:`, uploadError.message);
    console.log(uploadError)
    return null;
  }

  // 3. Obtener la URL pública del archivo recién subido
  const { data: publicUrlData } = client.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData?.publicUrl ?? null;
};

export const saveFile = async (
  client: SupabaseClient,
  req: Request,
  fieldName: string,
  folder: string
): Promise<string | null> => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  // Validar que exista el campo con archivo
  if (!files?.[fieldName] || files[fieldName].length === 0) {
    return null;
  }

  const file = files[fieldName][0];
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = `${folder}/${fileName}`;

  // Subir archivo
  const { error: uploadError } = await client.storage
    .from("alumnos_alertas")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    console.error(`Error al subir ${fieldName}:`, uploadError.message);
    return null;
  }

  // Obtener URL pública
  const { data: publicUrlData } = client.storage
    .from("alumnos_alertas")
    .getPublicUrl(filePath);

  return publicUrlData?.publicUrl ?? null;
};

export const saveImage = (
  client: SupabaseClient,
  req: Request
): Promise<string | null> => saveFile(client, req, "url_image", "images");

export const saveAudio = (
  client: SupabaseClient,
  req: Request
): Promise<string | null> => saveFile(client, req, "url_audio", "audios");
