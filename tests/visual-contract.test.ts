import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("avatar geometry exposes named occlusion layers and articulated joints", async () => {
  const source = await readFile("app/components/avatar/Trainer.tsx", "utf8");
  for (const layer of [
    "headwear-back",
    "hair-back",
    "limbs-back",
    "clothing",
    "hair-front",
    "headwear-front",
    "features",
    "accessory-front",
    "support-front",
  ]) {
    assert.match(source, new RegExp(`data-layer="${layer}"`));
  }
  assert.match(source, /trainer__joint--elbow/);
  assert.match(source, /trainer__joint--knee/);
  assert.match(source, /trainer__forearm/);
  assert.match(source, /trainer__shin/);
  assert.match(source, /trainer__quadruped-limbs/);
  assert.match(source, /trainer__quadruped-knee/);
  assert.match(source, /data-demonstration-engine/);
  assert.match(source, /"hijab", "dastar", "kufi", "veil", "burqa"/);
  assert.match(source, /trainer__veil-back/);
  assert.match(source, /trainer__veil-front-drape/);
  assert.match(source, /trainer__profile-veil-drape/);
});

test("visual tokens preserve translucent glass and accessible fallbacks", async () => {
  const css = await readFile("app/globals.css", "utf8");
  assert.match(css, /--glass-surface:/);
  assert.match(css, /--glass-blur:/);
  assert.match(css, /data-solid-surfaces="true"/);
  assert.match(css, /@supports not \(\(backdrop-filter:/);
  assert.match(css, /--trainer-eye-white:/);
  assert.match(css, /--trainer-eye-ink:/);
  assert.match(css, /\.trainer__quadruped-pupil/);
  for (const theme of ["forest", "sea", "sunrise"]) {
    assert.match(
      css,
      new RegExp(`\\.cadence-app\\[data-theme="${theme}"\\] :is\\([\\s\\S]*?\\.trainer__pupil`),
    );
  }
  assert.match(css, /\.trainer__profile-closed-eye[\s\S]*?stroke: var\(--trainer-eye-ink\)/);
  assert.match(css, /\.trainer__quadruped-smile[\s\S]*?stroke: var\(--trainer-eye-ink\)/);
  assert.match(css, /data-view="side"] \.trainer__leg-chain--left/);
  assert.match(css, /trainer__profile-neck/);
  assert.match(css, /data-reduced-presentation="true"]\[data-pose="2"]/);
  assert.match(css, /data-position="quadruped"/);
  assert.match(css, /@keyframes quadruped-spine/);
  assert.match(css, /--left-forearm-animation/);
  assert.match(css, /--right-shin-animation/);
  assert.match(css, /@media \(min-width: 48rem\)/);
  assert.match(css, /@media \(min-width: 64rem\)/);
});

test("ambient scenes use dense organic particles and ellipse ripples", async () => {
  const source = await readFile("app/components/ambient/Atmosphere.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  assert.match(source, /rain: Array\.from\(\{ length: 96 \}/);
  assert.match(source, /stars: Array\.from\(\{ length: 96 \}/);
  assert.match(source, /rippleSources\.length < 6/);
  assert.match(source, /candidate\.height = candidate\.width \* between\(0\.27, 0\.34\)/);
  assert.match(css, /border-radius: 50%/);
  assert.match(css, /@keyframes water-ripple/);
  assert.match(css, /@keyframes branch-sway/);
  assert.match(css, /@keyframes cloud-drift/);
});
