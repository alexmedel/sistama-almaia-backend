import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("auth credential hygiene", () => {
  it("does not expose temporary auth seed/reset endpoints or hard-coded passwords", () => {
    const authRoutes = readProjectFile("src/routes/auth.routes.ts");
    const authService = readProjectFile(
      "src/infrestructure/server/auth/AuthService.ts"
    );
    const authCode = `${authRoutes}\n${authService}`;

    expect(authCode).not.toContain("/register-usuario");
    expect(authCode).not.toContain("/seeder");
    expect(authCode).not.toContain("/update-password/test/masivo");
    expect(authCode).not.toContain("/update-password/test/email");
    expect(authCode).not.toContain("actualizarTodasLasContrase");
    expect(authCode).not.toContain("actualizarContrase");
    expect(authCode).not.toContain("temporal_get_alumnos");
    expect(authCode).not.toContain("Almaia2025");
    expect(authCode).not.toMatch(/password\s*:\s*["']12345678["']/);
  });

  it("protects bulk registration with sessionAuth before upload handling", () => {
    const authRoutes = readProjectFile("src/routes/auth.routes.ts");

    expect(authRoutes).toMatch(
      /router\.post\(\s*["']\/registro\/masivo["']\s*,\s*sessionAuth\s*,\s*upload\.single\(["']file["']\)\s*,\s*AuthService\.registerMasivo\s*\)/
    );
  });
});
