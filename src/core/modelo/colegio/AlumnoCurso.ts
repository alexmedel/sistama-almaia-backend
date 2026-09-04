import { BaseModel } from "../BaseModel";

export class AlumnoCurso extends BaseModel {
  alumno_curso_id: number;
  alumno_id: number;
  curso_id: number;
  ano_escolar: number;
  fecha_ingreso: Date;
  fecha_egreso: Date;

  constructor() {
    super();
    this.alumno_curso_id = 0;
    this.alumno_id = 0;
    this.curso_id = 0;
    this.ano_escolar = 0;
    this.fecha_ingreso = new Date();
    this.fecha_egreso = new Date();
  }
}
