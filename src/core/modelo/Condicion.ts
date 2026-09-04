import { BaseModel } from "./BaseModel";

export class Condicion extends BaseModel {
    condicion_id: number;
    nombre: string;
    descripcion: string;
    constructor(){
        super();
        this.condicion_id = 0;
        this.nombre = "";
        this.descripcion = "";
    }
  }