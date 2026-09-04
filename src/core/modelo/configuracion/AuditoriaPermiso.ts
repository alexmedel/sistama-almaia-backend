import { BaseModel } from "../BaseModel";

export class AuditoriaPermiso extends BaseModel {
    auditoria_permiso_id?: number;
    auditoria_id: number;
    nombre_permiso: string;
    constructor(){
        super();
        this.auditoria_id = 0;
        this.nombre_permiso = "";
    }
  }