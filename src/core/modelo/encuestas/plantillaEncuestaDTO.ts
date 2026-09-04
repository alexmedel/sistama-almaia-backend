export interface PlantillaEncuestaListadoItem {
  plantilla_id: number;
  plantilla_nombre: string;
  plantilla_descripcion: string | null;
  tipo_encuesta_id: number | null;
  concepto_asociado_id: number | null;
  activo: boolean;
  fecha_creacion: string;
}

export interface PlantillaAlternativaDetalle {
  plantilla_alternativa_id: number;
  alternativa_texto: string;
  peso: number | null;
  orden: number;
}

export interface PlantillaPreguntaDetalle {
  plantilla_pregunta_id: number;
  tipo_pregunta_id: number;
  pregunta_texto: string;
  pregunta_orden: number;
  obligatorio: boolean;
  alternativas: PlantillaAlternativaDetalle[];
}

export interface PlantillaEncuestaDetalle {
  plantilla_id: number;
  plantilla_nombre: string;
  plantilla_descripcion: string | null;
  tipo_encuesta_id: number | null;
  concepto_asociado_id: number | null;
  preguntas: PlantillaPreguntaDetalle[];
}
