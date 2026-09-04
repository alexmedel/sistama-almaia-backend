import { BaseModel } from "../BaseModel";

export class AlertaEstado extends BaseModel {
    alerta_estado_id: number;
    nombre_alerta_estado: string;
    constructor(){
        super();
        this.alerta_estado_id = 0;
        this.nombre_alerta_estado = "";
    }
  
  }