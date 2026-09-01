import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

test("client source excludes direct common transport, tracker, and console primitives", async () => {
  const files = await sourceFiles("app");
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const clientSource = sources.join("\n");

  assert.doesNotMatch(clientSource, /\b(?:fetch|sendBeacon|XMLHttpRequest)\s*\(/);
  assert.doesNotMatch(clientSource, /\bnew\s+(?:WebSocket|EventSource|Image)\s*\(/);
  assert.doesNotMatch(clientSource, /https?:\/\//i);
  assert.doesNotMatch(clientSource, /\bconsole\.(?:log|info|debug|table)\s*\(/);
  assert.doesNotMatch(
    clientSource,
    /\b(?:mixpanel|amplitude|google-analytics|segment\.io)\b/i,
  );
});

test("the Patterns presentation has no keyboard or text-input capture", async () => {
  const source = await readFile("app/components/studio/StudioUI.tsx", "utf8");
  const start = source.indexOf("export function PatternsView");
  const end = source.indexOf("function MovementLesson", start);
  const patternsSource = source.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(patternsSource, /onKey(?:Down|Up|Press)/);
  assert.doesNotMatch(patternsSource, /addEventListener\s*\(\s*["']key/);
  assert.doesNotMatch(patternsSource, /<(?:input|textarea)\b/);
});

test("dialogs use native modal semantics without application key capture", async () => {
  const source = await readFile("app/components/ui/ModalSheet.tsx", "utf8");
  assert.match(source, /<dialog/);
  assert.match(source, /\.showModal\(\)/);
  assert.doesNotMatch(source, /addEventListener\s*\(\s*["']key/);
});
