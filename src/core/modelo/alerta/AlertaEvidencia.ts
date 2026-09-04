import { BaseModel } from "../BaseModel";

export class AlertaEvidencia extends BaseModel {
    alerta_evidencia_id?: number;
    url_evidencia: string;
    alumno_alerta_id: number;
    constructor(){
        super();
        this.url_evidencia = '';
        this.alumno_alerta_id = 0;
    }
  }