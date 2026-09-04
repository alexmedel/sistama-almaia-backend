import { BaseModel } from "../BaseModel";

export class AlertaOrigen  extends BaseModel {
    alerta_origen_id: number;
    nombre: string;
   
    constructor(){
        super();
        this.alerta_origen_id = 0;
        this.nombre = "";
    }
  }