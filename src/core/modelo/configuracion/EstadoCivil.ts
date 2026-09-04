import { BaseModel } from "../BaseModel";

export class EstadoCivil extends BaseModel {
    estado_civil_id: number;
    nombre: string;
    constructor() {
        super();
        this.estado_civil_id = 0;
        this.nombre = "";
    }
  }