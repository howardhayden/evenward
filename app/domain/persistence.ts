import {
  boardThemes,
  defaultAvatar,
  defaultChess,
  scenesByTheme,
} from "./content";
import type {
  AppearancePreferences,
  AvatarConfig,
  BoardTheme,
  FaithAccessory,
  GarmentStyle,
  HairStyle,
  Headwear,
  MobilityMode,
  PlaybackSpeed,
  SavedChess,
  SkinTone,
  SupportAccessory,
  ThemeMode,
  ThemeName,
} from "./types";

export const STORAGE_KEYS = {
  preferences: "evenward-preferences-v1",
  chess: "evenward-chess-v1",
} as const;

const LEGACY_KEYS = {
  preferences: "cadence-preferences",
  chess: "cadence-chess",
  history: "cadence-history",
} as const;

export const DATA_INVENTORY = [
  {
    item: "Theme, atmosphere, guide appearance, and access preferences",
    location: "This browser only",
    retention: "Until reset or browser storage is cleared",
  },
  {
    item: "Chess position, board theme, and completed-game count",
    location: "This browser only",
    retention: "Until cleared or browser storage is cleared",
  },
  {
    item: "Current practice, reflection, selected direction, and incidental avatars",
    location: "Memory only",
    retention: "Discarded on reload",
  },
] as const;

const themes: ThemeName[] = ["forest", "sea", "sunrise"];
const modes: ThemeMode[] = ["light", "dark"];
const hairs: HairStyle[] = ["crop", "wave", "coils", "braid", "long", "bald"];
const garments: GarmentStyle[] = ["movement", "tunic", "robe", "loose", "athletic"];
const skins: SkinTone[] = ["porcelain", "light", "medium", "olive", "brown", "deep"];
const headwear: Headwear[] = ["none", "hijab", "dastar", "kippah", "kufi", "veil", "burqa"];
const faithAccessories: FaithAccessory[] = ["none", "cross", "rosary", "mala", "star", "crescent"];
const mobilityModes: MobilityMode[] = ["standing", "seated", "balance", "limited", "oneArm"];
const supports: SupportAccessory[] = ["none", "chair", "wheelchair", "cane", "walker", "rail"];
const playbackSpeeds: PlaybackSpeed[] = ["standard", "slow"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === "string" && values.includes(value as T)
    ? value as T
    : fallback;
}

function finiteRange(value: unknown, fallback: number, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function normalizeAvatar(value: unknown): AvatarConfig {
  const candidate = isRecord(value) ? value : {};
  return {
    hair: oneOf(candidate.hair, hairs, defaultAvatar.hair),
    garment: oneOf(candidate.garment, garments, defaultAvatar.garment),
    skin: oneOf(candidate.skin, skins, defaultAvatar.skin),
    headwear: oneOf(candidate.headwear, headwear, defaultAvatar.headwear),
    faithAccessory: oneOf(
      candidate.faithAccessory,
      faithAccessories,
      defaultAvatar.faithAccessory,
    ),
    glasses: typeof candidate.glasses === "boolean" ? candidate.glasses : defaultAvatar.glasses,
    height: finiteRange(candidate.height, defaultAvatar.height, 86, 114),
    weight: finiteRange(candidate.weight, defaultAvatar.weight, 72, 132),
    mobility: oneOf(candidate.mobility, mobilityModes, defaultAvatar.mobility),
    support: oneOf(candidate.support, supports, defaultAvatar.support),
    lowVision:
      typeof candidate.lowVision === "boolean"
        ? candidate.lowVision
        : defaultAvatar.lowVision,
    hearingSupport:
      typeof candidate.hearingSupport === "boolean"
        ? candidate.hearingSupport
        : defaultAvatar.hearingSupport,
    reducedMotion:
      typeof candidate.reducedMotion === "boolean"
        ? candidate.reducedMotion
        : defaultAvatar.reducedMotion,
    playbackSpeed: oneOf(
      candidate.playbackSpeed,
      playbackSpeeds,
      defaultAvatar.playbackSpeed,
    ),
    solidSurfaces:
      typeof candidate.solidSurfaces === "boolean"
        ? candidate.solidSurfaces
        : defaultAvatar.solidSurfaces,
  };
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeAppearance(value: unknown): AppearancePreferences {
  const candidate = isRecord(value) ? value : {};
  const theme = oneOf(candidate.theme, themes, "forest");
  const allowedScenes = scenesByTheme[theme];
  return {
    theme,
    mode: oneOf(candidate.mode, modes, "light"),
    scene: oneOf(candidate.scene, allowedScenes, allowedScenes[0]),
    avatar: normalizeAvatar(candidate.avatar),
  };
}

function normalizeChess(value: unknown): SavedChess {
  const candidate = isRecord(value) ? value : {};
  const boardTheme = oneOf(
    candidate.boardTheme,
    boardThemes.map((theme) => theme.id),
    defaultChess.boardTheme,
  ) as BoardTheme;
  return {
    pgn: typeof candidate.pgn === "string" ? candidate.pgn : "",
    boardTheme,
    completed: finiteRange(candidate.completed, 0, 0, Number.MAX_SAFE_INTEGER),
    finishedRecorded: Boolean(candidate.finishedRecorded),
  };
}

export function readLocalState(storage: Storage) {
  const currentPreferences = storage.getItem(STORAGE_KEYS.preferences);
  const currentChess = storage.getItem(STORAGE_KEYS.chess);
  const legacyPreferences = storage.getItem(LEGACY_KEYS.preferences);
  const legacyChess = storage.getItem(LEGACY_KEYS.chess);

  const preferences = normalizeAppearance(
    parseJson(currentPreferences ?? legacyPreferences),
  );
  const chess = normalizeChess(parseJson(currentChess ?? legacyChess));

  storage.removeItem(LEGACY_KEYS.preferences);
  storage.removeItem(LEGACY_KEYS.chess);
  storage.removeItem(LEGACY_KEYS.history);

  return { preferences, chess };
}

export function writeAppearance(storage: Storage, preferences: AppearancePreferences) {
  storage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

export function writeChess(storage: Storage, chess: SavedChess) {
  storage.setItem(STORAGE_KEYS.chess, JSON.stringify(chess));
}

export function clearChessStorage(storage: Storage) {
  storage.removeItem(STORAGE_KEYS.chess);
  storage.removeItem(LEGACY_KEYS.chess);
}

export function clearAllEvenwardStorage(storage: Storage) {
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  Object.values(LEGACY_KEYS).forEach((key) => storage.removeItem(key));
}
