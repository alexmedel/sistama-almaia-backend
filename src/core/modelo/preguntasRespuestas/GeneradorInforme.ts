import { BaseModel } from "../BaseModel";

export class GeneradorInforme extends BaseModel {
    generador_informe_id: number;
    pregunta: string;
    tiene_respuesta: boolean;
    texto: string;
    freq_dias: number;
    generador_imforme_ambito_id: number;
    constructor(){
        super();
        this.generador_informe_id = 0;
        this.pregunta = "";
        this.tiene_respuesta = false;
        this.texto = "";
        this.freq_dias = 0;
        this.generador_imforme_ambito_id = 0;
    }
  }