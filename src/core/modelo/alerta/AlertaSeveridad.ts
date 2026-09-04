import { BaseModel } from "../BaseModel";

export class AlertaSeveridad extends BaseModel {
    alerta_severidad_id: number;
    nombre: string;
    constructor() {
        super();
        this.alerta_severidad_id = 0;
        this.nombre = "";
    }
  }