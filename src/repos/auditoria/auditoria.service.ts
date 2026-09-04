import { TrazabilidadRepository, TrazabilidadType } from "./trazabilidadRepository";

export class AuditoriaService {

  constructor(
    private trazabilidadRepository: TrazabilidadRepository
  ) {}
  async guardarAuditoria(data:TrazabilidadType ) {
    try {
      const result = await this.trazabilidadRepository.MonitorearTrazabilidad(data);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async test(){
    return "hola"
  }
}