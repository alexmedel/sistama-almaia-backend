import { BaseModel } from "../BaseModel";

export class AlertaRegla extends BaseModel {
  alerta_regla_id: number;
  nombre: string;
  tipo_emocion: string;
  umbral: string;
  descripcion: string;
  constructor() {
    super();
    this.alerta_regla_id = 0;
    this.nombre = "";
    this.tipo_emocion = "";
    this.umbral = "";
    this.descripcion = "";
  }
}
