import { BaseModel } from "../BaseModel";

export class ConfiguracionRegion extends BaseModel {
    configuracion_region_id: number;
    nombre: string;
    constructor(){
        super();
        this.configuracion_region_id = 0;
        this.nombre = "";
    }
  }