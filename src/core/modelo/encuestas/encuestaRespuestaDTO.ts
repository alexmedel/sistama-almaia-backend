export interface EncuestaRespuestaDTO {
  encuesta_id: number;
  destinatario_id: number;
  tipo_destinatario_id: number;
  items: {
    pregunta_encuesta_id: number;
    tipo_pregunta_id: number;
    opciones?: number[];
    texto?: string;

    // para tipo 4
    sociograma?: {
      alumno_id_destino: number;
      label: string;
    }[];

    alumno_id_origen?: number;
  }[];
}

export interface EncuestaRespuestaListItem {
  encuesta_respuesta_id: number;
  encuesta_id: number;
  destinatario_id: number;
  tipo_destinatario_id: number;
  fecha_respuesta: string;
  items: {
    respuesta_item_id: number;
    pregunta_encuesta_id: number;
    tipo_pregunta_id: number;
    opciones?: { alternativa_id: number; alternativa_texto: string }[];
    texto?: string;
  }[];
}
