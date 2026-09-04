import { BaseModel } from "../BaseModel";

export class Curso extends BaseModel {
  curso_id?: number;
  nombre_curso: string;
  colegio_id: number;
  grado_id: number;
  nivel_educativo_id: number;
  constructor() {
    super();
    this.nombre_curso = "";
    this.colegio_id = 0;
    this.grado_id = 0;
    this.nivel_educativo_id = 0;
  }
}
