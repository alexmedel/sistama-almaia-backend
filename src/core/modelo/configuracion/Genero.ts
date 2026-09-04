import { BaseModel } from "../BaseModel";

export class Genero extends BaseModel {
    genero_id: number;
    nombre: string;
    constructor(){
        super();
        this.genero_id = 0;
        this.nombre = "";
    }
  }