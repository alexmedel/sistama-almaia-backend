import { BaseModel } from "../BaseModel";

export class ConfiguracionComuna extends BaseModel {
    configuracion_comuna_id: number;
    nombre: string;
    constructor(){
        super();
        this.configuracion_comuna_id = 0;
        this.nombre = "";
    }
  }