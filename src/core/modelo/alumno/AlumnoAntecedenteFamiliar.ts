import { BaseModel } from "../BaseModel";

export class AlumnoAntecedenteFamiliar extends BaseModel {
    alumno_ent_familiar?: number;
    alumno_id: number;
    informacion_socio_economica?: string;
    composicion_familiar?: string;
    situacion_laboral_padres?: string;
    recursos_disponibles?: string;
    dinamica_familiar?: string;
    relaciones_familiares?: string;
    apoyo_emocional?: string;
    factores_riesgo?: string;
    observaciones_entrevistador?: string;
    resumen_entrevista?: string;
    impresiones_recomendaciones?: string;
    procesos_pisicoteurapeuticos_adicionales?: string;
    desarrollo_social?: string;
    fecha_inicio_escolaridad?: Date;
    personas_apoya_aprendzaje_alumno?: string;
    higiene_sueno?: string;
    uso_plantillas?: string;
    otros_antecedentes_relevantes?: string;
    constructor(){
        super();
        this.alumno_id = 0;
        this.informacion_socio_economica = '';
        this.composicion_familiar = '';
        this.situacion_laboral_padres = '';
        this.recursos_disponibles = '';
        this.dinamica_familiar = '';
        this.relaciones_familiares = '';
        this.apoyo_emocional = '';
        this.factores_riesgo = '';
        this.observaciones_entrevistador = '';
        this.resumen_entrevista = '';
        this.impresiones_recomendaciones = '';
        this.procesos_pisicoteurapeuticos_adicionales = '';
        this.desarrollo_social = '';
        this.fecha_inicio_escolaridad = new Date();
        this.personas_apoya_aprendzaje_alumno = '';
        this.higiene_sueno = '';
        this.uso_plantillas = '';
        this.otros_antecedentes_relevantes = '';
    }
  }