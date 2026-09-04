import { BaseModel } from "../BaseModel";

export class Colegio extends BaseModel {
    colegio_id?: number;
    nombre: string;
    nombre_fantasia: string;
    tipo_colegio: string;
    dependencia?: string;
    sitio_web?: string;
    direccion: string;
    telefono_contacto: string;
    correo_electronico: string;
    comuna_id: number;
    region_id: number;
    pais_id: number;
    correo_sos: string;
    correo_denuncia: string;
    constructor(){
        super();
        this.colegio_id = 0;
        this.nombre = "";
        this.nombre_fantasia = "";
        this.tipo_colegio = "";
        this.dependencia = "";
        this.sitio_web = "";
        this.direccion = "";
        this.telefono_contacto = "";
        this.correo_electronico = "";
        this.comuna_id = 0;
        this.region_id = 0;
        this.pais_id = 0;
        this.correo_sos = "";
        this.correo_denuncia = "";
    }
  }