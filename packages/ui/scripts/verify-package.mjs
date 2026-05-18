import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const root = await import("@moritzbrantner/ui");
assert.equal(typeof root.Button, "function", "root export should include Button");
assert.equal(typeof root.cn, "function", "root export should include cn");
assert.equal(typeof root.UiTheme, "function", "root export should include UiTheme");

const zleek = await import("@moritzbrantner/ui/zleek");
assert.equal(zleek.uiTheme.name, "zleek", "zleek entry should expose zleek uiTheme");
assert.equal(typeof zleek.ZleekTheme, "function", "zleek entry should expose ZleekTheme");

const bobba = await import("@moritzbrantner/ui/bobba");
assert.equal(bobba.uiTheme.name, "bobba", "bobba entry should expose bobba uiTheme");
assert.equal(typeof bobba.BobbaTheme, "function", "bobba entry should expose BobbaTheme");

const atlas = await import("@moritzbrantner/ui/atlas");
assert.equal(atlas.uiTheme.name, "atlas", "atlas entry should expose atlas uiTheme");
assert.equal(typeof atlas.AtlasTheme, "function", "atlas entry should expose AtlasTheme");

const studio = await import("@moritzbrantner/ui/studio");
assert.equal(studio.uiTheme.name, "studio", "studio entry should expose studio uiTheme");
assert.equal(typeof studio.StudioTheme, "function", "studio entry should expose StudioTheme");

const paper = await import("@moritzbrantner/ui/paper");
assert.equal(paper.uiTheme.name, "paper", "paper entry should expose paper uiTheme");
assert.equal(typeof paper.PaperTheme, "function", "paper entry should expose PaperTheme");

const button = await import("@moritzbrantner/ui/components/button");
assert.equal(typeof button.Button, "function", "button subpath should expose Button");

const cn = await import("@moritzbrantner/ui/lib/cn");
assert.equal(typeof cn.cn, "function", "cn subpath should expose cn");

const themes = await import("@moritzbrantner/ui/themes");
assert.equal(themes.themeConfig.zleek.name, "zleek", "themes subpath should expose themeConfig");
assert.equal(themes.themeConfig.bobba.name, "bobba", "themes subpath should expose themeConfig");
assert.equal(themes.themeConfig.atlas.name, "atlas", "themes subpath should expose themeConfig");
assert.equal(themes.themeConfig.studio.name, "studio", "themes subpath should expose themeConfig");
assert.equal(themes.themeConfig.paper.name, "paper", "themes subpath should expose themeConfig");

const pack = spawnSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], {
  encoding: "utf8",
});

if (pack.error) {
  throw pack.error;
}

assert.equal(pack.status, 0, pack.stderr);

const [packageMetadata] = JSON.parse(pack.stdout);
const packageFiles = new Set(packageMetadata.files.map((file) => file.path));
const requiredPackageFiles = [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/components/button.js",
  "dist/components/button.d.ts",
  "dist/lib/cn.js",
  "dist/themes.js",
  "styles.css",
  "theme-scopes.css",
  "bobba/styles.css",
  "zleek/styles.css",
  "atlas/styles.css",
  "studio/styles.css",
  "paper/styles.css",
];

for (const requiredFile of requiredPackageFiles) {
  assert.equal(packageFiles.has(requiredFile), true, `package must include ${requiredFile}`);
}

for (const filePath of packageFiles) {
  assert.equal(
    /(^|\/)(src|tests|\.storybook|storybook-static|coverage|visual|bench)\//.test(filePath),
    false,
    `package must not include development-only file ${filePath}`,
  );
  assert.equal(
    filePath.endsWith(".stories.tsx"),
    false,
    `package must not include story source ${filePath}`,
  );
}

console.log("@moritzbrantner/ui package exports and npm package contents verified");
