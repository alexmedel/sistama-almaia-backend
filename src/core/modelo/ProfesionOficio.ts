import { BaseModel } from "./BaseModel";

export class ProfesionOficio extends BaseModel {
    profesion_oficio_id: number;
    nombre: string;
    tipo_oficio_id: number;
    constructor(){
        super();
        this.profesion_oficio_id = 0;
        this.nombre = "";
        this.tipo_oficio_id = 0;
    }
  }
  