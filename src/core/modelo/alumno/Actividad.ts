import { BaseModel } from "../BaseModel";

export class Actividad extends BaseModel {
    actividad_id: number;
    nombre: string;
    constructor(){
        super();
        this.actividad_id = 0;
        this.nombre = "";
    }
  }