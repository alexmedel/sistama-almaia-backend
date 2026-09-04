import { BaseModel } from "../BaseModel";

export class Grado extends BaseModel {
  grado_id?: number;
  nivel_educativo_id:number
  nombre: string;
  constructor() {
    super();
    this.nombre = "";
    this.nivel_educativo_id=0;
  }
}
