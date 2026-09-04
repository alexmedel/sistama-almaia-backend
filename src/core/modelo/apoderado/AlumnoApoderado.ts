import { BaseModel } from "../BaseModel";

export class AlumnoApoderado extends BaseModel {
  alumno_apoderado_id?: number;
  alumno_id: number;
  apoderado_id: number;
  tipo_apoderado: string;
  observaciones: string;
  estado_usuario: string;
  constructor() {
    super();
    this.alumno_id = 0;
    this.apoderado_id = 0;
    this.tipo_apoderado = "";
    this.observaciones = "";
    this.estado_usuario = "";
  }
}
