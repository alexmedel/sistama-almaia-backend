import { BaseModel } from "../BaseModel";

export class GeneradorInformeAmbito extends BaseModel {
    generador_imforme_ambito_id: number;
    nombre: string;
    constructor(){
        super();
        this.generador_imforme_ambito_id = 0;
        this.nombre = "";
    }
  }