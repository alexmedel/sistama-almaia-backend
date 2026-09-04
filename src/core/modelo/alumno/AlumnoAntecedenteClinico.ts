import { BaseModel } from "../BaseModel";

export class AlumnoAntecedenteClinico extends BaseModel {
    alumno_ant_clinico_id?: number;
    alumno_id: number;
    historial_medico?: string;
    alergias?: string;
    enfermedades_cronicas?: string;
    condiciones_medicas_relevantes?: string;
    medicamentos_actuales?: string;
    diagnosticos_previos?: string;
    terapias_tratamiento_curso?: string;
    constructor(){
        super();
        this.alumno_id = 0;
        this.historial_medico = '';
        this.alergias = '';
        this.enfermedades_cronicas = '';
        this.condiciones_medicas_relevantes = '';
        this.medicamentos_actuales = '';
        this.diagnosticos_previos = '';
        this.terapias_tratamiento_curso = '';
    }
  }