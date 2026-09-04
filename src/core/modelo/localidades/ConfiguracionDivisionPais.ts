import { BaseModel } from "../BaseModel";

export class ConfiguracionDivisionPais extends BaseModel {
    configuracion_division_pais_id: number;
    pais_id: number;
    configuracion_region_id: number;
    configuracion_comuna_id: number;
    constructor(){
        super();
        this.configuracion_division_pais_id = 0;
        this.pais_id = 0;
        this.configuracion_region_id = 0;
        this.configuracion_comuna_id = 0;
    }
  }