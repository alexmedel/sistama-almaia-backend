import { BaseModel } from "../BaseModel";

export class Comuna extends BaseModel {
    comuna_id: number;
    nombre: string;
    region_id: number;
    pais_id: number;
    constructor(){
        super();
        this.comuna_id = 0;
        this.nombre = '';
        this.region_id = 0;
        this.pais_id = 0;
    }
  }