import { RequestHandler } from "express";
import morgan from "morgan";

const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "contrasena",
  "contraseña",
  "contrasena_sol",
  "refresh_token",
  "access_token",
  "token",
  "authorization",
  "recaptchaToken",
  "recaptcha_token",
  "captchaToken",
  "captchaKey",
  "captchaText",
  "sessionId",
  "secret",
  "client_secret",
  "service_role",
]);

const QUIET_LOG_PATHS = new Set([
  "/",
  "/documentacion",
  "/documentacion/",
]);

export const shouldSkipRequestLog = (url?: string): boolean => {
  if (!url) return false;
  const [path] = url.split("?");
  return QUIET_LOG_PATHS.has(path);
};

const redactSensitiveData = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? "[REDACTED]" : redactSensitiveData(nestedValue),
      ])
    );
  }

  return value;
};

export const httpAccessLogger = () =>
  morgan("dev", {
    skip: (req: any) => shouldSkipRequestLog(req.originalUrl || req.url),
  });

export const requestPayloadLogger = (): RequestHandler => {
  return (req, _res, next) => {
    if (!shouldSkipRequestLog(req.originalUrl || req.url)) {
      console.log(`\nINCOMING REQUEST: ${req.method} ${req.url}`);

      if (req.method !== "GET") {
        console.log("Body:", JSON.stringify(redactSensitiveData(req.body), null, 2));
      }
    }

    next();
  };
};
