"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import type {
  CareAmount,
  CareContact,
  CareMotionMode,
  CareRegion,
  CareShoe,
  CareStage,
  CareTarget,
  CareTool,
} from "../../domain/footwear-care";
import {
  ADMIRAL_BURIED_LUMA_GATE,
  flexClearcoatRoughnessFromCareAmount,
  toeClearcoatRoughnessFromCareAmount,
} from "../../domain/footwear-material";

export type LeatherFootwearRendererProps = {
  shoe: CareShoe;
  region: CareRegion;
  careAmount: CareAmount;
  motionMode: CareMotionMode;
  contact: CareContact;
  representativeContact: CareContact;
  stage: CareStage;
  tool: CareTool;
  domainFailureAcknowledged?: boolean;
  onCapabilityChange?: (available: boolean) => void;
};

type RendererProps = Omit<
  LeatherFootwearRendererProps,
  "domainFailureAcknowledged" | "onCapabilityChange"
>;
type LeatherRegion = "toe" | "heel" | "side" | "flex";
type MaterialRegion = LeatherRegion | "welt" | "sole";

type RegionalMaterialRange = Readonly<{
  baseRoughness: readonly [minimum: number, maximum: number];
  clearcoat: readonly [minimum: number, maximum: number];
  coatRoughness: readonly [minimum: number, maximum: number] | null;
}>;

type DisposableResource = { dispose: () => void };
type OwnDisposable = <T extends DisposableResource>(resource: T) => T;

/**
 * Owns each GPU disposable at the allocation expression, before any scene
 * attachment can become its only teardown path.
 */
export function createDisposableOwnershipLedger() {
  const resources = new Set<DisposableResource>();
  let disposed = false;

  const own: OwnDisposable = (resource) => {
    if (disposed) {
      runIndependentCleanupSteps([() => resource.dispose()]);
      throw new Error("Cannot register a resource after ownership disposal.");
    }
    resources.add(resource);
    return resource;
  };

  return {
    own,
    disposeAll() {
      if (disposed) return;
      disposed = true;
      const snapshot = [...resources];
      resources.clear();
      runIndependentCleanupSteps(
        snapshot.map((resource) => () => resource.dispose()),
      );
    },
    get pendingCount() {
      return resources.size;
    },
  };
}

function frozenMaterialRange<
  TCoat extends readonly [number, number] | null,
>(
  baseRoughness: readonly [number, number],
  clearcoat: readonly [number, number],
  coatRoughness: TCoat,
): Readonly<{
  baseRoughness: readonly [number, number];
  clearcoat: readonly [number, number];
  coatRoughness: TCoat;
}> {
  return Object.freeze({
    baseRoughness: Object.freeze(baseRoughness),
    clearcoat: Object.freeze(clearcoat),
    coatRoughness:
      (coatRoughness === null
        ? null
        : Object.freeze(coatRoughness)) as TCoat,
  });
}

/**
 * Public source ranges from EVM-FOOTWEAR-1.0 p. 6, with the EVC-049 toe
 * endpoints taking precedence over the obsolete wider sample formula.
 * Keeping the intervals next to the executing values makes region ownership
 * inspectable; this reference does not claim the required GPU readback proof.
 */
export const FOOTWEAR_MATERIAL_RANGES = Object.freeze({
  toe: frozenMaterialRange([0.12, 0.18], [0.98, 1.0], [0.005, 0.012]),
  heel: frozenMaterialRange([0.14, 0.2], [0.96, 1.0], [0.007, 0.016]),
  side: frozenMaterialRange([0.16, 0.23], [0.9, 1.0], [0.012, 0.025]),
  flex: frozenMaterialRange([0.24, 0.38], [0.45, 0.75], [0.05, 0.11]),
  welt: frozenMaterialRange([0.35, 0.6], [0.0, 0.25], [0.15, 0.4]),
  sole: frozenMaterialRange([0.6, 0.85], [0.0, 0.0], null),
} as const satisfies Record<MaterialRegion, RegionalMaterialRange>);

const BASE_LEATHER = 0x0b0b0b;
const NEUTRAL_SPECULAR = 0xffffff;
const IOR = 1.52;
const ENVIRONMENT_INTENSITY = 1.08;
const NORMAL_TRAVEL_METERS = 0.012;
const NORMAL_REVERSALS_PER_SECOND = 4;
const PROBE_RESOLUTION = 512;
const SOLE_CAPSULE_RADIUS_METERS = 0.05;
const SOLE_CAPSULE_LENGTH_METERS = 0.18;
const SOLE_FINAL_SCALE = [1, 0.15, 1] as const;
const WELT_CAPSULE_RADIUS_METERS = 0.052;
const WELT_CAPSULE_LENGTH_METERS = 0.18;
const WELT_FINAL_SCALE = [1, 0.055, 1] as const;
/** Pre-production allocation guard; exceeding it fails rather than downscales. */
export const MAX_DRAWING_BUFFER_PIXELS = 8_388_608;

const frame = Math.fround;

export function drawingBufferRequest(
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
  maxRenderbufferSize: number,
  pixelBudget = MAX_DRAWING_BUFFER_PIXELS,
) {
  if (
    !Number.isFinite(cssWidth) ||
    !Number.isFinite(cssHeight) ||
    !Number.isFinite(pixelRatio) ||
    !Number.isFinite(maxRenderbufferSize) ||
    !Number.isFinite(pixelBudget) ||
    cssWidth <= 0 ||
    cssHeight <= 0 ||
    pixelRatio <= 0 ||
    maxRenderbufferSize < 1 ||
    pixelBudget < 1
  ) {
    return null;
  }
  const width = Math.floor(cssWidth * pixelRatio);
  const height = Math.floor(cssHeight * pixelRatio);
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > maxRenderbufferSize ||
    height > maxRenderbufferSize ||
    width * height > pixelBudget
  ) {
    return null;
  }
  return Object.freeze({ width, height });
}

function mixFloat32(start: number, end: number, amount: number) {
  const delta = frame(frame(end) - frame(start));
  return frame(frame(start) + frame(delta * frame(amount)));
}

/** Compatibility exports; the executing rule is owned by footwear-material. */
export const toeCoatRoughnessFromCareControl =
  toeClearcoatRoughnessFromCareAmount;
export const flexCoatRoughnessFromControl =
  flexClearcoatRoughnessFromCareAmount;

function heelCoatRoughnessFromCareControl(careAmount: number) {
  // The register fixes the heel endpoints but does not prescribe a conversion
  // curve. This quadratic interpolation is reference behavior, not evidence
  // that the production shader or a physical polish outcome has been proven.
  const amount = frame(careAmount);
  const squared = frame(amount * amount);
  return mixFloat32(0.007, 0.016, squared);
}

function midpoint(range: readonly [number, number]) {
  return (range[0] + range[1]) / 2;
}

/**
 * Exact axis-aligned dimensions after a Y-axis Three.js CapsuleGeometry is
 * quarter-turned into the X axis and then scaled in its final world axes.
 */
export function horizontalCapsuleWorldDimensions(
  radius: number,
  cylinderLength: number,
  finalAxisScale: readonly [number, number, number],
) {
  return Object.freeze({
    x: (cylinderLength + radius * 2) * Math.abs(finalAxisScale[0]),
    y: radius * 2 * Math.abs(finalAxisScale[1]),
    z: radius * 2 * Math.abs(finalAxisScale[2]),
  });
}

export const REFERENCE_SOLE_WORLD_DIMENSIONS =
  horizontalCapsuleWorldDimensions(
    SOLE_CAPSULE_RADIUS_METERS,
    SOLE_CAPSULE_LENGTH_METERS,
    SOLE_FINAL_SCALE,
  );

export const REFERENCE_SOLE_CENTER_Y_METERS =
  REFERENCE_SOLE_WORLD_DIMENSIONS.y / 2;

const REFERENCE_WELT_WORLD_DIMENSIONS = horizontalCapsuleWorldDimensions(
  WELT_CAPSULE_RADIUS_METERS,
  WELT_CAPSULE_LENGTH_METERS,
  WELT_FINAL_SCALE,
);
const REFERENCE_WELT_CENTER_Y_METERS =
  REFERENCE_SOLE_WORLD_DIMENSIONS.y +
  REFERENCE_WELT_WORLD_DIMENSIONS.y / 2;

const LOCATOR_CONTACT_FACE_Y_METERS = -0.0015;
const PROCEDURAL_CONTACT_ANCHORS = Object.freeze({
  toe: Object.freeze({
    position: [0.088, 0.0835, 0] as const,
    rotationZ: 0,
  }),
  heel: Object.freeze({
    position: [-0.1515, 0.057, 0] as const,
    rotationZ: Math.PI / 2,
  }),
} as const satisfies Record<
  CareRegion,
  Readonly<{
    position: readonly [number, number, number];
    rotationZ: number;
  }>
>);
const TOOL_CONTACT_FACE_Y_METERS = Object.freeze({
  "cotton-cloth": -0.0015,
  "water-drop": -0.00325,
  "lustreur-glove": -0.001,
} as const satisfies Record<CareTool, number>);

export const TOOL_CONTACT_OFFSETS_METERS = Object.freeze({
  toe: Object.freeze({
    "cotton-cloth": 0,
    "water-drop": 0.00175,
    "lustreur-glove": -0.0005,
  }),
  heel: Object.freeze({
    "cotton-cloth": 0,
    "water-drop": 0.00175,
    "lustreur-glove": -0.0005,
  }),
} as const satisfies Record<CareRegion, Record<CareTool, number>>);

export function toolContactFaceDistanceMeters(
  region: CareRegion,
  tool: CareTool,
) {
  return (
    TOOL_CONTACT_FACE_Y_METERS[tool] +
    TOOL_CONTACT_OFFSETS_METERS[region][tool] -
    LOCATOR_CONTACT_FACE_Y_METERS
  );
}

export function proceduralToolContactWorldPoint(
  region: CareRegion,
  tool: CareTool,
) {
  const anchor = PROCEDURAL_CONTACT_ANCHORS[region];
  const localFaceY =
    TOOL_CONTACT_FACE_Y_METERS[tool] +
    TOOL_CONTACT_OFFSETS_METERS[region][tool];
  const sine = Math.sin(anchor.rotationZ);
  const cosine = Math.cos(anchor.rotationZ);
  return Object.freeze({
    x: anchor.position[0] - sine * localFaceY,
    y: anchor.position[1] + cosine * localFaceY,
    z: anchor.position[2],
  });
}

export function referenceCameraPose(shoe: CareShoe, region: CareRegion) {
  return Object.freeze({
    position: Object.freeze([
      region === "toe" ? 0.43 : -0.43,
      0.27,
      shoe === "left" ? -0.42 : 0.42,
    ] as const),
    target: Object.freeze([
      region === "toe" ? 0.035 : -0.065,
      region === "toe" ? 0.055 : 0.057,
      0,
    ] as const),
  });
}

function setReferenceCameraPose(
  camera: THREE.Camera,
  shoe: CareShoe,
  region: CareRegion,
) {
  const pose = referenceCameraPose(shoe, region);
  camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
  camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
  camera.updateMatrixWorld();
}

type PoseIdentityProps = Pick<
  RendererProps,
  | "motionMode"
  | "contact"
  | "representativeContact"
  | "shoe"
  | "region"
  | "stage"
  | "tool"
>;

export function carePoseIdentity(props: PoseIdentityProps) {
  return [
    props.motionMode,
    props.contact,
    props.representativeContact,
    props.shoe,
    props.region,
    props.stage,
    props.tool,
  ].join(":");
}

const CARE_TARGETS = [
  "left-toe",
  "left-heel",
  "right-toe",
  "right-heel",
] as const satisfies readonly CareTarget[];
const RENDERER_PROP_FIELDS = [
  "shoe",
  "region",
  "careAmount",
  "motionMode",
  "contact",
  "representativeContact",
  "stage",
  "tool",
] as const;
const RENDERER_SHOES = ["left", "right"] as const;
const RENDERER_REGIONS = ["toe", "heel"] as const;
const RENDERER_MOTION_MODES = ["normal", "reduced", "still"] as const;
const RENDERER_CONTACTS = ["clear", "approach", "contact", "release"] as const;
const RENDERER_STAGES = [
  "compatibility",
  "prepare",
  "apply",
  "work",
  "water",
  "set",
  "finish",
  "complete",
] as const;
const RENDERER_TOOLS = [
  "cotton-cloth",
  "water-drop",
  "lustreur-glove",
] as const;
const RENDERER_OPTIONAL_PROP_FIELDS = [
  "domainFailureAcknowledged",
  "onCapabilityChange",
] as const;

export const CARE_TOOL_VALIDATION_VARIANTS = Object.freeze([
  "cotton-cloth",
  "water-drop",
  "lustreur-glove",
] as const satisfies readonly CareTool[]);

function exactOwnEnumerableData(
  value: unknown,
  expectedFields: readonly string[],
) {
  try {
    if (typeof value !== "object" || value === null) return null;
    const keys = Reflect.ownKeys(value);
    if (
      keys.length !== expectedFields.length ||
      keys.some(
        (key) =>
          typeof key !== "string" || !expectedFields.includes(key),
      )
    ) {
      return null;
    }

    const captured: Record<string, unknown> = Object.create(null);
    for (const field of expectedFields) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, field);
      if (!descriptor?.enumerable || !("value" in descriptor)) return null;
      captured[field] = descriptor.value;
    }
    return captured;
  } catch {
    return null;
  }
}

function isOneOf<T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T {
  return typeof value === "string" && choices.includes(value as T);
}

export function captureCareAmount(value: unknown): CareAmount | null {
  const captured = exactOwnEnumerableData(value, CARE_TARGETS);
  if (!captured) return null;
  if (
    !CARE_TARGETS.every((target) => {
      const amount = captured[target];
      return (
        typeof amount === "number" &&
        Number.isFinite(amount) &&
        amount >= 0 &&
        amount <= 1
      );
    })
  ) {
    return null;
  }
  return Object.freeze({
    "left-toe": captured["left-toe"] as number,
    "left-heel": captured["left-heel"] as number,
    "right-toe": captured["right-toe"] as number,
    "right-heel": captured["right-heel"] as number,
  });
}

export function captureRendererSemanticProps(
  value: unknown,
): RendererProps | null {
  const captured = exactOwnEnumerableData(value, RENDERER_PROP_FIELDS);
  if (!captured) return null;
  const careAmount = captureCareAmount(captured.careAmount);
  if (
    !careAmount ||
    !isOneOf(captured.shoe, RENDERER_SHOES) ||
    !isOneOf(captured.region, RENDERER_REGIONS) ||
    !isOneOf(captured.motionMode, RENDERER_MOTION_MODES) ||
    !isOneOf(captured.contact, RENDERER_CONTACTS) ||
    !isOneOf(captured.representativeContact, RENDERER_CONTACTS) ||
    !isOneOf(captured.stage, RENDERER_STAGES) ||
    !isOneOf(captured.tool, RENDERER_TOOLS)
  ) {
    return null;
  }
  const expectedTool: CareTool =
    captured.stage === "water"
      ? "water-drop"
      : captured.stage === "finish" || captured.stage === "complete"
        ? "lustreur-glove"
        : "cotton-cloth";
  if (
    captured.tool !== expectedTool ||
    ((captured.contact === "approach" || captured.contact === "contact") &&
      captured.stage !== "work" &&
      captured.stage !== "finish") ||
    (captured.stage === "complete" && captured.contact !== "release") ||
    (captured.motionMode !== "still" &&
      captured.representativeContact !== captured.contact)
  ) {
    return null;
  }
  return Object.freeze({
    shoe: captured.shoe,
    region: captured.region,
    careAmount,
    motionMode: captured.motionMode,
    contact: captured.contact,
    representativeContact: captured.representativeContact,
    stage: captured.stage,
    tool: captured.tool,
  });
}

export function captureRendererComponentBoundary(value: unknown) {
  try {
    if (typeof value !== "object" || value === null) return null;
    const keys = Reflect.ownKeys(value);
    const allowedFields: readonly string[] = [
      ...RENDERER_PROP_FIELDS,
      ...RENDERER_OPTIONAL_PROP_FIELDS,
    ];
    if (
      keys.some(
        (key) => typeof key !== "string" || !allowedFields.includes(key),
      ) ||
      RENDERER_PROP_FIELDS.some((field) => !keys.includes(field))
    ) {
      return null;
    }

    const semanticCandidate: Record<string, unknown> = Object.create(null);
    let domainFailureAcknowledged = false;
    let onCapabilityChange: ((available: boolean) => void) | undefined;
    for (const key of keys) {
      if (typeof key !== "string") return null;
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !("value" in descriptor)) return null;
      if ((RENDERER_PROP_FIELDS as readonly string[]).includes(key)) {
        semanticCandidate[key] = descriptor.value;
      } else if (key === "domainFailureAcknowledged") {
        if (
          descriptor.value !== undefined &&
          typeof descriptor.value !== "boolean"
        ) {
          return null;
        }
        domainFailureAcknowledged = descriptor.value ?? false;
      } else if (key === "onCapabilityChange") {
        if (
          descriptor.value !== undefined &&
          typeof descriptor.value !== "function"
        ) {
          return null;
        }
        onCapabilityChange = descriptor.value as
          | ((available: boolean) => void)
          | undefined;
      }
    }

    const rendererProps = captureRendererSemanticProps(semanticCandidate);
    if (!rendererProps) return null;
    return Object.freeze({
      rendererProps,
      domainFailureAcknowledged,
      onCapabilityChange,
    });
  } catch {
    return null;
  }
}

const INVALID_RENDERER_PROPS = Object.freeze({ invalid: true });

function careAmountFor(
  careAmount: CareAmount,
  shoe: CareShoe,
  region: CareRegion,
) {
  return careAmount[`${shoe}-${region}` as CareTarget];
}

type AdmiralMaterial = THREE.MeshPhysicalMaterial & {
  userData: {
    evenwardAdmiralDensity?: { value: number };
    evenwardRegion?: MaterialRegion;
  };
};

function addBuriedAdmiralAbsorption(
  material: AdmiralMaterial,
  density: number,
) {
  const densityUniform = { value: density };
  material.userData.evenwardAdmiralDensity = densityUniform;

  material.onBeforeCompile = (shader) => {
    const anchor = "#include <color_fragment>";
    if (!shader.fragmentShader.includes(anchor)) {
      throw new Error("The installed Three.js diffuse shader is incompatible.");
    }

    shader.uniforms.evenwardAdmiralWaxDensity = densityUniform;
    shader.fragmentShader = shader.fragmentShader.replace(
      anchor,
      `${anchor}
       // Buried diffuse only: this runs before reflected-light and direct-glint
       // composition and never changes the material's authored base-color value.
       float evenwardBuriedLuma = dot(
         diffuseColor.rgb,
         vec3(0.2126, 0.7152, 0.0722)
       );
       float evenwardDepthGate =
         smoothstep(${ADMIRAL_BURIED_LUMA_GATE.lowerStart}, ${ADMIRAL_BURIED_LUMA_GATE.lowerEnd}, evenwardBuriedLuma) *
         (1.0 - smoothstep(${ADMIRAL_BURIED_LUMA_GATE.upperStart}, ${ADMIRAL_BURIED_LUMA_GATE.upperEnd}, evenwardBuriedLuma));
       vec3 evenwardAdmiralAbsorption = exp(
         -evenwardAdmiralWaxDensity * vec3(1.00, 0.42, 0.00)
       );
       diffuseColor.rgb *= mix(
         vec3(1.0),
         evenwardAdmiralAbsorption,
         evenwardDepthGate
       );`,
    );
  };
  material.customProgramCacheKey = () => "evenward-admiral-diffuse-v1";
}

function makeLeatherMaterial(
  region: LeatherRegion,
  values: {
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    admiralDensity: number;
  },
  ownDisposable: OwnDisposable,
) {
  const material = ownDisposable(new THREE.MeshPhysicalMaterial({
    name: `evenward-${region}-leather`,
    color: BASE_LEATHER,
    roughness: values.roughness,
    metalness: 0,
    ior: IOR,
    specularIntensity: 1,
    specularColor: NEUTRAL_SPECULAR,
    clearcoat: values.clearcoat,
    clearcoatRoughness: values.clearcoatRoughness,
    transmission: 0,
    iridescence: 0,
    sheen: 0,
    envMapIntensity: ENVIRONMENT_INTENSITY,
  })) as AdmiralMaterial;
  material.userData.evenwardRegion = region;
  addBuriedAdmiralAbsorption(material, values.admiralDensity);
  return material;
}

function makeConstructionMaterial(
  region: "welt" | "sole",
  ownDisposable: OwnDisposable,
) {
  const range = FOOTWEAR_MATERIAL_RANGES[region];
  const material = ownDisposable(new THREE.MeshPhysicalMaterial({
    name: `evenward-${region}`,
    color: region === "sole" ? 0x080808 : BASE_LEATHER,
    roughness: midpoint(range.baseRoughness),
    metalness: 0,
    ior: IOR,
    specularIntensity: 1,
    specularColor: NEUTRAL_SPECULAR,
    clearcoat: midpoint(range.clearcoat),
    clearcoatRoughness:
      range.coatRoughness === null ? 0 : midpoint(range.coatRoughness),
    transmission: 0,
    iridescence: 0,
    sheen: 0,
    envMapIntensity: ENVIRONMENT_INTENSITY,
  }));
  material.userData.evenwardRegion = region;
  return material;
}

type MaterialSet = {
  toe: AdmiralMaterial;
  heel: AdmiralMaterial;
  side: AdmiralMaterial;
  flex: AdmiralMaterial;
  welt: THREE.MeshPhysicalMaterial;
  sole: THREE.MeshPhysicalMaterial;
};

function createMaterialSet(ownDisposable: OwnDisposable): MaterialSet {
  const toeRange = FOOTWEAR_MATERIAL_RANGES.toe;
  const heelRange = FOOTWEAR_MATERIAL_RANGES.heel;
  const sideRange = FOOTWEAR_MATERIAL_RANGES.side;
  const flexRange = FOOTWEAR_MATERIAL_RANGES.flex;

  return {
    toe: makeLeatherMaterial("toe", {
      roughness: midpoint(toeRange.baseRoughness),
      clearcoat: midpoint(toeRange.clearcoat),
      clearcoatRoughness: toeRange.coatRoughness[1],
      admiralDensity: 0.01,
    }, ownDisposable),
    heel: makeLeatherMaterial("heel", {
      roughness: midpoint(heelRange.baseRoughness),
      clearcoat: midpoint(heelRange.clearcoat),
      clearcoatRoughness: heelRange.coatRoughness[1],
      admiralDensity: 0.01,
    }, ownDisposable),
    side: makeLeatherMaterial("side", {
      roughness: midpoint(sideRange.baseRoughness),
      clearcoat: midpoint(sideRange.clearcoat),
      clearcoatRoughness: midpoint(sideRange.coatRoughness),
      admiralDensity: 0.007,
    }, ownDisposable),
    flex: makeLeatherMaterial("flex", {
      roughness: midpoint(flexRange.baseRoughness),
      clearcoat: midpoint(flexRange.clearcoat),
      clearcoatRoughness: flexCoatRoughnessFromControl(0.5),
      admiralDensity: 0.004,
    }, ownDisposable),
    welt: makeConstructionMaterial("welt", ownDisposable),
    sole: makeConstructionMaterial("sole", ownDisposable),
  };
}

function makeMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: readonly [number, number, number],
  scale: readonly [number, number, number] = [1, 1, 1],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function makeSeam(
  name: string,
  points: readonly THREE.Vector3[],
  material: THREE.Material,
  ownDisposable: OwnDisposable,
) {
  const path = new THREE.CatmullRomCurve3([...points], false, "centripetal");
  return makeMesh(
    name,
    ownDisposable(new THREE.TubeGeometry(path, 32, 0.00135, 6, false)),
    material,
    [0, 0, 0],
  );
}

function makeHorizontalCapsuleGeometry(
  radius: number,
  cylinderLength: number,
  capSegments: number,
  radialSegments: number,
  ownDisposable: OwnDisposable,
) {
  const geometry = ownDisposable(new THREE.CapsuleGeometry(
    radius,
    cylinderLength,
    capSegments,
    radialSegments,
  ));
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

function createReferenceShoe(
  materials: MaterialSet,
  ownDisposable: OwnDisposable,
) {
  const root = new THREE.Group();
  root.name = "evenward-procedural-reference-shoe";

  const sole = makeMesh(
    "sole-independent",
    makeHorizontalCapsuleGeometry(
      SOLE_CAPSULE_RADIUS_METERS,
      SOLE_CAPSULE_LENGTH_METERS,
      8,
      24,
      ownDisposable,
    ),
    materials.sole,
    [0, REFERENCE_SOLE_CENTER_Y_METERS, 0],
    SOLE_FINAL_SCALE,
  );
  sole.userData.evenwardRegion = "sole";

  const welt = makeMesh(
    "welt-independent",
    makeHorizontalCapsuleGeometry(
      WELT_CAPSULE_RADIUS_METERS,
      WELT_CAPSULE_LENGTH_METERS,
      8,
      24,
      ownDisposable,
    ),
    materials.welt,
    [0, REFERENCE_WELT_CENTER_Y_METERS, 0],
    WELT_FINAL_SCALE,
  );
  welt.userData.evenwardRegion = "welt";

  const toe = makeMesh(
    "toe-independent",
    ownDisposable(new THREE.SphereGeometry(1, 56, 28)),
    materials.toe,
    [0.088, 0.049, 0],
    [0.067, 0.033, 0.051],
  );
  toe.userData.evenwardRegion = "toe";

  const flex = makeMesh(
    "vamp-flex-independent",
    ownDisposable(new THREE.SphereGeometry(1, 56, 28)),
    materials.flex,
    [0.006, 0.055, 0],
    [0.077, 0.043, 0.046],
  );
  flex.userData.evenwardRegion = "flex";

  const heel = makeMesh(
    "heel-counter-independent",
    ownDisposable(new THREE.SphereGeometry(1, 48, 24)),
    materials.heel,
    [-0.105, 0.057, 0],
    [0.045, 0.055, 0.049],
  );
  heel.userData.evenwardRegion = "heel";

  const nearSide = makeMesh(
    "near-quarter-independent",
    ownDisposable(new THREE.BoxGeometry(0.122, 0.041, 0.005)),
    materials.side,
    [-0.028, 0.053, 0.047],
  );
  nearSide.rotation.z = -0.08;
  nearSide.userData.evenwardRegion = "side";

  const farSide = makeMesh(
    "far-quarter-independent",
    ownDisposable(new THREE.BoxGeometry(0.122, 0.041, 0.005)),
    materials.side,
    [-0.028, 0.053, -0.047],
  );
  farSide.rotation.z = -0.08;
  farSide.userData.evenwardRegion = "side";

  const toeJoin = makeSeam(
    "toe-cap-join-independent",
    [
      new THREE.Vector3(0.042, 0.054, -0.048),
      new THREE.Vector3(0.049, 0.079, 0),
      new THREE.Vector3(0.042, 0.054, 0.048),
    ],
    materials.welt,
    ownDisposable,
  );
  toeJoin.userData.evenwardRegion = "welt";

  const heelJoin = makeSeam(
    "heel-counter-seam-independent",
    [
      new THREE.Vector3(-0.073, 0.047, -0.045),
      new THREE.Vector3(-0.077, 0.091, 0),
      new THREE.Vector3(-0.073, 0.047, 0.045),
    ],
    materials.welt,
    ownDisposable,
  );
  heelJoin.userData.evenwardRegion = "welt";

  root.add(
    sole,
    welt,
    toe,
    flex,
    heel,
    nearSide,
    farSide,
    toeJoin,
    heelJoin,
  );
  return root;
}

const REQUIRED_REFERENCE_SHOE_MESHES = [
  "sole-independent",
  "welt-independent",
  "toe-independent",
  "vamp-flex-independent",
  "heel-counter-independent",
  "near-quarter-independent",
  "far-quarter-independent",
  "toe-cap-join-independent",
  "heel-counter-seam-independent",
] as const;

export function hasRequiredReferenceShoeGeometry(
  root: THREE.Object3D,
  camera?: THREE.Camera,
) {
  if (!root.visible) return false;
  return REQUIRED_REFERENCE_SHOE_MESHES.every((name) => {
    const object = root.getObjectByName(name);
    if (!(object instanceof THREE.Mesh)) return false;

    let ancestor: THREE.Object3D | null = object;
    while (ancestor) {
      if (
        !ancestor.visible ||
        !Number.isFinite(ancestor.scale.x) ||
        !Number.isFinite(ancestor.scale.y) ||
        !Number.isFinite(ancestor.scale.z) ||
        ancestor.scale.x === 0 ||
        ancestor.scale.y === 0 ||
        ancestor.scale.z === 0
      ) {
        return false;
      }
      if (ancestor === root) break;
      ancestor = ancestor.parent;
    }
    if (ancestor !== root) return false;
    if (camera && !object.layers.test(camera.layers)) return false;

    const positions = object.geometry.getAttribute("position");
    const availableCount = object.geometry.index?.count ?? positions?.count ?? 0;
    const { start, count } = object.geometry.drawRange;
    const effectiveCount = Number.isFinite(count)
      ? Math.min(count, availableCount - start)
      : availableCount - start;
    if (
      positions === undefined ||
      positions.count < 1 ||
      !Number.isFinite(start) ||
      start < 0 ||
      effectiveCount <= 0
    ) {
      return false;
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    return materials.some(
      (material) =>
        material.visible &&
        material.colorWrite &&
        Number.isFinite(material.opacity) &&
        material.opacity > 0,
    );
  });
}

function createOtherShoeProxy(
  polishedMaterial: THREE.MeshPhysicalMaterial,
  ownDisposable: OwnDisposable,
) {
  const root = new THREE.Group();
  root.name = "other-shoe-visible-proxy";
  const meshes = [
    makeMesh(
      "other-shoe-sole",
      makeHorizontalCapsuleGeometry(
        SOLE_CAPSULE_RADIUS_METERS,
        SOLE_CAPSULE_LENGTH_METERS,
        6,
        16,
        ownDisposable,
      ),
      polishedMaterial,
      [0, REFERENCE_SOLE_CENTER_Y_METERS, 0],
      SOLE_FINAL_SCALE,
    ),
    makeMesh(
      "other-shoe-upper",
      ownDisposable(new THREE.SphereGeometry(1, 24, 14)),
      polishedMaterial,
      [0.02, 0.052, 0],
      [0.13, 0.04, 0.049],
    ),
  ];
  root.add(...meshes);
  root.rotation.y = -0.12;
  root.position.set(-0.035, 0, -0.245);
  return { root, meshes };
}

function addCalibrationHall(
  scene: THREE.Scene,
  ownDisposable: OwnDisposable,
) {
  const hall = new THREE.Group();
  hall.name = "generated-local-calibration-hall";

  const floorMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0x77736c,
    roughness: 0.72,
    metalness: 0,
  }));
  const wallMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0x423f3b,
    roughness: 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
  }));
  const seamMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0x161718,
    roughness: 0.6,
    metalness: 0,
  }));
  const mullionMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0x202529,
    roughness: 0.38,
    metalness: 0,
  }));
  const windowMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0x8fb1bc,
    emissive: 0x385768,
    emissiveIntensity: 2.1,
    roughness: 0.25,
    metalness: 0,
    side: THREE.DoubleSide,
  }));

  const floor = makeMesh(
    "floor",
    ownDisposable(new THREE.PlaneGeometry(3.2, 3.2)),
    floorMaterial,
    [0, 0, 0],
  );
  floor.rotation.x = -Math.PI / 2;
  hall.add(floor);

  const backWall = makeMesh(
    "back-wall",
    ownDisposable(new THREE.PlaneGeometry(3.2, 1.8)),
    wallMaterial,
    [0, 0.9, -1.35],
  );
  hall.add(backWall);

  const sideWall = makeMesh(
    "side-wall",
    ownDisposable(new THREE.PlaneGeometry(3.2, 1.8)),
    wallMaterial,
    [-1.35, 0.9, 0],
  );
  sideWall.rotation.y = Math.PI / 2;
  hall.add(sideWall);

  for (let index = -3; index <= 3; index += 1) {
    hall.add(
      makeMesh(
        `floor-seam-x-${index}`,
        ownDisposable(new THREE.BoxGeometry(3.0, 0.001, 0.004)),
        seamMaterial,
        [0, 0.0012, index * 0.3],
      ),
      makeMesh(
        `floor-seam-z-${index}`,
        ownDisposable(new THREE.BoxGeometry(0.004, 0.001, 3.0)),
        seamMaterial,
        [index * 0.3, 0.0013, 0],
      ),
    );
  }

  for (let windowIndex = -1; windowIndex <= 1; windowIndex += 1) {
    const centerX = windowIndex * 0.58;
    hall.add(
      makeMesh(
        `window-${windowIndex}`,
        ownDisposable(new THREE.PlaneGeometry(0.48, 0.84)),
        windowMaterial,
        [centerX, 0.99, -1.342],
      ),
    );
    for (const mullionX of [-0.12, 0, 0.12]) {
      hall.add(
        makeMesh(
          `window-${windowIndex}-vertical-${mullionX}`,
          ownDisposable(new THREE.BoxGeometry(0.018, 0.86, 0.018)),
          mullionMaterial,
          [centerX + mullionX, 0.99, -1.33],
        ),
      );
    }
    for (const mullionY of [0.84, 1.12]) {
      hall.add(
        makeMesh(
          `window-${windowIndex}-horizontal-${mullionY}`,
          ownDisposable(new THREE.BoxGeometry(0.5, 0.018, 0.018)),
          mullionMaterial,
          [centerX, mullionY, -1.33],
        ),
      );
    }
  }

  const lampMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0xffcf8a,
    emissive: 0xff9a46,
    emissiveIntensity: 3.2,
    roughness: 0.5,
    metalness: 0,
  }));
  hall.add(
    makeMesh(
      "warm-lamp-visible-source",
      ownDisposable(new THREE.SphereGeometry(0.025, 18, 12)),
      lampMaterial,
      [-0.52, 0.52, 0.22],
    ),
  );
  const warmLamp = new THREE.PointLight(0xffa85f, 8, 2.4, 2);
  warmLamp.name = "warm-lamp-radiance";
  warmLamp.position.set(-0.52, 0.52, 0.22);
  hall.add(warmLamp);

  scene.add(hall);
  return hall;
}

function createCareTool(ownDisposable: OwnDisposable) {
  const anchor = new THREE.Group();
  anchor.name = "care-contact-anchor";
  const tool = new THREE.Group();
  tool.name = "care-tool-presentation";

  const cottonMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0xc9bda6,
    roughness: 0.92,
    metalness: 0,
  }));
  const waterMaterial = ownDisposable(new THREE.MeshPhysicalMaterial({
    color: 0x7ccbd9,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.35,
    thickness: 0.008,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  }));
  const finishingMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0xf2efe5,
    roughness: 0.78,
    metalness: 0,
  }));
  const handMaterial = ownDisposable(new THREE.MeshStandardMaterial({
    color: 0x9a958b,
    roughness: 0.78,
    metalness: 0,
  }));

  const cottonCloth = makeMesh(
    "cotton-cloth-contact-surface",
    ownDisposable(new THREE.BoxGeometry(0.046, 0.003, 0.032)),
    cottonMaterial,
    [0, 0, 0],
  );
  const waterDrop = makeMesh(
    "single-water-drop-contact-marker",
    ownDisposable(new THREE.SphereGeometry(0.009, 24, 16)),
    waterMaterial,
    [0, 0.008, 0],
    [0.78, 1.25, 0.78],
  );
  const finishingCloth = makeMesh(
    "lustreur-glove-contact-surface",
    ownDisposable(new THREE.CylinderGeometry(0.021, 0.021, 0.004, 32)),
    finishingMaterial,
    [0, 0.001, 0],
  );
  const hand = makeMesh(
    "simple-hand",
    ownDisposable(new THREE.CapsuleGeometry(0.017, 0.052, 8, 14)),
    handMaterial,
    [0, 0.043, 0],
    [1, 0.82, 0.8],
  );
  hand.rotation.z = Math.PI / 2;
  tool.add(cottonCloth, waterDrop, finishingCloth, hand);
  anchor.add(tool);
  return { anchor, tool, cottonCloth, waterDrop, finishingCloth, hand };
}

export function isRenderableCareToolMesh(object: unknown) {
  if (!(object instanceof THREE.Mesh)) return false;
  const positions = object.geometry.getAttribute("position");
  const availableCount = object.geometry.index?.count ?? positions?.count ?? 0;
  const { start, count } = object.geometry.drawRange;
  const effectiveCount = Number.isFinite(count)
    ? Math.min(count, availableCount - start)
    : availableCount - start;
  if (
    !positions ||
    positions.count < 1 ||
    !Number.isFinite(start) ||
    start < 0 ||
    effectiveCount <= 0
  ) {
    return false;
  }
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material];
  return materials.some(
    (material) =>
      material.visible &&
      material.colorWrite &&
      Number.isFinite(material.opacity) &&
      material.opacity > 0,
  );
}

export function hasRenderableCareToolPrimaries(value: unknown) {
  const primaries = exactOwnEnumerableData(
    value,
    CARE_TOOL_VALIDATION_VARIANTS,
  );
  if (!primaries) return false;
  return CARE_TOOL_VALIDATION_VARIANTS.every((tool) =>
    isRenderableCareToolMesh(primaries[tool]),
  );
}

function setCareToolPresentation(
  care: ReturnType<typeof createCareTool>,
  props: Pick<RendererProps, "stage" | "tool">,
) {
  care.cottonCloth.visible = props.tool === "cotton-cloth";
  care.waterDrop.visible = props.tool === "water-drop";
  care.finishingCloth.visible = props.tool === "lustreur-glove";
  care.hand.visible = props.tool !== "water-drop";
  care.anchor.visible = (
    ["apply", "work", "water", "finish"] as CareStage[]
  ).includes(props.stage);
}

function setCareAnchor(
  anchor: THREE.Group,
  region: RendererProps["region"],
  shoe: RendererProps["shoe"],
) {
  const locator = PROCEDURAL_CONTACT_ANCHORS[region];
  anchor.position.set(
    locator.position[0],
    locator.position[1],
    locator.position[2],
  );
  anchor.rotation.set(0, 0, locator.rotationZ);
  anchor.scale.set(1, 1, shoe === "left" ? -1 : 1);
  // Tool-specific face offsets use the toe's upward normal or the heel's
  // quarter-turned rear normal. These are procedural placement locators only.
}

function setCarePose(
  tool: THREE.Group,
  props: RendererProps,
  nowMilliseconds: number,
  phaseElapsedMilliseconds = Number.POSITIVE_INFINITY,
) {
  const poseContact =
    props.motionMode === "still" ? props.representativeContact : props.contact;
  const faceOffset = TOOL_CONTACT_OFFSETS_METERS[props.region][props.tool];
  tool.position.set(0, faceOffset, 0);
  switch (poseContact) {
    case "clear":
      tool.position.set(-0.012, 0.048 + faceOffset, 0);
      break;
    case "approach":
      if (props.motionMode === "reduced") {
        const progress = THREE.MathUtils.smoothstep(
          Math.min(1, phaseElapsedMilliseconds / 900),
          0,
          1,
        );
        tool.position.set(
          THREE.MathUtils.lerp(-0.012, -0.006, progress),
          THREE.MathUtils.lerp(0.048, 0.018, progress) + faceOffset,
          0,
        );
      } else {
        tool.position.set(-0.006, 0.018 + faceOffset, 0);
      }
      break;
    case "contact":
      // The modeled face reaches the authored procedural locator. This is a
      // placement invariant, not evidence of physical contact or pressure.
      break;
    case "release":
      if (props.motionMode === "reduced") {
        const progress = THREE.MathUtils.smoothstep(
          Math.min(1, phaseElapsedMilliseconds / 900),
          0,
          1,
        );
        tool.position.set(
          THREE.MathUtils.lerp(0, 0.012, progress),
          THREE.MathUtils.lerp(0, 0.034, progress) + faceOffset,
          0,
        );
      } else {
        tool.position.set(0.012, 0.034 + faceOffset, 0);
      }
      break;
  }

  if (poseContact !== "contact" || props.motionMode === "still") {
    return;
  }

  if (props.motionMode === "reduced") {
    // Semantic contact is already committed when contact is "contact". Keep
    // the modeled face on the locator rather than lagging contact truth behind
    // a presentation-only approach animation.
    return;
  }

  // A 2 Hz sine reaches two extrema per cycle: four reversals each second.
  // The 12 mm peak-to-peak travel sits inside the authored 8–18 mm range.
  const cyclesPerSecond = NORMAL_REVERSALS_PER_SECOND / 2;
  const seconds = nowMilliseconds / 1000;
  tool.position.x =
    (NORMAL_TRAVEL_METERS / 2) *
    Math.sin(Math.PI * 2 * cyclesPerSecond * seconds);
}

export function runIndependentCleanupSteps(
  steps: readonly (() => void)[],
) {
  for (const step of steps) {
    try {
      step();
    } catch {
      // Cleanup is best-effort per resource; one faulty disposer must not
      // prevent later context, renderer, listener, or DOM cleanup steps.
    }
  }
}

type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;

function assertNoWebGLErrors(context: WebGLContext, operation: string) {
  const firstError = context.getError();
  if (firstError === context.NO_ERROR) return;

  // Drain the bounded error queue so a failed validation cannot contaminate a
  // later recovery transaction. The first error is enough to reject output.
  for (let index = 0; index < 31; index += 1) {
    if (context.getError() === context.NO_ERROR) break;
  }
  throw new Error(`${operation} produced WebGL error ${firstError}.`);
}

function validateCubeFaceFramebuffers(
  renderer: THREE.WebGLRenderer,
  target: THREE.WebGLCubeRenderTarget,
) {
  const context = renderer.getContext();
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace();
  const previousMipmapLevel = renderer.getActiveMipmapLevel();
  const previousGenerateMipmaps = target.texture.generateMipmaps;

  try {
    assertNoWebGLErrors(context, "Cube capture");
    // CubeCamera has already produced the mip chain. Suppress regeneration
    // while binding each face solely to inspect its framebuffer.
    target.texture.generateMipmaps = false;
    for (let face = 0; face < 6; face += 1) {
      renderer.setRenderTarget(target, face, 0);
      if (
        context.checkFramebufferStatus(context.FRAMEBUFFER) !==
        context.FRAMEBUFFER_COMPLETE
      ) {
        throw new Error(`Cube framebuffer face ${face} is incomplete.`);
      }
      assertNoWebGLErrors(context, `Cube framebuffer face ${face}`);
    }
  } finally {
    try {
      renderer.setRenderTarget(
        previousTarget,
        previousFace,
        previousMipmapLevel,
      );
    } finally {
      target.texture.generateMipmaps = previousGenerateMipmaps;
    }
  }
  assertNoWebGLErrors(context, "Cube framebuffer restoration");
}

function validateReferenceShoeLandmarks(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  targetShoe: THREE.Group,
) {
  const context = renderer.getContext();
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace();
  const previousMipmapLevel = renderer.getActiveMipmapLevel();
  const previousTargetVisibility = targetShoe.visible;
  const previousTargetScale = targetShoe.scale.clone();
  const previousCameraPosition = camera.position.clone();
  const previousCameraQuaternion = camera.quaternion.clone();
  const targetMeshes: THREE.Mesh[] = [];
  targetShoe.traverse((object) => {
    if (object instanceof THREE.Mesh) targetMeshes.push(object);
  });
  const previousMeshVisibilities = targetMeshes.map((mesh) => ({
    mesh,
    visible: mesh.visible,
  }));
  const requiredMeshes = REQUIRED_REFERENCE_SHOE_MESHES.map(
    (name) => targetShoe.getObjectByName(name) as THREE.Mesh,
  );
  const dimension = 64;
  const target = new THREE.WebGLRenderTarget(dimension, dimension, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  const baseline = new Uint8Array(dimension * dimension * 4);
  const rendered = new Uint8Array(dimension * dimension * 4);

  try {
    assertNoWebGLErrors(context, "Reference-shoe landmark preflight");
    renderer.setRenderTarget(target);
    if (
      context.checkFramebufferStatus(context.FRAMEBUFFER) !==
      context.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error("The reference-shoe landmark framebuffer is incomplete.");
    }

    for (const shoe of ["left", "right"] as const) {
      targetShoe.scale.z = shoe === "left" ? -1 : 1;
      for (const region of ["toe", "heel"] as const) {
        setReferenceCameraPose(camera, shoe, region);
        targetShoe.visible = false;
        baseline.fill(0);
        renderer.render(scene, camera);
        context.readPixels(
          0,
          0,
          dimension,
          dimension,
          context.RGBA,
          context.UNSIGNED_BYTE,
          baseline,
        );
        assertNoWebGLErrors(
          context,
          `Reference-shoe baseline ${shoe} ${region} readback`,
        );

        targetShoe.visible = true;
        for (const requiredMesh of requiredMeshes) {
          targetMeshes.forEach((mesh) => {
            mesh.visible = mesh === requiredMesh;
          });
          rendered.fill(0);
          renderer.render(scene, camera);
          context.readPixels(
            0,
            0,
            dimension,
            dimension,
            context.RGBA,
            context.UNSIGNED_BYTE,
            rendered,
          );
          assertNoWebGLErrors(
            context,
            `Reference-shoe landmark ${shoe} ${region} ${requiredMesh.name} readback`,
          );

          let changedPixels = 0;
          for (let index = 0; index < rendered.length; index += 4) {
            const rgbDifference =
              Math.abs(rendered[index] - baseline[index]) +
              Math.abs(rendered[index + 1] - baseline[index + 1]) +
              Math.abs(rendered[index + 2] - baseline[index + 2]);
            if (rgbDifference >= 8 && rendered[index + 3] !== 0) {
              changedPixels += 1;
            }
          }
          if (changedPixels < 2) {
            throw new Error(
              `Required shoe mesh ${shoe} ${region} ${requiredMesh.name} did not replace baseline pixels.`,
            );
          }
        }
      }
    }
  } finally {
    targetShoe.visible = previousTargetVisibility;
    targetShoe.scale.copy(previousTargetScale);
    camera.position.copy(previousCameraPosition);
    camera.quaternion.copy(previousCameraQuaternion);
    camera.updateMatrixWorld();
    previousMeshVisibilities.forEach(({ mesh, visible }) => {
      mesh.visible = visible;
    });
    try {
      renderer.setRenderTarget(
        previousTarget,
        previousFace,
        previousMipmapLevel,
      );
    } finally {
      target.dispose();
    }
  }
  assertNoWebGLErrors(context, "Reference-shoe landmark restoration");
}

function validateCareToolVariants(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  care: ReturnType<typeof createCareTool>,
) {
  const context = renderer.getContext();
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace();
  const previousMipmapLevel = renderer.getActiveMipmapLevel();
  const previousAnchorVisibility = care.anchor.visible;
  const previousAnchorPosition = care.anchor.position.clone();
  const previousAnchorQuaternion = care.anchor.quaternion.clone();
  const previousAnchorScale = care.anchor.scale.clone();
  const previousToolPosition = care.tool.position.clone();
  const previousCameraPosition = camera.position.clone();
  const previousCameraQuaternion = camera.quaternion.clone();
  const careMeshes: THREE.Mesh[] = [];
  care.anchor.traverse((object) => {
    if (object instanceof THREE.Mesh) careMeshes.push(object);
  });
  const previousMeshVisibilities = careMeshes.map((mesh) => ({
    mesh,
    visible: mesh.visible,
  }));
  const primaryMeshes: Readonly<Record<CareTool, THREE.Mesh>> = {
    "cotton-cloth": care.cottonCloth,
    "water-drop": care.waterDrop,
    "lustreur-glove": care.finishingCloth,
  };
  if (!hasRenderableCareToolPrimaries(primaryMeshes)) {
    throw new Error("A required care-tool primary is not renderable.");
  }
  if (!isRenderableCareToolMesh(care.hand)) {
    throw new Error("The care-tool hand surface is not independently renderable.");
  }
  const outputVariants: readonly {
    label: string;
    tool: CareTool;
    visibleMeshes: readonly THREE.Mesh[];
  }[] = [
    ...CARE_TOOL_VALIDATION_VARIANTS.map((tool) => ({
      label: `${tool}-primary`,
      tool,
      visibleMeshes: [primaryMeshes[tool]],
    })),
    {
      label: "hand-independent",
      tool: "cotton-cloth",
      visibleMeshes: [care.hand],
    },
    {
      label: "cotton-cloth-with-hand",
      tool: "cotton-cloth",
      visibleMeshes: [care.cottonCloth, care.hand],
    },
    {
      label: "lustreur-glove-with-hand",
      tool: "lustreur-glove",
      visibleMeshes: [care.finishingCloth, care.hand],
    },
  ];
  const dimension = 64;
  const target = new THREE.WebGLRenderTarget(dimension, dimension, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  const baseline = new Uint8Array(dimension * dimension * 4);
  const rendered = new Uint8Array(dimension * dimension * 4);

  try {
    assertNoWebGLErrors(context, "Care-tool validation preflight");
    renderer.setRenderTarget(target);
    if (
      context.checkFramebufferStatus(context.FRAMEBUFFER) !==
      context.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error("The care-tool validation framebuffer is incomplete.");
    }

    for (const shoe of ["left", "right"] as const) {
      for (const region of ["toe", "heel"] as const) {
        setReferenceCameraPose(camera, shoe, region);
        setCareAnchor(care.anchor, region, shoe);
        care.anchor.visible = false;
        baseline.fill(0);
        renderer.render(scene, camera);
        context.readPixels(
          0,
          0,
          dimension,
          dimension,
          context.RGBA,
          context.UNSIGNED_BYTE,
          baseline,
        );
        assertNoWebGLErrors(
          context,
          `Care-tool baseline ${shoe} ${region} readback`,
        );

        care.anchor.visible = true;
        for (const variant of outputVariants) {
          careMeshes.forEach((mesh) => {
            mesh.visible = variant.visibleMeshes.some(
              (visibleMesh) => visibleMesh === mesh,
            );
          });
          care.tool.position.set(
            0,
            TOOL_CONTACT_OFFSETS_METERS[region][variant.tool],
            0,
          );
          rendered.fill(0);
          renderer.render(scene, camera);
          context.readPixels(
            0,
            0,
            dimension,
            dimension,
            context.RGBA,
            context.UNSIGNED_BYTE,
            rendered,
          );
          assertNoWebGLErrors(
            context,
            `Care-tool variant ${shoe} ${region} ${variant.label} readback`,
          );

          let changedPixels = 0;
          for (let index = 0; index < rendered.length; index += 4) {
            const rgbDifference =
              Math.abs(rendered[index] - baseline[index]) +
              Math.abs(rendered[index + 1] - baseline[index + 1]) +
              Math.abs(rendered[index + 2] - baseline[index + 2]);
            if (rgbDifference >= 8 && rendered[index + 3] !== 0) {
              changedPixels += 1;
            }
          }
          if (changedPixels < 2) {
            throw new Error(
              `Care-tool variant ${shoe} ${region} ${variant.label} did not replace baseline pixels.`,
            );
          }
        }
      }
    }
  } finally {
    care.anchor.visible = previousAnchorVisibility;
    care.anchor.position.copy(previousAnchorPosition);
    care.anchor.quaternion.copy(previousAnchorQuaternion);
    care.anchor.scale.copy(previousAnchorScale);
    care.tool.position.copy(previousToolPosition);
    camera.position.copy(previousCameraPosition);
    camera.quaternion.copy(previousCameraQuaternion);
    camera.updateMatrixWorld();
    previousMeshVisibilities.forEach(({ mesh, visible }) => {
      mesh.visible = visible;
    });
    try {
      renderer.setRenderTarget(
        previousTarget,
        previousFace,
        previousMipmapLevel,
      );
    } finally {
      target.dispose();
    }
  }
  assertNoWebGLErrors(context, "Care-tool validation restoration");
}

function renderAndValidatePresentation(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
) {
  const context = renderer.getContext();
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace();
  const previousMipmapLevel = renderer.getActiveMipmapLevel();

  try {
    assertNoWebGLErrors(context, "Presentation preflight");
    renderer.setRenderTarget(null);
    if (
      context.checkFramebufferStatus(context.FRAMEBUFFER) !==
      context.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error("The presentation framebuffer is incomplete.");
    }

    renderer.render(scene, camera);
    assertNoWebGLErrors(context, "Presentation render");

    const width = context.drawingBufferWidth;
    const height = context.drawingBufferHeight;
    if (width < 1 || height < 1) {
      throw new Error("The presentation drawing buffer has no readable area.");
    }
    const pixel = new Uint8Array(4);
    context.readPixels(
      Math.floor(width / 2),
      Math.floor(height / 2),
      1,
      1,
      context.RGBA,
      context.UNSIGNED_BYTE,
      pixel,
    );
    assertNoWebGLErrors(context, "Presentation readback");
    // A separate offscreen baseline comparison proves registered shoe output.
    // This default-buffer read only proves that presentation readback succeeds.
    if (pixel[3] === 0) {
      throw new Error("The presentation readback did not contain opaque output.");
    }
  } finally {
    renderer.setRenderTarget(
      previousTarget,
      previousFace,
      previousMipmapLevel,
    );
  }
  assertNoWebGLErrors(context, "Presentation framebuffer restoration");
}

type RuntimeHandle = {
  applyProps: (props: unknown) => boolean;
};

const wrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "20rem",
  overflow: "hidden",
  borderRadius: "1rem",
  background: "#17191b",
};

const errorStyle: CSSProperties = {
  position: "absolute",
  zIndex: 2,
  inset: 0,
  display: "grid",
  placeItems: "center",
  padding: "1.25rem",
  color: "#f4f1e8",
  background: "rgba(18, 20, 22, 0.96)",
  textAlign: "center",
  lineHeight: 1.5,
};

/**
 * Pre-production, locally generated reference renderer.
 *
 * It exercises regional material ownership, a real physical-material WebGL
 * path, a locally generated cubemap input, and care-contact motion. Three.js
 * remains responsible for filtering that cubemap for physical-material
 * sampling; this reference makes no raw-mip or sharp-capture assertion. It
 * deliberately does not claim the authored production shoe mesh/textures,
 * confidence-weighted SSR, full box-projection parity, projected-pixel resource
 * tiers, device evidence, or independent optical/accessibility sign-off.
 */
export function LeatherFootwearRenderer(
  untrustedProps: LeatherFootwearRendererProps,
) {
  const capturedBoundary = captureRendererComponentBoundary(untrustedProps);
  const rendererProps = capturedBoundary?.rendererProps ?? null;
  const domainFailureAcknowledged =
    capturedBoundary?.domainFailureAcknowledged ?? false;
  const onCapabilityChange = capturedBoundary?.onCapabilityChange;
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<RuntimeHandle | null>(null);
  const callbackRef = useRef(onCapabilityChange);
  const publishedCapabilityRef = useRef<boolean | null>(null);
  const currentPropsRef = useRef<unknown>(
    rendererProps ?? INVALID_RENDERER_PROPS,
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [capability, setCapability] = useState<
    "checking" | "available" | "unavailable"
  >("checking");
  const [resourceGeneration, setResourceGeneration] = useState(0);

  useEffect(() => {
    callbackRef.current = onCapabilityChange;
    if (publishedCapabilityRef.current !== null) {
      try {
        onCapabilityChange?.(publishedCapabilityRef.current);
      } catch {
        // Consumer callback failures cannot escape the renderer boundary.
      }
    }
  }, [onCapabilityChange]);

  useEffect(() => {
    const nextProps: unknown = rendererProps ?? INVALID_RENDERER_PROPS;
    if (runtimeRef.current) {
      runtimeRef.current.applyProps(nextProps);
    } else {
      currentPropsRef.current = nextProps;
    }
  }, [rendererProps]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let alive = true;
    let frameRequest: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let fallbackResize: (() => void) | null = null;
    let contextLost = false;
    let runtimeFailed = false;
    let probeDirty = true;
    let renderDirty = true;
    let cubeFramebuffersValidated = false;
    let outputValidated = false;
    let presentationValidated = false;
    let appliedShoe: CareShoe | null = null;
    let appliedProps: RendererProps | null = null;
    let appliedPoseKey = "";
    let poseStartedAt = performance.now();
    let reducedBoundaryFinished = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let cubeTarget: THREE.WebGLCubeRenderTarget | null = null;
    let roughProxyMaterial: THREE.MeshPhysicalMaterial | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let onContextLost: ((event: Event) => void) | null = null;
    let onContextRestored: (() => void) | null = null;
    let tornDown = false;
    let setupComplete = false;
    const disposableOwnership = createDisposableOwnershipLedger();

    const publishCapability = (available: boolean) => {
      if (!alive) return;
      if (publishedCapabilityRef.current !== available) {
        publishedCapabilityRef.current = available;
        try {
          callbackRef.current?.(available);
        } catch {
          // Consumer callback failures cannot escape the renderer boundary.
        }
        setCapability(available ? "available" : "unavailable");
      }
    };

    const fail = (message: string) => {
      if (!alive) return;
      setFailure(message);
      publishCapability(false);
    };

    const teardown = () => {
      if (tornDown) return;
      tornDown = true;
      alive = false;
      runtimeRef.current = null;

      const pendingFrame = frameRequest;
      frameRequest = null;
      const cleanupResizeObserver = resizeObserver;
      resizeObserver = null;
      const cleanupFallbackResize = fallbackResize;
      fallbackResize = null;
      const cleanupCanvas = canvas;
      canvas = null;
      const cleanupContextLost = onContextLost;
      onContextLost = null;
      const cleanupContextRestored = onContextRestored;
      onContextRestored = null;
      runIndependentCleanupSteps([
        () => {
          if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
        },
        () => cleanupResizeObserver?.disconnect(),
        () => {
          if (cleanupFallbackResize) {
            window.removeEventListener("resize", cleanupFallbackResize);
          }
        },
        () => {
          if (cleanupCanvas && cleanupContextLost) {
            cleanupCanvas.removeEventListener(
              "webglcontextlost",
              cleanupContextLost,
              false,
            );
          }
        },
        () => {
          if (cleanupCanvas && cleanupContextRestored) {
            cleanupCanvas.removeEventListener(
              "webglcontextrestored",
              cleanupContextRestored,
              false,
            );
          }
        },
        () => disposableOwnership.disposeAll(),
        () => renderer?.renderLists.dispose(),
        () => renderer?.dispose(),
        () => renderer?.forceContextLoss(),
        () => scene?.clear(),
        () => {
          if (cleanupCanvas?.parentNode === host) {
            host.removeChild(cleanupCanvas);
          }
        },
      ]);
    };

    try {
      const activeCanvas = document.createElement("canvas");
      canvas = activeCanvas;
      activeCanvas.setAttribute("aria-hidden", "true");
      activeCanvas.setAttribute("role", "presentation");
      activeCanvas.tabIndex = -1;
      activeCanvas.style.display = "block";
      activeCanvas.style.width = "100%";
      activeCanvas.style.height = "100%";
      activeCanvas.style.minHeight = "20rem";
      activeCanvas.style.pointerEvents = "none";
      activeCanvas.style.touchAction = "pan-y";

      renderer = new THREE.WebGLRenderer({
        canvas: activeCanvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.AgXToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setClearColor(0x17191b, 1);
      host.appendChild(activeCanvas);

      scene = new THREE.Scene();
      scene.name = "evenward-footwear-reference-scene";
      scene.background = new THREE.Color(0x17191b);

      const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 6);
      setReferenceCameraPose(camera, "left", "toe");

      scene.add(new THREE.HemisphereLight(0xc7d7dc, 0x332c27, 1.25));
      const keyLight = new THREE.DirectionalLight(0xf3eee3, 1.4);
      keyLight.position.set(0.3, 0.7, 0.55);
      scene.add(keyLight);

      // A true point source keeps the direct response concentrated; this
      // component has no bloom or post-processing pass.
      const pinLight = new THREE.PointLight(0xffffff, 5.5, 0.9, 2);
      pinLight.name = "pin-glint-point-source";
      pinLight.position.set(0.16, 0.22, 0.18);
      scene.add(pinLight);

      addCalibrationHall(scene, disposableOwnership.own);

      const materials = createMaterialSet(disposableOwnership.own);
      const targetShoe = createReferenceShoe(
        materials,
        disposableOwnership.own,
      );
      scene.add(targetShoe);

      const otherPolishedMaterial = disposableOwnership.own(new THREE.MeshPhysicalMaterial({
        name: "other-shoe-polished-reference",
        color: BASE_LEATHER,
        roughness: 0.18,
        metalness: 0,
        ior: IOR,
        specularIntensity: 1,
        specularColor: NEUTRAL_SPECULAR,
        clearcoat: 0.98,
        clearcoatRoughness: 0.018,
        transmission: 0,
        iridescence: 0,
        sheen: 0,
        envMapIntensity: ENVIRONMENT_INTENSITY,
      }));
      const otherShoe = createOtherShoeProxy(
        otherPolishedMaterial,
        disposableOwnership.own,
      );
      scene.add(otherShoe.root);

      roughProxyMaterial = disposableOwnership.own(new THREE.MeshPhysicalMaterial({
        name: "other-shoe-capture-rough-proxy",
        color: BASE_LEATHER,
        roughness: 0.48,
        metalness: 0,
        ior: IOR,
        specularIntensity: 1,
        specularColor: NEUTRAL_SPECULAR,
        clearcoat: 0.1,
        clearcoatRoughness: 0.34,
        transmission: 0,
        iridescence: 0,
        sheen: 0,
      }));

      const care = createCareTool(disposableOwnership.own);
      scene.add(care.anchor);

      cubeTarget = disposableOwnership.own(new THREE.WebGLCubeRenderTarget(PROBE_RESOLUTION, {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
      }));
      cubeTarget.texture.name = "evenward-local-calibration-cube-reference";
      cubeTarget.texture.colorSpace = THREE.LinearSRGBColorSpace;
      cubeTarget.texture.mapping = THREE.CubeReflectionMapping;

      const cubeCamera = new THREE.CubeCamera(0.01, 6, cubeTarget);
      cubeCamera.name = "local-footwear-cube-camera-reference";
      cubeCamera.position.set(0, 0.06, 0);
      scene.add(cubeCamera);

      for (const material of Object.values(materials)) {
        material.envMap = cubeTarget.texture;
        material.needsUpdate = true;
      }
      otherPolishedMaterial.envMap = cubeTarget.texture;
      otherPolishedMaterial.needsUpdate = true;

      const captureProbe = () => {
        if (
          !renderer ||
          !scene ||
          !cubeTarget ||
          !roughProxyMaterial ||
          contextLost
        ) {
          return;
        }

        const targetWasVisible = targetShoe.visible;
        const targetLayerMask = targetShoe.layers.mask;
        const proxyState = otherShoe.meshes.map((mesh) => ({
          mesh,
          material: mesh.material,
          visible: mesh.visible,
          layerMask: mesh.layers.mask,
        }));
        const previousRenderTarget = renderer.getRenderTarget();
        const previousActiveCubeFace = renderer.getActiveCubeFace();
        const previousActiveMipmapLevel = renderer.getActiveMipmapLevel();
        const previousAutoClear = renderer.autoClear;
        const previousXrEnabled = renderer.xr.enabled;
        const previousShadowAutoUpdate = renderer.shadowMap.autoUpdate;
        const previousGenerateMipmaps = cubeTarget.texture.generateMipmaps;

        try {
          targetShoe.visible = false;
          for (const state of proxyState) {
            state.mesh.material = roughProxyMaterial;
          }
          renderer.xr.enabled = false;
          renderer.shadowMap.autoUpdate = false;
          renderer.autoClear = true;
          cubeCamera.update(renderer, scene);
          if (!cubeFramebuffersValidated) {
            validateCubeFaceFramebuffers(renderer, cubeTarget);
            cubeFramebuffersValidated = true;
          }
          probeDirty = false;
        } finally {
          targetShoe.visible = targetWasVisible;
          targetShoe.layers.mask = targetLayerMask;
          for (const state of proxyState) {
            state.mesh.material = state.material;
            state.mesh.visible = state.visible;
            state.mesh.layers.mask = state.layerMask;
          }
          renderer.xr.enabled = previousXrEnabled;
          renderer.shadowMap.autoUpdate = previousShadowAutoUpdate;
          renderer.autoClear = previousAutoClear;
          cubeTarget.texture.generateMipmaps = previousGenerateMipmaps;
          renderer.setRenderTarget(
            previousRenderTarget,
            previousActiveCubeFace,
            previousActiveMipmapLevel,
          );
        }
      };

      const applyProps = (untrustedProps: unknown) => {
        try {
          const props = captureRendererSemanticProps(untrustedProps);
          if (!props) {
            throw new Error("Renderer props did not match the exact contract.");
          }
          currentPropsRef.current = props;
          appliedProps = props;
          targetShoe.visible = !contextLost;
          targetShoe.scale.z = props.shoe === "left" ? -1 : 1;
          setReferenceCameraPose(camera, props.shoe, props.region);
          otherShoe.root.position.z = props.shoe === "left" ? 0.245 : -0.245;
          otherShoe.root.scale.z = props.shoe === "left" ? -0.94 : 0.94;
          setCareAnchor(care.anchor, props.region, props.shoe);
          setCareToolPresentation(care, props);
          const poseKey = carePoseIdentity(props);
          const poseNow = performance.now();
          if (poseKey !== appliedPoseKey) {
            appliedPoseKey = poseKey;
            poseStartedAt = poseNow;
            reducedBoundaryFinished = false;
          }
          // Reapplying non-pose state must not snap a completed Reduced boundary
          // back to elapsed zero. A genuinely new pose identity starts at zero.
          setCarePose(care.tool, props, poseNow, poseNow - poseStartedAt);

          // The full careAmount record is accepted only as the public finite
          // control supplied by the care domain. Toe and heel remain independent
          // even while one contact target is selected. The renderer does not
          // interpret either value as elapsed time, measured coverage, layer
          // count, completion, or a real shoe outcome.
          const toeAmount = careAmountFor(props.careAmount, props.shoe, "toe");
          const heelAmount = careAmountFor(props.careAmount, props.shoe, "heel");
          materials.toe.clearcoatRoughness =
            toeCoatRoughnessFromCareControl(toeAmount);
          materials.heel.clearcoatRoughness =
            heelCoatRoughnessFromCareControl(heelAmount);
          materials.toe.userData.evenwardAdmiralDensity!.value =
            mixFloat32(0.004, 0.01, frame(toeAmount));
          materials.heel.userData.evenwardAdmiralDensity!.value =
            mixFloat32(0.004, 0.01, frame(heelAmount));

          if (appliedShoe !== props.shoe) {
            appliedShoe = props.shoe;
            probeDirty = true;
          }
          renderDirty = true;
          scheduleRender();
          return true;
        } catch {
          targetShoe.visible = false;
          fail(
            "3D footwear unavailable because its semantic inputs did not match the exact renderer contract.",
          );
          if (setupComplete) teardown();
          return false;
        }
      };

      runtimeRef.current = { applyProps };
      if (!applyProps(currentPropsRef.current)) {
        teardown();
        return teardown;
      }
      setupComplete = true;

      const retainLostContextForRestore = () => {
        contextLost = true;
        probeDirty = true;
        renderDirty = true;
        targetShoe.visible = false;
        fail(
          "3D footwear is temporarily unavailable because the WebGL context was lost.",
        );
      };

      const underlyingContextIsLost = (candidate?: WebGLContext | null) => {
        if (contextLost) return true;
        try {
          const context = candidate ?? renderer?.getContext();
          return context?.isContextLost() === true;
        } catch {
          return false;
        }
      };

      const resize = () => {
        let resizeContext: WebGLContext | null = null;
        try {
          if (!renderer) throw new Error("Renderer is not allocated.");
          resizeContext = renderer.getContext();
          if (contextLost || resizeContext.isContextLost()) {
            retainLostContextForRestore();
            return true;
          }
          const maxRenderbufferSize = Number(
            resizeContext.getParameter(resizeContext.MAX_RENDERBUFFER_SIZE),
          );
          const devicePixelRatio = window.devicePixelRatio;
          const width = Math.max(1, host.clientWidth);
          const measuredHeight = host.clientHeight;
          const height = Math.max(320, measuredHeight || width * 0.72);
          const request = drawingBufferRequest(
            width,
            height,
            devicePixelRatio,
            maxRenderbufferSize,
          );
          if (!request) {
            throw new Error("Requested drawing buffer exceeds safe limits.");
          }

          const previousDrawingBufferWidth = renderer.domElement.width;
          const previousDrawingBufferHeight = renderer.domElement.height;
          if (
            previousDrawingBufferWidth !== request.width ||
            previousDrawingBufferHeight !== request.height ||
            renderer.getPixelRatio() !== devicePixelRatio
          ) {
            // Collapse the old drawing buffer before changing DPR and logical
            // size together. Both allocation steps stay within the already
            // validated exact target instead of multiplying stale dimensions.
            renderer.setDrawingBufferSize(1, 1, 1);
            renderer.setDrawingBufferSize(width, height, devicePixelRatio);
          }
          if (
            renderer.domElement.width !== request.width ||
            renderer.domElement.height !== request.height
          ) {
            throw new Error("Renderer allocated an unexpected drawing buffer.");
          }
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          if (
            renderer.domElement.width !== previousDrawingBufferWidth ||
            renderer.domElement.height !== previousDrawingBufferHeight
          ) {
            presentationValidated = false;
            if (publishedCapabilityRef.current === true) {
              publishCapability(false);
            }
          }
          renderDirty = true;
          scheduleRender();
          return true;
        } catch {
          if (underlyingContextIsLost(resizeContext)) {
            retainLostContextForRestore();
            return true;
          }
          fail(
            "3D footwear is unavailable because the requested drawing buffer is unsupported.",
          );
          if (setupComplete) teardown();
          return false;
        }
      };

      onContextLost = (event: Event) => {
        event.preventDefault();
        retainLostContextForRestore();
      };

      onContextRestored = () => {
        if (!alive) return;
        // Keep the lost canvas alive until this event can fire. Rebuild every
        // GPU-owned resource as a new generation while capability remains false.
        teardown();
        setResourceGeneration((generation) => generation + 1);
      };

      activeCanvas.addEventListener("webglcontextlost", onContextLost, false);
      activeCanvas.addEventListener("webglcontextrestored", onContextRestored, false);

      if (typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
      }
      fallbackResize = resize;
      window.addEventListener("resize", fallbackResize);
      if (!resize()) {
        teardown();
        return teardown;
      }

      function scheduleRender() {
        if (!alive || frameRequest !== null) return;
        frameRequest = window.requestAnimationFrame(renderFrame);
      }

      function renderFrame(now: number) {
        if (!alive) return;
        frameRequest = null;
        const props = appliedProps;
        if (!props) return;
        const poseElapsed = now - poseStartedAt;
        const shouldAnimateNormal =
          props.motionMode === "normal" &&
          props.contact === "contact" &&
          care.anchor.visible;
        const shouldAnimateReducedBoundary =
          props.motionMode === "reduced" &&
          (props.contact === "approach" || props.contact === "release") &&
          !reducedBoundaryFinished &&
          care.anchor.visible;
        if (
          !renderer ||
          !scene ||
          contextLost ||
          runtimeFailed ||
          (!renderDirty && !shouldAnimateNormal && !shouldAnimateReducedBoundary)
        ) {
          return;
        }

        try {
          setCarePose(care.tool, props, now, poseElapsed);
          if (shouldAnimateReducedBoundary && poseElapsed >= 900) {
            reducedBoundaryFinished = true;
          }
          if (probeDirty) captureProbe();
          if (!outputValidated) {
            if (!hasRequiredReferenceShoeGeometry(targetShoe, camera)) {
              throw new Error(
                "The procedural shoe is missing required renderable geometry.",
              );
            }
            validateReferenceShoeLandmarks(
              renderer,
              scene,
              camera,
              targetShoe,
            );
            validateCareToolVariants(renderer, scene, camera, care);
            outputValidated = true;
          }
          if (!presentationValidated) {
            renderAndValidatePresentation(renderer, scene, camera);
            presentationValidated = true;
          } else {
            renderer.render(scene, camera);
          }
          renderDirty = false;
          setFailure(null);
          publishCapability(true);
          if (shouldAnimateNormal || (shouldAnimateReducedBoundary && !reducedBoundaryFinished)) {
            scheduleRender();
          }
        } catch {
          runtimeFailed = true;
          targetShoe.visible = false;
          fail(
            "3D footwear is unavailable because its local WebGL rendering path could not be prepared.",
          );
          teardown();
        }
      }

      scheduleRender();

      return teardown;
    } catch {
      runtimeFailed = true;
      fail(
        "3D footwear unavailable. This pre-production reference requires a working WebGL2 context.",
      );
      teardown();
    }
  }, [resourceGeneration]);

  return (
    <div
      ref={hostRef}
      data-care-surface="true"
      data-pre-production="true"
      data-production-compliance="none"
      data-renderer-rating="unrated"
      data-reference-kind="procedural"
      data-optical-contract="blocked"
      data-physical-contact-evidence="blocked"
      data-inherited-blockers="authored-assets ssr raw-mip0 box-projection optical-evidence"
      data-footwear-renderer="procedural-webgl-reference"
      data-camera-interaction="fixed"
      data-webgl-capability={capability}
      data-resource-generation={resourceGeneration}
      data-shoe={rendererProps?.shoe ?? "invalid"}
      data-region={rendererProps?.region ?? "invalid"}
      data-stage={rendererProps?.stage ?? "invalid"}
      data-tool={rendererProps?.tool ?? "invalid"}
      data-motion-mode={rendererProps?.motionMode ?? "invalid"}
      data-contact={rendererProps?.contact ?? "invalid"}
      data-representative-contact={
        rendererProps?.representativeContact ?? "invalid"
      }
      style={wrapperStyle}
    >
      {/* The canvas is deliberately hidden from assistive technology. The
          surrounding care UI must own the canonical semantic snapshot and its
          complete accessible description; pixels never become care truth. */}
      {failure && (
        domainFailureAcknowledged ? (
          <div aria-hidden="true" data-footwear-renderer-error style={errorStyle}>
            <span>{failure}</span>
          </div>
        ) : (
          <div role="status" data-footwear-renderer-error style={errorStyle}>
            <span>{failure}</span>
          </div>
        )
      )}
    </div>
  );
}

export default LeatherFootwearRenderer;
