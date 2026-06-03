import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(srcDir, "..");

test("thumbnail fallback uses the legacy bookshelf artwork", async () => {
  const appSource = await readFile(path.join(srcDir, "App.tsx"), "utf8");
  const fallbackLine = appSource.split("\n").find((line) => line.includes("thumbnailFallbackImage")) || "";

  assert.equal(fallbackLine.trim(), 'const thumbnailFallbackImage = "/bookshelf-bg-v2.jpg";');
  assert.ok(!appSource.includes("data:image/svg+xml"), "inline SVG fallback should not be used");
  await access(path.join(webDir, "public", "bookshelf-bg-v2.jpg"));
});
