import { BaseModel } from "../BaseModel";

export class Materia extends BaseModel {
  materia_id?: number;
  colegio_id: number;
  nombre: string;
  codigo: string;
  constructor() {
    super();
    this.colegio_id = 0;
    this.nombre = "";
    this.codigo = "";
  }
}
