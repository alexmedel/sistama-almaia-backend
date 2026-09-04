import { BaseModel } from "./BaseModel";

export class Patologia extends BaseModel {
    patologia_id: number;
    nombre: string;
    descripcion: string;
    constructor(){
        super();
        this.patologia_id = 0;
        this.nombre = "";
        this.descripcion = "";
    }
  }
  
  