import { NextFunction, Request, Response } from "express";

export function chatgptApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const expectedKey = process.env.CHATGPT_APPS_API_KEY;
  const providedKey = req.get("x-almaia-chatgpt-key");

  if (!expectedKey || providedKey !== expectedKey) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  next();
}
