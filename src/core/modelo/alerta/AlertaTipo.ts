import { BaseModel } from "../BaseModel";

export class AlertaTipo extends BaseModel {
    alerta_tipo_id: number;
    nombre: string;
    constructor(){
        super();
        this.alerta_tipo_id = 0;
        this.nombre = "";
    }
  
  }