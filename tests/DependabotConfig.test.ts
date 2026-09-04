import fs from "fs";
import path from "path";

describe("Dependabot configuration", () => {
  it("points npm updates at package manifests that exist", () => {
    const dependabot = fs.readFileSync(
      path.join(__dirname, "../.github/dependabot.yml"),
      "utf8"
    );

    expect(dependabot).toMatch(/package-ecosystem:\s*npm[\s\S]*directory:\s*"\/"/);
    expect(dependabot).toMatch(
      /package-ecosystem:\s*npm[\s\S]*directory:\s*"\/ui-components"/
    );
    expect(dependabot).not.toContain('directory: "/src"');
  });
});
