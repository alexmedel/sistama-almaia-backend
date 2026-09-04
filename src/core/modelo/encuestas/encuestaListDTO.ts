// Tipos para listado de encuestas (respuesta para el front) y filtros

export interface ListEncuestasFilters {
  estado_id?: number;
  tipo_id?: number;
  concepto_id?: number;
  obligatoria?: boolean;
  activo?: boolean;
  search?: string;
  frecuencia?: "diaria" | "semanal" | "mensual";
}

export interface EncuestaProgramacionItem {
  fecha_inicio: string;
  fecha_fin: string;
  hora_ejecucion: string;
  frecuencia: string; // diaria | semanal | mensual
  valores_frecuencia: number[] | null;
}

export interface EncuestaAlternativaListItem {
  titulo: string;
  peso: number;
  orden: number;
}

export interface EncuestaPreguntaListItem {
  pregunta_id: number;
  titulo: string;
  tipo_id: number;
  tipo_nombre?: string | null;
  obligatorio: boolean;
  orden: number;
  posibles_respuestas: EncuestaAlternativaListItem[];
}

export interface EncuestaListadoItem {
  encuesta_id: number;
  encuesta_nombre: string;
  encuesta_descripcion: string | null;
  concepto_asociado_id: number | null;
  concepto_asociado_nombre?: string | null;
  tipo_encuesta_id: number | null;
  tipo_encuesta_nombre?: string | null;
  encuesta_estado_id: number | null;
  encuesta_estado_nombre?: string | null;
  encuesta_obligatoria: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  programacion: EncuestaProgramacionItem | null;
  preguntas: EncuestaPreguntaListItem[];
}
