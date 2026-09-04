export const MESSAGES = {
  AVISO_CREATED: "Aviso creado correctamente",
  AVISO_UPDATED: "Aviso actualizado correctamente",
  AVISO_DELETED: "Aviso eliminado correctamente",
  DOCENTE_NOT_FOUND: "El docente especificado no existe",
  INVALID_ID: "ID inválido proporcionado",
} as const;

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export interface AvisoQueryParams {
  colegio_id?: string;
  docente_id?: string;
  estado?: string;
  dirigido?: string;
}

 