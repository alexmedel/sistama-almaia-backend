import { BaseModel } from "../BaseModel";

export class NivelEducativo extends BaseModel {
    nivel_educativo_id?: number;
    nombre: string;
    constructor(){
        super();
        this.nombre = "";
    }
  }