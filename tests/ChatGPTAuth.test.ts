import fs from "fs";
import path from "path";
import { chatgptApiKeyAuth } from "../src/middleware/chatgptAuth";

describe("chatgptApiKeyAuth", () => {
  const originalKey = process.env.CHATGPT_APPS_API_KEY;

  afterEach(() => {
    process.env.CHATGPT_APPS_API_KEY = originalKey;
    jest.restoreAllMocks();
  });

  function createResponse() {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res;
  }

  it("rejects requests without the shared ChatGPT Apps API key", () => {
    process.env.CHATGPT_APPS_API_KEY = "expected-key";
    const req: any = { get: jest.fn().mockReturnValue(undefined) };
    const res = createResponse();
    const next = jest.fn();

    chatgptApiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows requests with the shared ChatGPT Apps API key", () => {
    process.env.CHATGPT_APPS_API_KEY = "expected-key";
    const req: any = {
      get: jest.fn((header: string) =>
        header === "x-almaia-chatgpt-key" ? "expected-key" : undefined
      ),
    };
    const res = createResponse();
    const next = jest.fn();

    chatgptApiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("ChatGPT routes auth", () => {
  it("protects all POST tool routes with chatgptApiKeyAuth", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../src/routes/chatgpt.routes.ts"),
      "utf8"
    );

    [
      "triage_symptom",
      "hydration_plan",
      "posture_breaks",
      "stretches_5min",
    ].forEach((route) => {
      expect(source).toMatch(
        new RegExp(
          `router\\.post\\(\\s*['"]/${route}['"]\\s*,\\s*chatgptApiKeyAuth\\s*,`
        )
      );
    });
  });

  it("allows the ChatGPT Apps API key header through CORS", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../src/index.ts"),
      "utf8"
    );

    expect(source).toContain('"x-almaia-chatgpt-key"');
  });
});
