import { BaseModel } from "../BaseModel";

export class Funcionalidad extends BaseModel {
    funcionalidad_id: number;
    nombre: string;
    descripcion: string;
    constructor(){
        super();
        this.funcionalidad_id = 0;
        this.nombre = "";
        this.descripcion = "";
    }
  }