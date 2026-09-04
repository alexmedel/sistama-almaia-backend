import { readFileSync } from "fs";
import { join } from "path";

describe("rol_validador routes", () => {
  it("does not require sessionAuth because the app calls it immediately after login", () => {
    const routeFile = readFileSync(
      join(__dirname, "..", "src", "repos", "rol_validador", "validador.route.ts"),
      "utf8"
    );

    expect(routeFile).not.toContain("sessionAuth");
  });
});
