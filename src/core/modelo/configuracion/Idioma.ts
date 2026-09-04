import { BaseModel } from "../BaseModel";

export class Idioma extends BaseModel {
  idioma_id: number;
  nombre: string;
  descripcion: string;
  url_foto_bandera: string;
  constructor() {
    super();
    this.idioma_id = 0;
    this.nombre = "";
    this.descripcion = "";
    this.url_foto_bandera = "";
  }
}
