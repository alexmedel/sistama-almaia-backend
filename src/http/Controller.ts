import { Request, Response, NextFunction } from "express";

export abstract class BaseController {
  protected sendSuccess(res: Response, data: any, status = 200) {
    res.status(status).json({
      success: true,
      data,
    });
  }

  protected sendError(res: Response, error: any, status = 500) {
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  // Wrapper para manejar errores en métodos async
  protected handleRequest(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch((err) => this.sendError(res, err));
    };
  }
}
