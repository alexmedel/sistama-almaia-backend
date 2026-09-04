export class Auditoria {
    auditoria_id?: number;
    tipo_auditoria_id: number;
    colegio_id: number;
    fecha: Date;
    usuario_id: number;
    descripcion: string;
    modulo_afectado: string;
    accion_realizada: string;
    ip_origen: string;
    referencia_id: number;
    model: string;
    constructor(){
        this.tipo_auditoria_id = 0;
        this.colegio_id = 0;
        this.fecha = new Date();
        this.usuario_id = 0;
        this.descripcion = "";
        this.modulo_afectado = "";
        this.accion_realizada = "";
        this.ip_origen = "";
        this.referencia_id = 0;
        this.model = "";
    }
  }