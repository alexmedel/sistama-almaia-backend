 
export type SelectFields = string  ;

export interface GenericFilterOptions {
  tableFilter: string;       // Tabla para filtrar (ej: "apoderados")
  filterField: string;       // Campo para filtrar con `.eq` (ej: "colegio_id")
  filterValue: any;          // Valor para filtrar (ej: colegio_id)
  idField: string;           // Campo para extraer los IDs (ej: "apoderado_id")
  tableIn: string;           // Tabla para filtrar con `.in` (ej: "alumnos_apoderados")
  inField: string;           // Campo para filtrar con `.in` (ej: "apoderado_id")
  selectFields: SelectFields; // Campos para `.select()` en la consulta `.in`
  priorityFilter?: string;   // Campo para filtrar con `.eq` (ej: "prioridad_id")
  where? : whereType,
  dateFilter?: string ,
 fecha?: string
}

interface whereType{
  dateFilter?: DateFilter,
  selectedDate?: string,
  alumno_alerta_id?: number;
  alumno_id?: number;
  alerta_regla_id?: number | null;
  fecha_generada?: string;
  fecha_resolucion?: string | null;
  alerta_origen_id?: number;
  prioridad_id?: number;
  severidad_id?: number;
  accion_tomada?: string | null;
  leida?: boolean;
  responsable_actual_id?: number;
  estado?: string;
  creado_por?: number;
  actualizado_por?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  activo?: boolean;
  alertas_tipo_alerta_tipo_id?: number;
  mensaje?: string;
  anonimo?: boolean;
  tipo_concepto?: string | null;
  url_image?: string | null;
  url_audio?: string | null;
  fecha?: string;
}

export enum DateFilter {
  TODOS = "Todos",
  HOY = "Hoy",
  HASTA = "Hasta",
  DESDE = "Desde",
}