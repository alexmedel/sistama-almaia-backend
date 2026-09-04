import { BaseModel } from "../BaseModel";

export class AlumnoRespuesta extends BaseModel {
    alumno_respuesta_id?: number;
    alumno_id: number;
    pregunta_id: number;
    tipo_pregunta_id:number;
    respuesta: string;
    timestamp: Date;
    constructor(){
        super();
        this.alumno_id = 0;
        this.pregunta_id = 0;
        this.respuesta = "";
        this.timestamp = new Date();
        this.tipo_pregunta_id = 0
    }
  }
  