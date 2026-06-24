import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const content = JSON.parse(await readFile(join(here, "website-content.json"), "utf8"));

test("SpatialEMU hero is positioned for Vision Pro and iPad", () => {
  assert.equal(content.brand, "SpatialEMU");
  assert.match(content.hero.title, /Vision Pro/i);
  assert.match(content.hero.title, /iPad/i);
  assert.match(content.hero.subtitle, /FolioSpace/i);
  assert.doesNotMatch(content.hero.subtitle, /NAS|Docker/i);
});

test("FolioSpace is a supporting library source, not the main product", () => {
  assert.equal(content.librarySource.label, "Library source: FolioSpace");
  assert.equal(content.librarySource.role, "supporting");
  assert.notEqual(content.brand, "FolioSpace Library");
});

test("user-facing sections focus on gameplay and supported systems", () => {
  const sectionText = JSON.stringify(content.sections);
  assert.match(sectionText, /Supported systems/i);
  assert.match(sectionText, /NES/i);
  assert.match(sectionText, /SNES/i);
  assert.match(sectionText, /Genesis/i);
  assert.match(sectionText, /Arcade/i);
  assert.doesNotMatch(sectionText, /review-safe/i);
});

test("game library gallery is first-class and uses real screenshot slots", () => {
  assert.ok(content.gallery.screenshots.length >= 4);
  assert.ok(content.gallery.screenshots.every((shot) => shot.image.startsWith("/website/")));
  assert.ok(content.gallery.platforms.includes("GBA"));
});
