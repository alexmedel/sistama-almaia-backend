import { BaseModel } from "../BaseModel";

export class Aviso extends BaseModel {
    aviso_id?: number;
    docente_id: number;
    mensaje: string;
    dirigido: string;
    fecha_programada: Date;
    estado: string;
    constructor(){
        super();
        this.docente_id = 0;
        this.mensaje = "";
        this.dirigido = "";
        this.fecha_programada = new Date();
        this.estado = "";
    }
  }