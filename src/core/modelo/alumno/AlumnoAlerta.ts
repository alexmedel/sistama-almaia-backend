import { BaseModel } from "../BaseModel";

export class AlumnoAlerta extends BaseModel {
  alumno_alerta_id?: number;
  alumno_id: number;
  alerta_regla_id?: number;
  mensaje: string;
  fecha_generada: string;
  // fecha_resolucion: Date;
  alerta_origen_id: number;
  prioridad_id: number;
  severidad_id: number;
  accion_tomada?: string;
  leida: boolean;
  anonimo: boolean;
  responsable_actual_id?: number;
  estado: string;
  alertas_tipo_alerta_tipo_id: number;
  url_image?: string;
  url_audio?: string;
  constructor() {
    super();
    this.alumno_id = 0;
    this.mensaje ="";
    this.fecha_generada = new Date().toISOString();
    // this.fecha_resolucion = new Date();
    this.alerta_origen_id = 0;
    this.prioridad_id = 0;
    this.severidad_id = 0;
    this.leida = false;
    this.anonimo = false;
    this.estado = "";
    this.alertas_tipo_alerta_tipo_id = 0;
    this.url_image = "";
    this.url_audio = "";
  }
}
