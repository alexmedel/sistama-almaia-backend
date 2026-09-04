import { BaseModel } from "./BaseModel";

export class MedioComunicacion extends BaseModel {
    medio_comunicacion_id: number;
    nombre: string;
    constructor(){
        super();
        this.medio_comunicacion_id = 0;
        this.nombre = "";
    }
  }