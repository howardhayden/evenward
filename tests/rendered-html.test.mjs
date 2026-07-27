import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the production entry route and its initial semantic state", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>Evenward — Regulation Studio<\/title>/);
  assert.match(html, /<nav[^>]+aria-label="Primary navigation"/);
  assert.match(html, /<main[^>]+id="main-content"/);
  assert.match(html, /What direction feels closest right now\?/);
  assert.equal((html.match(/data-testid="primary-guide"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<input[^>]+type="text"/);
});
