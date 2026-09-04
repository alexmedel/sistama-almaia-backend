import fs from "fs";
import path from "path";

describe("CI enforcement", () => {
  it("does not silence test failures in the docker workflow", () => {
    const workflowSource = fs.readFileSync(
      path.join(__dirname, "../.github/workflows/docker.yml"),
      "utf8"
    );

    expect(workflowSource).toContain("run: npm test");
    expect(workflowSource).not.toMatch(/npm test\s*\|\|/);
    expect(workflowSource).not.toContain("Skipping tests");
  });

  it("does not silence lint failures in npm scripts", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
    );

    expect(packageJson.scripts.lint).toBe("eslint . --ext .ts,.js");
  });
});
