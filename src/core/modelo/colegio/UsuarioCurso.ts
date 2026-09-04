import { BaseModel } from "../BaseModel";

export class UsuarioCurso extends BaseModel {
  usuario_curso_id?: number;
  usuarios_colegio_id: number;
  curso_id: number;
  fecha_asignacion: Date;

  constructor() {
    super();
    this.usuarios_colegio_id = 0;
    this.curso_id = 0;
    this.fecha_asignacion = new Date();
  }
}
