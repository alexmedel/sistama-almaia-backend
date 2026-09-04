import { BaseModel } from "../BaseModel";

export class TipoOficio extends BaseModel {
    tipo_oficio_id: number;
    nombre: string;
    constructor(){
        super();
        this.tipo_oficio_id = 0;
        this.nombre = "";
    }
  }