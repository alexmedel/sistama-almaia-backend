import { NextFunction, Request, Response } from "express";

const MAX_LOG_LENGTH = Number(process.env.HTTP_DEBUG_MAX_LEN || 2500);

const SENSITIVE_KEYS = new Set([
  "authorization",
  "password",
  "contrasena",
  "contraseña",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "service_role",
  "supabase_key",
]);

function isHttpDebugEnabled(): boolean {
  return process.env.HTTP_DEBUG === "true" || process.env.NODE_ENV !== "production";
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));

  if (value && typeof value === "object") {
    if (Buffer.isBuffer(value)) return `[buffer:${value.length}]`;

    const record = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, currentValue] of Object.entries(record)) {
      const normalizedKey = key.toLowerCase();

      if (SENSITIVE_KEYS.has(normalizedKey)) {
        sanitized[key] = "[redacted]";
        continue;
      }

      sanitized[key] = sanitizeValue(currentValue);
    }

    return sanitized;
  }

  return value;
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(value, (_k, v) => {
      if (v && typeof v === "object") {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    });
  } catch {
    return "[Unserializable]";
  }
}

function truncateSerialized(serialized: string): string {
  if (!serialized || serialized.length <= MAX_LOG_LENGTH) return serialized;
  return `${serialized.slice(0, MAX_LOG_LENGTH)}... [truncated ${serialized.length - MAX_LOG_LENGTH} chars]`;
}

function formatLogValue(value: unknown): string {
  const serialized = safeStringify(value);
  return truncateSerialized(serialized);
}

export function httpDebugMiddleware(request: Request, response: Response, next: NextFunction): void {
  if (!isHttpDebugEnabled()) return next();

  const startedAt = process.hrtime.bigint();
  const originalJson = response.json.bind(response);

  response.json = (body: unknown) => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const file = request.file
      ? {
          name: request.file.originalname,
          type: request.file.mimetype,
          size: request.file.size,
        }
      : undefined;

    const requestInput = {
      query: sanitizeValue(request.query),
      params: sanitizeValue(request.params),
      body: sanitizeValue(request.body),
    };

    const statusIcon = response.statusCode >= 400 ? "ERROR" : "OK";
    const responseBody = sanitizeValue(body);

    // Solo: petición + status + payload (IN/OUT)
    console.log(
      [
        "",
        `--- HTTP ${statusIcon} ${response.statusCode} ${durationMs.toFixed(1)}ms ---`,
        `REQ  ${request.method} ${request.originalUrl}`,
        `IN   ${formatLogValue(requestInput)}`,
        file ? `FILE ${formatLogValue(file)}` : null,
        `OUT  ${formatLogValue(responseBody)}`,
        `--- END ${request.method} ${request.path} ---`,
      ]
        .filter(Boolean)
        .join("\n")
    );

    return originalJson(body);
  };

  next();
}

