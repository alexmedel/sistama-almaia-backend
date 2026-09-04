import { NextFunction, Request, Response } from "express";

const morganMock: jest.Mock = jest.fn(() => "morgan-handler");

jest.mock("morgan", () => ({
  __esModule: true,
  default: (format: unknown, options: unknown) => morganMock(format, options),
}));

describe("request logging middleware", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates morgan access logger with dev format", async () => {
    const { httpAccessLogger } = await import("../src/request-logging.middleware");

    const handler = httpAccessLogger();

    expect(morganMock).toHaveBeenCalledWith(
      "dev",
      expect.objectContaining({
        skip: expect.any(Function),
      })
    );
    expect(handler).toBe("morgan-handler");
  });

  it("logs incoming non-GET body with sensitive fields redacted", async () => {
    const { requestPayloadLogger } = await import("../src/request-logging.middleware");

    const middleware = requestPayloadLogger();
    const req = {
      method: "POST",
      url: "/api/v1/auth/login",
      originalUrl: "/api/v1/auth/login",
      body: {
        email: "user@example.com",
        password: "secret123",
        nested: { token: "abc123" },
      },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(console.log).toHaveBeenCalledWith(
      "\nINCOMING REQUEST: POST /api/v1/auth/login"
    );
    expect(console.log).toHaveBeenCalledWith(
      "Body:",
      expect.stringContaining("\"password\": \"[REDACTED]\"")
    );
    expect(console.log).toHaveBeenCalledWith(
      "Body:",
      expect.stringContaining("\"token\": \"[REDACTED]\"")
    );
    expect(next).toHaveBeenCalled();
  });
});
