export class AlumnoDireccion {
    alumno_direccion_id: number;
    alumnos_alumno_id: number;
    descripcion: string;
    comuna_id: number;
    region_id: number;
    pais_id: number;
    constructor(){
        this.alumno_direccion_id = 0;
        this.alumnos_alumno_id = 0;
        this.descripcion = '';
        this.comuna_id = 0;
        this.region_id = 0;
        this.pais_id = 0;
    }
  }