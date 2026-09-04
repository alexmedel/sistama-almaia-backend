import { BaseModel } from "../BaseModel";

export class AuditoriaTipo extends BaseModel {
    tipo_auditoria_id: number;
    nombre: string;
    constructor(){
        super();
        this.tipo_auditoria_id = 0;
        this.nombre = "";
    }
  }