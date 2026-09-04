export interface CrearAvisoInput {
  avisoTiposId: number;
  tipoObjetivo: "alumno" | "curso" | "grado" | "colegio";
  dirigidoA: "alumno" | "apoderado";
  ids: number[];
  titulo: string;
  contenido: string;
  fechaProgramacion: string;
  rutaArchivo: string | null;
}