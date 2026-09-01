import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const renderer = source("../app/components/care/LeatherFootwearRenderer.tsx");
const studio = source("../app/components/care/ShoeCareStudio.tsx");
const careDomain = source("../app/domain/footwear-care.ts");
const careStore = source("../app/domain/footwear-care-store.ts");
const materialDomain = source("../app/domain/footwear-material.ts");
const page = source("../app/page.tsx");
const persistence = source("../app/domain/persistence.ts");
const styles = source("../app/globals.css");
const packageJson = JSON.parse(source("../package.json")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

test("the reference renderer uses local physical geometry without a cosmetic or remote shortcut", () => {
  assert.match(renderer, /new THREE\.MeshPhysicalMaterial/);
  assert.match(renderer, /new THREE\.WebGLCubeRenderTarget/);
  assert.match(renderer, /new THREE\.CubeCamera/);
  assert.match(renderer, /new THREE\.CatmullRomCurve3/);
  assert.match(renderer, /toe-independent/);
  assert.match(renderer, /heel-counter-independent/);
  assert.match(renderer, /vamp-flex-independent/);
  assert.match(renderer, /welt-independent/);
  assert.match(renderer, /sole-independent/);
  assert.match(renderer, /targetShoe\.visible = false/);
  assert.match(renderer, /finally \{/);
  assert.match(renderer, /data-optical-contract="blocked"/);
  assert.match(renderer, /data-renderer-rating="unrated"/);
  assert.match(renderer, /data-production-compliance="none"/);
  assert.match(renderer, /cotton-cloth-contact-surface/);
  assert.match(renderer, /single-water-drop-contact-marker/);
  assert.match(renderer, /lustreur-glove-contact-surface/);
  assert.match(renderer, /role="status"/);
  assert.doesNotMatch(renderer, /role="alert"/);
  assert.match(studio, /role="alert"/);
  assert.match(studio, /studioAlertMessage\(\s*rendererAvailable/);
  assert.match(studio, /rendererContactActionPolicy\(\s*rendererAvailable/);
  assert.doesNotMatch(renderer, /OrbitControls|contactActive/);
  assert.doesNotMatch(renderer, /\bfetch\s*\(|https?:\/\/|TextureLoader|GLTFLoader/);
  assert.doesNotMatch(renderer, /linear-gradient|radial-gradient|matcap|decal/i);
  assert.doesNotMatch(renderer, /var\(--|currentColor/);
});

test("care state stays memory-only and Care capture suppresses guide reactions", () => {
  assert.doesNotMatch(persistence, /careAmount|CareState|evenward-care|polish-history/i);
  assert.match(persistence, /Current leather-care run/);
  assert.doesNotMatch(careDomain, /localStorage|sessionStorage|indexedDB|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(studio, /localStorage|sessionStorage|indexedDB|\bfetch\s*\(/);
  assert.match(page, /if \(view === "care" \|\| guide\.state\.mode !== "idle"\) return/);
  assert.match(page, /target\.closest\("\.trainer-hit, \[data-care-surface\]"\)/);
  assert.match(careStore, /pauseCareAtReleasedBoundary/);
  assert.match(careStore, /kind: "cancel-at-release"/);
  assert.match(careStore, /cancelCareBoundary/);
  assert.match(careStore, /transitionTrace/);
  assert.match(page, /data-care-transition-trace/);
  assert.match(page, /kind: "pause-at-release"/);
  assert.match(page, /kind: "cancel-at-release"/);
  assert.match(studio, /onCancelAtReleasedBoundary/);
  assert.match(page, /view !== "care"/);
});

test("the event contract carries both revision and run identity", () => {
  assert.match(careDomain, /expectedRevision: number/);
  assert.match(careDomain, /expectedRunId: string/);
  assert.match(careDomain, /"STALE_RUN"/);
  assert.match(studio, /expectedRunId: state\.runId/);
  assert.match(studio, /primaryActionRef\.current\?\.focus\(\)/);
  assert.match(studio, /aria-disabled=\{primaryAction\.disabled\}/);
  assert.match(studio, /restartMotionForRequirement/);
  assert.doesNotMatch(page, /key=\{careState\.runId\}/);
  assert.match(careStore, /reduceCareState\(store\.state, action\.event\)/);
  assert.match(studio, /careAmount=\{state\.careAmount\}/);
  assert.match(studio, /contact=\{state\.contact\}/);
  assert.match(studio, /stage=\{state\.stage\}/);
  assert.match(studio, /tool=\{state\.tool\}/);
});

test("care emits semantic controls while footwear owns material and fidelity conversion", () => {
  assert.doesNotMatch(careDomain, /clearcoat|roughness|Pshoe|ShoeFidelityTier/);
  assert.match(materialDomain, /toeClearcoatRoughnessFromCareAmount/);
  assert.match(materialDomain, /selectRequiredShoeFidelityTier/);
  assert.match(renderer, /from "\.\.\/\.\.\/domain\/footwear-material"/);
});

test("care responsive, low-vision, and forced-color rules remain explicit source contracts", () => {
  assert.match(styles, /@media \(max-width: 41\.999rem\)[\s\S]*?\.care-wayfinder[\s\S]*?repeat\(2/);
  assert.match(styles, /data-low-vision="true"[\s\S]*?\.care-modeled-notice/);
  assert.match(styles, /@media \(forced-colors: active\)[\s\S]*?opacity: 1/);
  assert.match(styles, /\.care-step-panel fieldset[\s\S]*?border: 0/);
  assert.match(styles, /data-stage-state="optional-unrecorded"/);
});

test("Three.js runtime and declarations are version-pinned", () => {
  assert.equal(packageJson.dependencies.three, "0.185.1");
  assert.equal(packageJson.devDependencies["@types/three"], "0.185.4");
});
