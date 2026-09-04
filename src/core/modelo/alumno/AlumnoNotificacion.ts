import { BaseModel } from "../BaseModel";

export class AlumnoNotificacion extends BaseModel {
    alumno_notificacion_id?: number;
    alumno_id: number;
    tipo: string;
    asunto: string;
    cuerpo: string;
    enviada: boolean;
    fecha_envio: Date;
    constructor(){
        super();
        this.alumno_id = 0;
        this.tipo = "";
        this.asunto = "";
        this.cuerpo = "";
        this.enviada = false;
        this.fecha_envio = new Date();
    }
  }