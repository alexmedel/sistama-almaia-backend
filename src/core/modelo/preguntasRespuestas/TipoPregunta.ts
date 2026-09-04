import { BaseModel } from "../BaseModel";

export class TipoPregunta extends BaseModel {
    tipo_pregunta_id: number;
    nombre: string;
    constructor(){
        super();
        this.tipo_pregunta_id = 0;
        this.nombre = "";
    }
  }