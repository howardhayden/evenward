/**
 * Footwear-owned conversion and resource-demand rules.
 *
 * This module consumes a finite semantic control; it does not own care stages,
 * user copy, contact, persistence, rendering, or physical-outcome claims.
 */

export const SHOE_FIDELITY_TIERS = Object.freeze(
  ["SF0", "SF1", "SF2", "SF3", "SF4"] as const,
);

export type ShoeFidelityTier = (typeof SHOE_FIDELITY_TIERS)[number];

export const ADMIRAL_BURIED_LUMA_GATE = Object.freeze({
  lowerStart: 0.001,
  lowerEnd: 0.004,
  upperStart: 0.012,
  upperEnd: 0.024,
});

function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return normalized * normalized * (3 - 2 * normalized);
}

export function buriedAdmiralDepthGateFromLinearLuma(linearLuma: number): number {
  if (typeof linearLuma !== "number" || !Number.isFinite(linearLuma) || linearLuma < 0) {
    throw new RangeError("Buried Admiral luma must be finite, linear, and non-negative.");
  }
  return (
    smoothstep(
      ADMIRAL_BURIED_LUMA_GATE.lowerStart,
      ADMIRAL_BURIED_LUMA_GATE.lowerEnd,
      linearLuma,
    ) *
    (1 -
      smoothstep(
        ADMIRAL_BURIED_LUMA_GATE.upperStart,
        ADMIRAL_BURIED_LUMA_GATE.upperEnd,
        linearLuma,
      ))
  );
}

function normalizedControlOrThrow(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new RangeError(
      "The footwear control must be a finite number within [0,1]; invalid values are never clamped.",
    );
  }
  return value;
}

function float32Mix(start: number, end: number, amount: number): number {
  const start32 = Math.fround(start);
  const end32 = Math.fround(end);
  const amount32 = Math.fround(amount);
  const difference32 = Math.fround(end32 - start32);
  const scaled32 = Math.fround(difference32 * amount32);
  return Math.fround(start32 + scaled32);
}

export function toeClearcoatRoughnessFromCareAmount(careAmount: number): number {
  const amount32 = Math.fround(normalizedControlOrThrow(careAmount));
  const squared32 = Math.fround(amount32 * amount32);
  return float32Mix(0.005, 0.012, squared32);
}

export function flexClearcoatRoughnessFromCareAmount(careAmount: number): number {
  const amount32 = Math.fround(normalizedControlOrThrow(careAmount));
  return float32Mix(0.05, 0.11, amount32);
}

function pshoeOrThrow(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(
      "Pshoe must be a finite non-negative final-presentation-pixel extent.",
    );
  }
  return value;
}

export function conservativePshoe(extents: readonly number[]): number {
  if (!Array.isArray(extents) || extents.length === 0) {
    throw new RangeError("At least one direct-view shoe extent is required.");
  }
  let maximum = 0;
  for (const extent of extents) maximum = Math.max(maximum, pshoeOrThrow(extent));
  return maximum;
}

export function selectShoePixelTier(pshoe: number): ShoeFidelityTier {
  const pixels = pshoeOrThrow(pshoe);
  if (pixels < 96) return "SF0";
  if (pixels < 256) return "SF1";
  if (pixels < 640) return "SF2";
  if (pixels < 1200) return "SF3";
  return "SF4";
}

export function selectRequiredShoeFidelityTier({
  pshoe,
  roughnessTier,
  inspectionActive,
}: Readonly<{
  pshoe: number;
  roughnessTier: ShoeFidelityTier;
  inspectionActive: boolean;
}>): ShoeFidelityTier {
  if (!SHOE_FIDELITY_TIERS.includes(roughnessTier)) {
    throw new TypeError("roughnessTier must be SF0, SF1, SF2, SF3, or SF4.");
  }
  if (typeof inspectionActive !== "boolean") {
    throw new TypeError("inspectionActive must be boolean.");
  }
  const pixelTier = selectShoePixelTier(pshoe);
  const demanded = [
    pixelTier,
    roughnessTier,
    ...(inspectionActive ? (["SF3"] as const) : []),
  ];
  return demanded.reduce((maximum, tier) =>
    SHOE_FIDELITY_TIERS.indexOf(tier) > SHOE_FIDELITY_TIERS.indexOf(maximum)
      ? tier
      : maximum,
  );
}
