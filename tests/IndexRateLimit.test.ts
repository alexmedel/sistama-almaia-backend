import fs from "fs";
import path from "path";

describe("index rate limit mounts", () => {
  it("applies the auth limiter to auth routes", () => {
    const indexSource = fs.readFileSync(
      path.join(__dirname, "../src/index.ts"),
      "utf8"
    );

    expect(indexSource).toMatch(
      /app\.use\(\s*["']\/api\/v1\/auth["']\s*,\s*authLimiter\s*,\s*AuthRoutes\s*\)/
    );
  });
});
