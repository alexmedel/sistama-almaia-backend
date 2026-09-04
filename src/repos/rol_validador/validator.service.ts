import ValidadorRepository from "./validadorRepository";

export class ValidadorService {
  private readonly validadorRepository: ValidadorRepository;
  constructor() {
    this.validadorRepository = new ValidadorRepository();
  }

  async validarApoderado(id: number) {
    const apoderado = await this.validadorRepository.apoderado(id);
    return apoderado;
  }

  async validarDocente(id: number) {
    const docente = await this.validadorRepository.docente(id);
    return docente;
  }

  async validarAlumno(id: number) {
    const alumno = await this.validadorRepository.alumno(id);
    return alumno;
  }
}
