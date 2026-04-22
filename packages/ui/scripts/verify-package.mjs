import assert from "node:assert/strict";

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

console.log("@moritzbrantner/ui package exports verified");
