import { BaseModel } from "../BaseModel";

export class Rol extends BaseModel {
    rol_id?: number;
    nombre: string;
    descripcion: string;
    constructor(){
        super();
        this.nombre = "";
        this.descripcion = "";
    }
  }