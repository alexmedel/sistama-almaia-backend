import { Request, Response } from "express";
import { RecaptchaService } from "./RecaptchaService";

export const RecaptchaController = {
  async verify(req: Request, res: Response): Promise<void> {
    const captcha = String(req.body?.captcha ?? req.body?.token ?? "");
    const result = await RecaptchaService.verifyToken(captcha, req.ip);

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result["error-codes"] ?? [],
      });
      return;
    }

    res.status(200).json({
      success: true,
      score: result.score,
      action: result.action,
    });
  },
};
