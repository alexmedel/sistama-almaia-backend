import { Alumno } from "../alumno/Alumno";
import { Persona } from "../Persona";
import { AlertaOrigen } from "./AlertaOrigen";
import { AlertaPrioridad } from "./AlertaPrioridad";
import { AlertaRegla } from "./AlertaRegla";
import { AlertaSeveridad } from "./AlertaSeveridad";
import { AlertaTipo } from "./AlertaTipo";

export interface AlertaMapeada {
  alumno_alerta_id: number;
  alumno_id: number;
  alerta_regla_id: number;
  fecha_generada: string;
  fecha_resolucion: string | null;
  alerta_origen_id: number;
  prioridad_id: number;
  severidad_id: number;
  accion_tomada: string | null;
  leida: boolean;
  persona_responsable_actual: Persona;
  estado: string;
  creado_por: number;
  actualizado_por: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  alertas_tipo_alerta_tipo_id: number;
  alumnos: Alumno;
  alertas_reglas: AlertaRegla;
  alertas_origenes: AlertaOrigen;
  alertas_severidades: AlertaSeveridad;
  alertas_prioridades: AlertaPrioridad;
  alertas_tipos: AlertaTipo;
}