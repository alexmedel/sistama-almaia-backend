import { BaseModel } from "../BaseModel";

export class ApoderadoDireccion extends BaseModel {
    apoderado_direccion_id: number;
    apoderado_id: number;
    descripcion: string;
    ubicaciones_mapa: string;
    comuna_id: number;
    region_id: number;
    pais_id: number;
    constructor() {
        super();
        this.apoderado_direccion_id = 0;
        this.apoderado_id = 0;
        this.descripcion = "";
        this.ubicaciones_mapa = "";
        this.comuna_id = 0;
        this.region_id = 0;
        this.pais_id = 0;
    }
  }