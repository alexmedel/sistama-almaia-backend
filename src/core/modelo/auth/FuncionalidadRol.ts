import { BaseModel } from "../BaseModel";
import { Funcionalidad } from "./Funcionalidad";

export class FuncionalidadRol extends BaseModel {
    funcionalidad_rol?: number;
    funcionalidad_id: number;
    rol_id: number;
    funcionalidades?:Funcionalidad
    constructor(){
        super();
        this.funcionalidad_id = 0;
        this.rol_id = 0;
    }
  }