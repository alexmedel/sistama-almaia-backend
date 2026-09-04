import { errorHandler } from "../../helpers/ErrorResponse";
import { FormatResponse } from "../../helpers/Response";
import { STATUS_CODES } from "../../infrestructure/server/avisos/types/types";
import { BeneficiosService } from "../services/beneficios/beneficios.service";
import { Request, Response } from "express";

export class BeneficiosController {
  private beneficiosService: BeneficiosService;

  constructor() {
    this.beneficiosService = new BeneficiosService();
  }

  async getBeneficios(req: Request, res: Response) {
    try {
      const data = await this.beneficiosService.getBeneficios();
      FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "BeneficiosService.get");
    }
  }
  async getBeneficiosPorId(req: Request, res: Response) {
    try {
      const { beneficio_id } = req.params;
      const data = await this.beneficiosService.getBeneficiosPorId(
        Number(beneficio_id)
      );
      FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "BeneficiosService.get");
    }
  }

  async beneficiosClick(req: Request, res: Response) {
    try {
      const data = await this.beneficiosService.clickBeneficio(req.body);
      FormatResponse(res, STATUS_CODES.OK, data);
    } catch (error) {
      errorHandler.handleError(error, res, "BeneficiosService.get");
    }
  }
}
