import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");

test("外部画像APIへの依存がない", () => {
  assert.doesNotMatch(index, /wikimedia|wikipedia|commons\.wikimedia/i);
});

test("主要PWAファイルをキャッシュする", () => {
  for (const file of ["app.css", "app.js", "core.js", "poses.js", "manifest.webmanifest"]) assert.match(sw, new RegExp(file.replace(".", "\\.")));
});

test("主要操作に明示的なbutton typeがある", () => {
  const buttons = [...index.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(buttons.length > 10);
  assert.ok(buttons.every((button) => /type="button"/.test(button)));
});
