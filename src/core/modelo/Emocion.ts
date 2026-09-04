import { BaseModel } from "./BaseModel";

export class Emocion extends BaseModel {
    emocion_id: number;
    nombre: string;
    descripcion: string;
    conotacion: string;
    constructor(){
        super();
        this.emocion_id = 0;
        this.nombre = "";
        this.descripcion = "";
        this.conotacion = "";
    }
  }