import { BaseModel } from "../BaseModel";

export class UsuarioColegio extends BaseModel {
  usuarios_colegio_id?: number;
  usuario_id: number;
  colegio_id: number;
  rol_id: number;
  fecha_asignacion: string;
  constructor() {
    super();
    this.usuario_id = 0;
    this.colegio_id = 0;
    this.rol_id = 0;
    this.fecha_asignacion = new Date().toISOString();
  }
}
