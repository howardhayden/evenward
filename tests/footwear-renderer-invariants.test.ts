import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import {
  CARE_TOOL_VALIDATION_VARIANTS,
  FOOTWEAR_MATERIAL_RANGES,
  MAX_DRAWING_BUFFER_PIXELS,
  REFERENCE_SOLE_CENTER_Y_METERS,
  REFERENCE_SOLE_WORLD_DIMENSIONS,
  TOOL_CONTACT_OFFSETS_METERS,
  LeatherFootwearRenderer,
  carePoseIdentity,
  captureCareAmount,
  captureRendererComponentBoundary,
  captureRendererSemanticProps,
  createDisposableOwnershipLedger,
  drawingBufferRequest,
  hasRenderableCareToolPrimaries,
  hasRequiredReferenceShoeGeometry,
  horizontalCapsuleWorldDimensions,
  isRenderableCareToolMesh,
  proceduralToolContactWorldPoint,
  referenceCameraPose,
  runIndependentCleanupSteps,
  toolContactFaceDistanceMeters,
} from "../app/components/care/LeatherFootwearRenderer";

const rendererSource = readFileSync(
  new URL("../app/components/care/LeatherFootwearRenderer.tsx", import.meta.url),
  "utf8",
);

function approximately(actual: number, expected: number) {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    `expected ${actual} to be approximately ${expected}`,
  );
}

test("the baked horizontal sole is long in X and thin in Y", () => {
  approximately(REFERENCE_SOLE_WORLD_DIMENSIONS.x, 0.28);
  approximately(REFERENCE_SOLE_WORLD_DIMENSIONS.y, 0.015);
  approximately(REFERENCE_SOLE_WORLD_DIMENSIONS.z, 0.1);
  approximately(
    REFERENCE_SOLE_CENTER_Y_METERS -
      REFERENCE_SOLE_WORLD_DIMENSIONS.y / 2,
    0,
  );
  assert.ok(
    REFERENCE_SOLE_WORLD_DIMENSIONS.x /
      REFERENCE_SOLE_WORLD_DIMENSIONS.y >
      18,
  );

  assert.deepEqual(
    horizontalCapsuleWorldDimensions(0.05, 0.18, [1, 0.15, 1]),
    REFERENCE_SOLE_WORLD_DIMENSIONS,
  );
  assert.match(rendererSource, /geometry\.rotateZ\(Math\.PI \/ 2\)/);
  assert.match(rendererSource, /"other-shoe-sole"[\s\S]*?SOLE_FINAL_SCALE/);
});

test("material ranges are deeply frozen against runtime mutation", () => {
  assert.equal(Object.isFrozen(FOOTWEAR_MATERIAL_RANGES), true);
  for (const range of Object.values(FOOTWEAR_MATERIAL_RANGES)) {
    assert.equal(Object.isFrozen(range), true);
    assert.equal(Object.isFrozen(range.baseRoughness), true);
    assert.equal(Object.isFrozen(range.clearcoat), true);
    if (range.coatRoughness) {
      assert.equal(Object.isFrozen(range.coatRoughness), true);
    }
  }

  const original = FOOTWEAR_MATERIAL_RANGES.toe.baseRoughness[0];
  assert.throws(() => {
    const attemptedMutation = FOOTWEAR_MATERIAL_RANGES.toe
      .baseRoughness as unknown as number[];
    attemptedMutation[0] = 0.99;
  }, TypeError);
  assert.equal(FOOTWEAR_MATERIAL_RANGES.toe.baseRoughness[0], original);
});

test("drawing-buffer requests reject unsupported dimensions without capping", () => {
  assert.deepEqual(drawingBufferRequest(1000, 500, 2, 4096), {
    width: 2000,
    height: 1000,
  });
  assert.equal(drawingBufferRequest(3000, 500, 2, 4096), null);
  assert.equal(drawingBufferRequest(2000, 1200, 2, 8192), null);
  assert.deepEqual(
    drawingBufferRequest(1024, 1024, 1, 4096, 1024 * 1024),
    { width: 1024, height: 1024 },
  );
  assert.equal(
    drawingBufferRequest(1024, 1024, 1, 4096, 1024 * 1024 - 1),
    null,
  );
  assert.equal(drawingBufferRequest(100, 100, Number.NaN, 4096), null);
  assert.deepEqual(drawingBufferRequest(1, 320, 16, 8192), {
    width: 16,
    height: 5120,
  });
  assert.equal(MAX_DRAWING_BUFFER_PIXELS, 8_388_608);
  assert.match(rendererSource, /resizeContext\.MAX_RENDERBUFFER_SIZE/);
  assert.match(rendererSource, /presentationValidated = false/);
  const allocationStart = rendererSource.indexOf("new THREE.WebGLRenderer");
  const guardedResizeStart = rendererSource.indexOf("const resize = () =>", allocationStart);
  assert.doesNotMatch(
    rendererSource.slice(allocationStart, guardedResizeStart),
    /setPixelRatio/,
  );
  const guardedResizeEnd = rendererSource.indexOf(
    "if (typeof ResizeObserver",
    guardedResizeStart,
  );
  const guardedResize = rendererSource.slice(
    guardedResizeStart,
    guardedResizeEnd,
  );
  assert.doesNotMatch(guardedResize, /\.setPixelRatio\(|\.setSize\(/);
  assert.match(guardedResize, /setDrawingBufferSize\(1, 1, 1\)/);
  assert.match(
    guardedResize,
    /setDrawingBufferSize\(width, height, devicePixelRatio\)/,
  );
  assert.ok(
    guardedResize.indexOf("setDrawingBufferSize(1, 1, 1)") <
      guardedResize.indexOf(
        "setDrawingBufferSize(width, height, devicePixelRatio)",
      ),
  );
});

test("runtime semantic props reject getters, proxies, extras, and invalid enums", () => {
  const careAmount = {
    "left-toe": 0,
    "left-heel": 0.25,
    "right-toe": 0.5,
    "right-heel": 1,
  };
  const props = {
    shoe: "left",
    region: "toe",
    careAmount,
    motionMode: "reduced",
    contact: "release",
    representativeContact: "release",
    stage: "work",
    tool: "cotton-cloth",
  } as const;
  const captured = captureRendererSemanticProps(props);
  assert.ok(captured);
  assert.equal(Object.isFrozen(captured), true);
  assert.equal(Object.isFrozen(captured.careAmount), true);
  assert.ok(captureRendererComponentBoundary(props));

  let getterExecuted = false;
  const getterAmount = { ...careAmount };
  Object.defineProperty(getterAmount, "left-toe", {
    enumerable: true,
    get() {
      getterExecuted = true;
      throw new Error("must not execute");
    },
  });
  assert.equal(captureCareAmount(getterAmount), null);
  assert.equal(getterExecuted, false);

  const hostileProxy = new Proxy(careAmount, {
    ownKeys() {
      throw new Error("hostile ownKeys");
    },
  });
  assert.doesNotThrow(() => captureCareAmount(hostileProxy));
  assert.equal(captureCareAmount(hostileProxy), null);
  assert.equal(captureCareAmount({ ...careAmount, extra: 1 }), null);
  assert.equal(
    captureRendererSemanticProps({ ...props, shoe: "center" }),
    null,
  );
  assert.equal(
    captureRendererSemanticProps({ ...props, tool: "brush" }),
    null,
  );
  assert.equal(
    captureRendererSemanticProps({ ...props, tool: "water-drop" }),
    null,
  );
  assert.equal(
    captureRendererSemanticProps({
      ...props,
      stage: "water",
      tool: "water-drop",
      contact: "contact",
    }),
    null,
  );
  assert.equal(
    captureRendererSemanticProps({
      ...props,
      motionMode: "normal",
      representativeContact: "clear",
    }),
    null,
  );

  let outerGetterExecuted = false;
  const getterProps = { ...props } as Record<string, unknown>;
  Object.defineProperty(getterProps, "shoe", {
    enumerable: true,
    get() {
      outerGetterExecuted = true;
      throw new Error("outer prop getter must not execute");
    },
  });
  assert.equal(captureRendererComponentBoundary(getterProps), null);
  assert.equal(outerGetterExecuted, false);

  const hostileAttributeValue = {
    [Symbol.toPrimitive]() {
      throw new Error("hostile attribute coercion");
    },
    toString() {
      throw new Error("hostile attribute toString");
    },
  };
  const hostileProps = { ...props, shoe: hostileAttributeValue };
  let hostileMarkup = "";
  assert.doesNotThrow(() => {
    hostileMarkup = renderToStaticMarkup(
      createElement(
        LeatherFootwearRenderer,
        hostileProps as unknown as Parameters<
          typeof LeatherFootwearRenderer
        >[0],
      ),
    );
  });
  assert.match(hostileMarkup, /data-shoe="invalid"/);
  assert.match(hostileMarkup, /data-region="invalid"/);
});

test("every tool face is tangent to each authored procedural locator", () => {
  const ellipsoids = {
    toe: {
      center: [0.088, 0.049, 0] as const,
      radii: [0.067, 0.033, 0.051] as const,
    },
    heel: {
      center: [-0.105, 0.057, 0] as const,
      radii: [0.045, 0.055, 0.049] as const,
    },
  };
  for (const region of ["toe", "heel"] as const) {
    for (const tool of [
      "cotton-cloth",
      "water-drop",
      "lustreur-glove",
    ] as const) {
      approximately(toolContactFaceDistanceMeters(region, tool), 0);
      assert.ok(Number.isFinite(TOOL_CONTACT_OFFSETS_METERS[region][tool]));
      const point = proceduralToolContactWorldPoint(region, tool);
      const ellipsoid = ellipsoids[region];
      const surfaceEquation =
        ((point.x - ellipsoid.center[0]) / ellipsoid.radii[0]) ** 2 +
        ((point.y - ellipsoid.center[1]) / ellipsoid.radii[1]) ** 2 +
        ((point.z - ellipsoid.center[2]) / ellipsoid.radii[2]) ** 2;
      approximately(surfaceEquation, 1);
    }
  }
  assert.doesNotMatch(rendererSource, /targetShoe\.rotation\.y/);
  assert.ok(referenceCameraPose("left", "toe").position[0] > 0);
  assert.ok(referenceCameraPose("left", "heel").position[0] < 0);
  assert.ok(referenceCameraPose("left", "toe").position[2] < 0);
  assert.ok(referenceCameraPose("right", "toe").position[2] > 0);
});

test("every pose-affecting semantic field changes renderer pose identity", () => {
  const base = {
    motionMode: "reduced",
    contact: "release",
    representativeContact: "release",
    shoe: "left",
    region: "toe",
    stage: "work",
    tool: "cotton-cloth",
  } as const;
  const baseIdentity = carePoseIdentity(base);
  const variants = [
    { ...base, motionMode: "still" as const },
    { ...base, contact: "contact" as const },
    { ...base, representativeContact: "contact" as const },
    { ...base, shoe: "right" as const },
    { ...base, region: "heel" as const },
    { ...base, stage: "water" as const },
    { ...base, tool: "water-drop" as const },
  ];

  variants.forEach((variant) => {
    assert.notEqual(carePoseIdentity(variant), baseIdentity);
  });
  assert.match(
    rendererSource,
    /setCarePose\(care\.tool, props, poseNow, poseNow - poseStartedAt\)/,
  );
});

test("missing required shoe geometry fails the output oracle", () => {
  const root = new THREE.Group();
  const camera = new THREE.PerspectiveCamera();
  const material = new THREE.MeshBasicMaterial();
  const names = [
    "sole-independent",
    "welt-independent",
    "toe-independent",
    "vamp-flex-independent",
    "heel-counter-independent",
    "near-quarter-independent",
    "far-quarter-independent",
    "toe-cap-join-independent",
    "heel-counter-seam-independent",
  ];
  const meshes = names.map((name) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
    mesh.name = name;
    root.add(mesh);
    return mesh;
  });
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), true);

  meshes[0].visible = false;
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  meshes[0].visible = true;

  meshes[0].scale.x = 0;
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  meshes[0].scale.x = 1;

  meshes[0].geometry.setDrawRange(0, 0);
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  meshes[0].geometry.setDrawRange(0, Number.POSITIVE_INFINITY);

  meshes[0].layers.set(1);
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  meshes[0].layers.set(0);

  material.visible = false;
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  material.visible = true;

  material.colorWrite = false;
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  material.colorWrite = true;

  root.remove(meshes[2]);
  assert.equal(hasRequiredReferenceShoeGeometry(root, camera), false);
  assert.match(rendererSource, /for \(const requiredMesh of requiredMeshes\)/);
  meshes.forEach((mesh) => mesh.geometry.dispose());
  material.dispose();
});

test("each care-tool primary must be independently renderable", () => {
  const material = new THREE.MeshBasicMaterial();
  const cotton = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  const water = new THREE.Mesh(new THREE.SphereGeometry(1), material);
  const lustreur = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), material);
  const hand = new THREE.Mesh(new THREE.CapsuleGeometry(1, 1), material);
  const primaries = {
    "cotton-cloth": cotton,
    "water-drop": water,
    "lustreur-glove": lustreur,
  };
  assert.equal(hasRenderableCareToolPrimaries(primaries), true);
  assert.equal(
    hasRenderableCareToolPrimaries({ ...primaries, "water-drop": null }),
    false,
  );
  cotton.geometry.setDrawRange(0, 0);
  assert.equal(hasRenderableCareToolPrimaries(primaries), false);
  cotton.geometry.setDrawRange(0, Number.POSITIVE_INFINITY);
  assert.equal(isRenderableCareToolMesh(hand), true);
  hand.geometry.setDrawRange(0, 0);
  assert.equal(isRenderableCareToolMesh(hand), false);

  cotton.geometry.dispose();
  water.geometry.dispose();
  lustreur.geometry.dispose();
  hand.geometry.dispose();
  material.dispose();
  assert.match(rendererSource, /label: "hand-independent"/);
  assert.match(rendererSource, /label: "cotton-cloth-with-hand"/);
  assert.match(rendererSource, /visibleMeshes: \[care\.cottonCloth, care\.hand\]/);
  assert.match(rendererSource, /label: "lustreur-glove-with-hand"/);
  assert.match(rendererSource, /visibleMeshes: \[care\.finishingCloth, care\.hand\]/);
});

test("capability publication follows cube and presentation validation", () => {
  assert.match(rendererSource, /for \(let face = 0; face < 6; face \+= 1\)/);
  assert.match(rendererSource, /checkFramebufferStatus\(context\.FRAMEBUFFER\)/);
  assert.match(rendererSource, /context\.readPixels\(/);

  const frameStart = rendererSource.indexOf("function renderFrame");
  const frameEnd = rendererSource.indexOf("scheduleRender();\n\n      return teardown", frameStart);
  const frame = rendererSource.slice(frameStart, frameEnd);
  assert.match(frame, /if \(!outputValidated\)/);
  assert.doesNotMatch(frame, /\.readPixels\(/);
  assert.deepEqual(CARE_TOOL_VALIDATION_VARIANTS, [
    "cotton-cloth",
    "water-drop",
    "lustreur-glove",
  ]);
  assert.match(rendererSource, /for \(const shoe of \["left", "right"\] as const\)/);
  assert.match(rendererSource, /for \(const region of \["toe", "heel"\] as const\)/);
  assert.ok(frame.indexOf("captureProbe()") < frame.indexOf("renderAndValidatePresentation"));
  assert.ok(
    frame.indexOf("validateCareToolVariants") <
      frame.indexOf("renderAndValidatePresentation"),
  );
  assert.ok(
    frame.indexOf("renderAndValidatePresentation") <
      frame.indexOf("publishCapability(true)"),
  );
});

test("cleanup faults cannot skip later resource teardown steps", () => {
  const completed: number[] = [];
  runIndependentCleanupSteps([
    () => completed.push(1),
    () => {
      completed.push(2);
      throw new Error("injected disposer failure");
    },
    () => completed.push(3),
  ]);
  assert.deepEqual(completed, [1, 2, 3]);

  const teardownStart = rendererSource.indexOf("const teardown = () =>");
  const teardownEnd = rendererSource.indexOf("    try {", teardownStart);
  const teardown = rendererSource.slice(teardownStart, teardownEnd);
  assert.match(teardown, /runIndependentCleanupSteps/);
  assert.match(teardown, /forceContextLoss/);
  assert.match(teardown, /removeChild/);
});

test("setup disposables remain owned across an injected construction failure", () => {
  const disposed: string[] = [];
  const ownership = createDisposableOwnershipLedger();
  assert.throws(() => {
    ownership.own({
      dispose() {
        disposed.push("first");
        throw new Error("injected disposer failure");
      },
    });
    ownership.own({
      dispose() {
        disposed.push("second");
      },
    });
    throw new Error("injected setup failure before scene attachment");
  }, /injected setup failure/);
  assert.equal(ownership.pendingCount, 2);

  ownership.disposeAll();
  assert.deepEqual(disposed, ["first", "second"]);
  assert.equal(ownership.pendingCount, 0);
  ownership.disposeAll();
  assert.deepEqual(disposed, ["first", "second"]);

  const setupStart = rendererSource.indexOf(
    "    try {",
    rendererSource.indexOf("const teardown = () =>"),
  );
  const setupEnd = rendererSource.indexOf("      const captureProbe", setupStart);
  const setupSource = rendererSource.slice(setupStart, setupEnd);
  assert.match(setupSource, /addCalibrationHall\(scene, disposableOwnership\.own\)/);
  assert.match(setupSource, /createMaterialSet\(disposableOwnership\.own\)/);
  assert.match(setupSource, /createReferenceShoe\([\s\S]*?disposableOwnership\.own/);
  assert.match(setupSource, /disposableOwnership\.own\(new THREE\.MeshPhysicalMaterial/);
  assert.match(setupSource, /createOtherShoeProxy\([\s\S]*?disposableOwnership\.own/);
  assert.match(setupSource, /createCareTool\(disposableOwnership\.own\)/);
  assert.match(setupSource, /disposableOwnership\.own\(new THREE\.WebGLCubeRenderTarget/);
  assert.match(rendererSource, /disposableOwnership\.disposeAll\(\)/);
});

test("renderer failures defer assertive announcement ownership to Studio", () => {
  const renderStart = rendererSource.indexOf("  return (");
  const renderedMarkup = rendererSource.slice(renderStart);
  assert.doesNotMatch(renderedMarkup, /role="alert"/);
  assert.match(renderedMarkup, /domainFailureAcknowledged[\s\S]*?aria-hidden="true"/);
  assert.match(renderedMarkup, /role="status"/);
});

test("context loss remains unavailable until the retained canvas restores", () => {
  const lostStart = rendererSource.indexOf("onContextLost = (event");
  const restoredStart = rendererSource.indexOf(
    "onContextRestored = ()",
    lostStart,
  );
  const listenerStart = rendererSource.indexOf(
    "activeCanvas.addEventListener",
    restoredStart,
  );
  const lostHandler = rendererSource.slice(lostStart, restoredStart);
  const restoredHandler = rendererSource.slice(restoredStart, listenerStart);

  assert.match(lostHandler, /retainLostContextForRestore\(\)/);
  assert.doesNotMatch(lostHandler, /teardown\(|setResourceGeneration/);
  assert.match(restoredHandler, /teardown\(\)/);
  assert.match(restoredHandler, /setResourceGeneration/);
  const resizeStart = rendererSource.indexOf("const resize = () =>");
  const resizeEnd = rendererSource.indexOf(
    "if (typeof ResizeObserver",
    resizeStart,
  );
  const resizeSource = rendererSource.slice(resizeStart, resizeEnd);
  assert.match(
    resizeSource,
    /contextLost \|\| resizeContext\.isContextLost\(\)/,
  );
  assert.ok(
    resizeSource.indexOf("resizeContext.isContextLost()") <
      resizeSource.indexOf("getParameter(resizeContext.MAX_RENDERBUFFER_SIZE)"),
  );
  assert.match(
    resizeSource,
    /catch \{[\s\S]*?underlyingContextIsLost\(resizeContext\)/,
  );
  assert.ok(
    rendererSource.indexOf("activeCanvas.addEventListener", resizeStart) <
      rendererSource.indexOf("if (!resize())", resizeStart),
  );
  assert.match(rendererSource, /shouldAnimateReducedBoundary/);
});
