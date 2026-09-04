import { readFileSync } from "fs";
import { join } from "path";

describe("consentimientos append-only contract", () => {
  it("does not update consentimientos rows from AlumnoService", () => {
    const source = readFileSync(
      join(
        __dirname,
        "..",
        "src",
        "infrestructure",
        "server",
        "alumno",
        "AlumnoService.ts"
      ),
      "utf8"
    );

    expect(source).not.toMatch(/from\(["']consentimientos["']\)\s*[\r\n\s.]+update\(/);
  });
});
