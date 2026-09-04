import { BaseModel } from "../BaseModel";

export class AlertaPrioridad extends BaseModel {
    alerta_prioridad_id: number;
    nombre: string;
    constructor(){
        super();
        this.alerta_prioridad_id = 0;
        this.nombre = "";
    }
  }