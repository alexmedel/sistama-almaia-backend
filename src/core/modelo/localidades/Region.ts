import { BaseModel } from "../BaseModel";

export class Region extends BaseModel {
    region_id: number;
    nombre: string;
    constructor(){
        super();
        this.region_id = 0;
        this.nombre = '';
    }

  }