import assert from "node:assert/strict";
import test from "node:test";
import { defaultAvatar, defaultChess } from "../app/domain/content";
import {
  clearAllEvenwardStorage,
  readLocalState,
  STORAGE_KEYS,
  writeAppearance,
  writeChess,
} from "../app/domain/persistence";

class MemoryStorage implements Storage {
  #values = new Map<string, string>();

  get length() {
    return this.#values.size;
  }

  clear() {
    this.#values.clear();
  }

  getItem(key: string) {
    return this.#values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.#values.delete(key);
  }

  setItem(key: string, value: string) {
    this.#values.set(key, value);
  }
}

test("appearance and accessibility preferences persist through one boundary", () => {
  const storage = new MemoryStorage();
  const avatar = {
    ...defaultAvatar,
    mobility: "seated" as const,
    support: "wheelchair" as const,
    reducedMotion: true,
    playbackSpeed: "slow" as const,
    solidSurfaces: true,
  };
  writeAppearance(storage, {
    theme: "sea",
    mode: "dark",
    scene: "sky",
    avatar,
  });
  writeChess(storage, { ...defaultChess, boardTheme: "ice", completed: 2 });

  const state = readLocalState(storage);
  assert.equal(state.preferences.theme, "sea");
  assert.equal(state.preferences.avatar.mobility, "seated");
  assert.equal(state.preferences.avatar.playbackSpeed, "slow");
  assert.equal(state.preferences.avatar.solidSurfaces, true);
  assert.equal(state.chess.boardTheme, "ice");
  assert.equal(state.chess.completed, 2);
});

test("legacy values migrate and invalid values are constrained", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    "cadence-preferences",
    JSON.stringify({
      theme: "invalid",
      mode: "dark",
      scene: "invalid",
      avatar: { height: 1_000, weight: -1, hair: "unknown" },
    }),
  );
  storage.setItem("cadence-chess", JSON.stringify({ completed: -20 }));

  const state = readLocalState(storage);
  assert.equal(state.preferences.theme, "forest");
  assert.equal(state.preferences.scene, "leaves");
  assert.equal(state.preferences.avatar.height, 114);
  assert.equal(state.preferences.avatar.weight, 72);
  assert.equal(state.preferences.avatar.hair, defaultAvatar.hair);
  assert.equal(state.chess.completed, 0);
  assert.equal(storage.getItem("cadence-preferences"), null);
  assert.equal(storage.getItem("cadence-chess"), null);
});

test("temporary practice state has no persistence key and reset deletes all data", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEYS.preferences, "{}");
  storage.setItem(STORAGE_KEYS.chess, "{}");
  storage.setItem("cadence-history", "sensitive-history");

  assert.deepEqual(Object.keys(STORAGE_KEYS).sort(), ["chess", "preferences"]);
  clearAllEvenwardStorage(storage);
  assert.equal(storage.length, 0);
});
