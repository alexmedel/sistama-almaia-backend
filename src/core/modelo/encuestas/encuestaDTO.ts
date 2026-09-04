export interface EncuestaDTO {
  general: {
    estado: number;
    titulo: string;
    descripcion: string;
    concepto_id: number;
    tipo_id: number;
    obligatoria: boolean;
  };
  preguntas: {
    titulo: string;
    tipo_id: number;
    posibles_respuestas: {
      titulo: string;
      peso: number;
    }[];
  }[];
  destinatarios: {
    tipo_id: number;
    destinatario_tipo: string;
    objetivo_envio_id: number;
    destinatarios: number[];
  };
  programacion: {
    fecha_inicio: string;
    fecha_fin: string;
    hora_ejecucion: string;
    frecuencia: "diaria" | "semanal" | "mensual"; // personalizada eliminada
    valores_frecuencia?: number[] | null; // semanal: [1..7], mensual: [1..31], diaria: null/omitida
  };
}
