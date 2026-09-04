import { BaseController } from "../../http/Controller";
import { ValidadorService } from "./validator.service";
import { Request, Response } from "express";

export class ValidadorController extends BaseController {
  private readonly validadorService: ValidadorService;
  constructor() {
    super();
    this.validadorService = new ValidadorService();
  }

  async validarApoderado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const apoderado = await this.validadorService.validarApoderado(
        Number(id)
      );
      this.sendSuccess(res, apoderado);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async validarDocente(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const docente = await this.validadorService.validarDocente(Number(id));
      this.sendSuccess(res, docente);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  async validarAlumno(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const alumno = await this.validadorService.validarAlumno(Number(id));
      this.sendSuccess(res, alumno);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
