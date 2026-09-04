// BaseModel.ts
export class BaseModel {
    creado_por: number;
    actualizado_por: number;
    fecha_creacion: string;
    fecha_actualizacion: string;
    activo: boolean;
     constructor() {
        this.creado_por = 0;
        this.actualizado_por = 0;
        this.fecha_creacion = new Date().toISOString();
        this.fecha_actualizacion = new Date().toISOString();
        this.activo = true;
  }
}