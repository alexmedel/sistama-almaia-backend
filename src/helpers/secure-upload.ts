import multer from "multer";
import path from "path";

const allowedMimeByExtension: Record<string, readonly string[]> = {
  ".csv": ["text/csv", "application/vnd.ms-excel"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".heic": ["image/heic"],
  ".heif": ["image/heif"],
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".mp3": ["audio/mpeg"],
  ".wav": ["audio/wav", "audio/x-wav"],
  ".ogg": ["audio/ogg"],
  ".m4a": ["audio/mp4", "audio/x-m4a"],
  ".aac": ["audio/aac"],
  ".caf": ["audio/x-caf"],
  ".3gp": ["audio/3gpp", "video/3gpp"],
  ".webm": ["audio/webm", "video/webm"],
  ".mp4": ["audio/mp4", "video/mp4"],
};

export function isAllowedUpload(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = allowedMimeByExtension[ext];
  const isAudioField = file.fieldname === "url_audio";

  if (
    isAudioField &&
    (file.mimetype === "application/octet-stream" ||
      file.mimetype.startsWith("audio/"))
  ) {
    return true;
  }

  return Boolean(allowedMimes?.includes(file.mimetype));
}

export const secureFileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  cb
) => {
  if (!isAllowedUpload(file)) {
    const detail = `field=${file.fieldname} name=${file.originalname} type=${file.mimetype}`;
    console.error(`[UPLOAD REJECTED] ${detail}`);
    return cb(new Error(`Tipo de archivo no permitido. ${detail}`));
  }

  return cb(null, true);
};

export function createSecureMemoryUpload(
  options: Pick<multer.Options, "limits"> = {}
) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: secureFileFilter,
    ...options,
  });
}
