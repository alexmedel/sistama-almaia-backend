export interface HttpErrorResponse {
  status: number;
  body: { message: string };
}

export function mapHttpError(error: unknown): HttpErrorResponse {
  if (error instanceof Error) {
    if (error.message.startsWith("Tipo de archivo no permitido.")) {
      return {
        status: 400,
        body: { message: error.message },
      };
    }
  }

  return {
    status: 500,
    body: { message: "Error interno del servidor" },
  };
}
