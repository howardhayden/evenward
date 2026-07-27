import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialAvatarBehavior } from "../app/domain/avatar-machine";
import { defaultAvatar, movementPractices } from "../app/domain/content";
import {
  GuidePresence,
  UnderstandView,
} from "../app/components/studio/StudioUI";

const noop = () => {};

test("all lesson disclosures are initially closed", () => {
  const html = renderToStaticMarkup(
    <UnderstandView
      avatar={defaultAvatar}
      activeMove={null}
      activeView="front"
      onSelectMove={noop}
      onView={noop}
      onStop={noop}
      onOpenAccess={noop}
    />,
  );

  assert.match(html, /aria-label="Movement lessons"/);
  assert.doesNotMatch(html, /<details[^>]*class="movement-discipline"[^>]*\sopen/);
  assert.doesNotMatch(html, /<details[^>]*class="movement-lesson"[^>]*\sopen/);
});

test("a selected lesson commands one full-size authoritative guide", () => {
  const move = movementPractices.find((movement) => movement.id === "cloudHands");
  assert.ok(move);
  const state = {
    ...initialAvatarBehavior(),
    mode: "demonstrating" as const,
    movement: "cloudHands" as const,
    sourceId: "cloudHands",
    view: "front" as const,
    facing: "right" as const,
    reaction: "idle" as const,
  };
  const html = renderToStaticMarkup(
    <GuidePresence
      avatar={defaultAvatar}
      guideState={state}
      daypart={null}
      activeMove={move}
      onMovementView={noop}
      onPause={noop}
      onResume={noop}
      onPreviousPose={noop}
      onNextPose={noop}
      onNextMovement={noop}
      onStopMovement={noop}
      onCustomize={noop}
      onAvatarInteract={noop}
    />,
  );

  assert.equal((html.match(/data-testid="primary-guide"/g) ?? []).length, 1);
  assert.match(html, /data-movement="cloudHands"/);
  assert.match(html, />Pause</);
  assert.match(html, />Next</);
  assert.match(html, /Front/);
  assert.match(html, /Side/);
  assert.match(html, /How to perform Cloud hands/);
  assert.match(html, /Shift toward the left foot/);
});
