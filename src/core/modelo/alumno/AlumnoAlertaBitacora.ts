import { BaseModel } from "../BaseModel";

export class AlumnoAlertaBitacora extends BaseModel {
    alumno_alerta_bitacora_id?: number;
    alumno_alerta_id: number;
    alumno_id: number;
    plan_accion: string;
    fecha_compromiso: Date;
    fecha_realizacion: Date;
    url_archivo: string;
    constructor(){
        super();
        this.alumno_alerta_id = 0;
        this.alumno_id = 0;
        this.plan_accion = "";
        this.fecha_compromiso = new Date();
        this.fecha_realizacion = new Date();
        this.url_archivo = "";
    }
  }