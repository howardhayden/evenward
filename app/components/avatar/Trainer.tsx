"use client";

import type { CSSProperties } from "react";
import type {
  AvatarConfig,
  GarmentStyle,
  GuideMood,
  GuidePart,
  GuideReaction,
  MovementDemo,
  MovementView,
} from "../../domain/types";
import type { AvatarBehaviorMode } from "../../domain/avatar-machine";
import {
  movementAnimationCss,
  rigAnimationName,
  rigTargets,
  stagedRigTransform,
  type RigTarget,
} from "../../domain/movement-animation";
import { effectiveSupport, movementDefinitionFor } from "../../domain/movement-logic";

function QuadrupedGuide({
  avatar,
  hidesHair,
}: {
  avatar: AvatarConfig;
  hidesHair: boolean;
}) {
  return (
    <g className="trainer__quadruped" aria-hidden="true">
      <g className="trainer__quadruped-side">
        <g className="trainer__quadruped-limbs trainer__quadruped-limbs--back">
          <path className="trainer__quadruped-limb trainer__quadruped-limb--garment" d="M126 187Q98 205 95 235" />
          <circle className="trainer__joint" cx="95" cy="235" r="7" />
          <path className="trainer__quadruped-limb" d="M95 235Q78 251 58 258" />
          <path className="trainer__quadruped-foot" d="M58 258h-20" />
          <path className="trainer__quadruped-limb trainer__quadruped-limb--garment" d="M204 181Q211 213 211 235" />
          <circle className="trainer__joint trainer__joint--elbow" cx="211" cy="235" r="7" />
          <path className="trainer__quadruped-limb" d="M211 235Q211 253 214 270" />
          <path className="trainer__quadruped-hand" d="M205 271h24" />
        </g>
        <g className="trainer__quadruped-spine">
          <path className="trainer__quadruped-garment" d="M112 142Q163 122 226 148L218 200Q164 216 111 194Z" />
          <path className="trainer__quadruped-collar" d="M211 147q8 24 4 48" />
          <g className="trainer__quadruped-head">
            <path className="trainer__quadruped-neck" d="M219 151q18-8 27-26" />
            <path className="trainer__quadruped-face" d="M239 79c23-15 53-2 58 26l25 12-22 16c-5 26-34 38-55 22-23-18-25-58-6-76Z" />
            {!hidesHair && avatar.hair !== "bald" && (
              <g className="trainer__quadruped-hair">
                <path className="trainer__quad-hair trainer__hair trainer__hair--crop" d="M237 104q7-40 40-38 28 3 29 35-35-15-69 3Z" />
                <path className="trainer__quad-hair trainer__hair trainer__hair--wave" d="M234 109q2-48 41-45 37 4 34 46l-13 18q-2-35-29-38-13 5-33 19Z" />
                <g className="trainer__quad-hair trainer__hair trainer__hair--coils">
                  <circle cx="241" cy="96" r="15" /><circle cx="250" cy="75" r="16" />
                  <circle cx="271" cy="67" r="17" /><circle cx="293" cy="74" r="16" />
                  <circle cx="305" cy="94" r="15" />
                </g>
                <path className="trainer__quad-hair trainer__hair trainer__hair--braid" d="M236 107q4-44 40-42 34 3 32 42-34-15-72 0Zm57 15q21 25 7 57l-13-4q10-27-7-45Z" />
                <path className="trainer__quad-hair trainer__hair trainer__hair--long" d="M235 108q3-47 41-44 39 3 34 51l-10 58-18-3q10-48-14-78-12 25-6 70l-18 1q-12-35-9-55Z" />
              </g>
            )}
            <g className="trainer__quadruped-cover">
              <path className="trainer__quad-hijab" fillRule="evenodd" d="M239 71q35-25 63 7 18 24 5 64l12 38-54-17q-26-10-32-37-7-35 6-55Zm19 24q17-17 33-2 15 15 5 38-8 19-28 16-20-3-22-24-2-16 12-28Z" />
              <path className="trainer__quad-dastar" d="M237 101q3-34 31-45 30-2 43 31l-3 21q-36-17-71-7Z" />
              <path className="trainer__quad-kippah" d="M259 72q23-17 42 7-22-7-42-7Z" />
              <path className="trainer__quad-kufi" d="m250 91 5-26q24-7 46 5l4 27q-27-11-55-6Z" />
              <path className="trainer__quad-veil" fillRule="evenodd" d="M237 68q39-25 68 12 14 22 2 60l17 48-61-25q-24-12-30-39-6-34 4-56Zm21 28q18-17 34-1 14 15 4 37-8 18-28 15-19-4-22-24-2-15 12-27Z" />
              <path className="trainer__quad-burqa" d="M239 66q39-24 68 15 11 18 3 51l13 84q-47 21-93 0l5-91q-7-35 4-59Z" />
            </g>
            <path className="trainer__quadruped-eye-white" d="M263 111q18-18 38 1-19 18-38-1Z" />
            <ellipse className="trainer__quadruped-pupil" cx="286" cy="111" rx="8" ry="11" />
            <g className="trainer__quadruped-glasses">
              <rect x="260" y="94" width="43" height="34" rx="13" />
              <path d="M302 111l14 5" />
            </g>
            <path className="trainer__quadruped-smile" d="M299 139q7 5 13 0" />
          </g>
        </g>
        <g className="trainer__quadruped-limbs trainer__quadruped-limbs--front">
          <path className="trainer__quadruped-limb trainer__quadruped-limb--garment" d="M115 181Q88 205 87 231" />
          <circle className="trainer__joint" cx="87" cy="231" r="7" />
          <path className="trainer__quadruped-limb" d="M87 231Q69 246 50 253" />
          <path className="trainer__quadruped-foot" d="M50 253H30" />
          <path className="trainer__quadruped-limb trainer__quadruped-limb--garment" d="M224 178Q230 211 229 235" />
          <circle className="trainer__joint trainer__joint--elbow" cx="229" cy="235" r="7" />
          <path className="trainer__quadruped-limb" d="M229 235Q229 253 232 270" />
          <path className="trainer__quadruped-hand" d="M222 271h25" />
        </g>
        <path className="trainer__quadruped-fiber" d="M122 155q46-17 91 2m-96 17q51-15 101 2m-91-25-4 42m30-50 2 58m31-56 4 52M247 83q28-13 54 5m-58 10q31-11 62 4" />
      </g>

      <g className="trainer__quadruped-front">
        <g className="trainer__quadruped-front-body">
          <path className="trainer__quadruped-garment" d="M127 116Q180 87 233 116l-12 115q-41 25-82 0Z" />
          <path className="trainer__quadruped-front-limb trainer__quadruped-limb--garment" d="M144 160Q132 202 130 244" />
          <circle className="trainer__joint trainer__joint--elbow" cx="130" cy="244" r="7" />
          <path className="trainer__quadruped-front-limb" d="M130 244v31" />
          <path className="trainer__quadruped-hand" d="M117 276h26" />
          <path className="trainer__quadruped-front-limb trainer__quadruped-limb--garment" d="M216 160Q228 202 230 244" />
          <circle className="trainer__joint trainer__joint--elbow" cx="230" cy="244" r="7" />
          <path className="trainer__quadruped-front-limb" d="M230 244v31" />
          <path className="trainer__quadruped-hand" d="M217 276h26" />
          <path className="trainer__quadruped-knee" d="M144 218q-37 8-47 42m119-42q37 8 47 42" />
          <circle className="trainer__joint" cx="97" cy="260" r="7" />
          <circle className="trainer__joint" cx="263" cy="260" r="7" />
          <ellipse className="trainer__quadruped-face" cx="180" cy="95" rx="44" ry="46" />
          {!hidesHair && avatar.hair !== "bald" && (
            <path className="trainer__quadruped-front-hair" d="M137 94q0-51 44-50 43 1 42 51-20-14-42-22-17 14-44 21Z" />
          )}
          <g className="trainer__quadruped-front-cover">
            <path className="trainer__quad-hijab" fillRule="evenodd" d="M180 42q-47 0-51 51l-2 75 40-28h26l40 28-2-75q-4-51-51-51Zm0 25q23 0 25 27 1 27-25 29-26-2-25-29 2-27 25-27Z" />
            <path className="trainer__quad-dastar" d="M139 89q0-41 42-53 41 10 41 53-39-16-83 0Z" />
            <path className="trainer__quad-kippah" d="M157 60q23-21 47 1-25-5-47-1Z" />
            <path className="trainer__quad-kufi" d="m151 76 4-27q25-8 51 0l4 27q-30-9-59 0Z" />
            <path className="trainer__quad-veil" fillRule="evenodd" d="M180 38q-47 0-52 53l-5 91 44-41h26l44 41-5-91q-5-53-52-53Zm0 30q23 0 25 26 1 27-25 29-26-2-25-29 2-26 25-26Z" />
            <path className="trainer__quad-burqa" d="M180 35q-51 0-54 56l-9 143q63 30 126 0l-9-143q-3-56-54-56Z" />
          </g>
          <path className="trainer__quadruped-eye-white" d="M139 97q18-19 41-2-18 22-41 2Zm41-2q23-17 41 2-23 20-41-2Z" />
          <ellipse className="trainer__quadruped-pupil" cx="159" cy="97" rx="8" ry="11" />
          <ellipse className="trainer__quadruped-pupil" cx="201" cy="97" rx="8" ry="11" />
          <g className="trainer__quadruped-glasses">
            <rect x="137" y="79" width="43" height="35" rx="14" />
            <rect x="180" y="79" width="43" height="35" rx="14" />
            <path d="M177 94h6" />
          </g>
          <path className="trainer__quadruped-smile" d="M171 119q9 7 18 0" />
          <path className="trainer__quadruped-fiber" d="M142 136q38-15 76 0m-81 22q43-13 86 1m-73-36-4 111m32-121 2 119m31-108 5 97M145 67q35-15 70 1m-75 19q39-12 79 1" />
        </g>
      </g>
    </g>
  );
}

export function Trainer({
  avatar,
  compact = false,
  label = "Your abstract Evenward guide",
  movement = "rest",
  view = "front",
  mood = "calm",
  reaction = "idle",
  facing = "right",
  paused = false,
  behavior = "idle",
  poseIndex = 0,
  reducedPresentation = avatar.reducedMotion,
  primary = false,
  onInteract,
}: {
  avatar: AvatarConfig;
  compact?: boolean;
  label?: string;
  movement?: MovementDemo;
  view?: MovementView;
  mood?: GuideMood;
  reaction?: GuideReaction;
  facing?: "left" | "right";
  paused?: boolean;
  behavior?: AvatarBehaviorMode;
  poseIndex?: number;
  reducedPresentation?: boolean;
  primary?: boolean;
  onInteract?: (part: GuidePart) => void;
}) {
  const weightScale = 0.82 + avatar.weight / 540;
  const heightScale = avatar.height / 100;
  const weightFactor = Math.min(1, Math.max(0, (avatar.weight - 72) / 60));
  const garmentInertia: Record<GarmentStyle, number> = {
    athletic: 0.08,
    movement: 0.24,
    tunic: 0.5,
    loose: 0.68,
    robe: 0.9,
  };
  const clothingWeight = garmentInertia[avatar.garment] +
    (["hijab", "dastar", "veil"].includes(avatar.headwear) ? 0.12 : 0) +
    (avatar.headwear === "burqa" ? 0.62 : 0);
  const seated = avatar.mobility === "seated";
  const oneArm = avatar.mobility === "oneArm";
  const hidesHair = ["hijab", "dastar", "kufi", "veil", "burqa"].includes(avatar.headwear);
  const movementDefinition = movementDefinitionFor(
    movement === "singleCloud" ? "cloudHands" : movement,
  );
  const movementPosition =
    seated ? "seated" : movementDefinition?.position ?? "standing";
  const speedMultiplier = avatar.playbackSpeed === "slow" ? 1.45 : 1;
  const motionSeconds =
    ((movementDefinition?.durationMs ?? (4_150 + weightFactor * 1_250)) *
      speedMultiplier) /
    1_000;
  const support = effectiveSupport(avatar);
  const anchoredTargets = new Set<RigTarget>(
    support === "cane"
      ? ["right-arm", "right-forearm"]
      : support === "walker" || support === "rail"
        ? ["left-arm", "left-forearm"]
        : [],
  );
  const articulatedVariables = movementDefinition
    ? Object.fromEntries(
        rigTargets.flatMap((target) => [
          [
            `--${target}-animation`,
            anchoredTargets.has(target)
              ? "none"
              : rigAnimationName(movementDefinition, avatar, target, view),
          ],
          [
            `--${target}-pose`,
            anchoredTargets.has(target)
              ? "none"
              : stagedRigTransform(
                  movementDefinition,
                  avatar,
                  target,
                  poseIndex,
                  view,
                ),
          ],
        ]),
      )
    : {};

  const figure = (
    <svg
      className={`trainer ${compact ? "trainer--compact" : ""}`}
      data-hair={avatar.hair}
      data-garment={avatar.garment}
      data-skin={avatar.skin}
      data-headwear={avatar.headwear}
      data-accessory={avatar.faithAccessory}
      data-glasses={avatar.glasses}
      data-mobility={avatar.mobility}
      data-support={effectiveSupport(avatar)}
      data-hearing={avatar.hearingSupport}
      data-movement={movement}
      data-view={view}
      data-mood={mood}
      data-reaction={reaction}
      data-facing={facing}
      data-paused={paused}
      data-behavior={behavior}
      data-motion-family={movementDefinition?.motionFamily ?? "still"}
      data-position={movementPosition}
      data-demonstration-engine={movementDefinition ? "articulated" : "ambient"}
      data-pose={poseIndex}
      data-reduced-presentation={reducedPresentation}
      data-primary={primary}
      data-testid={primary ? "primary-guide" : undefined}
      viewBox="0 0 360 320"
      role="img"
      aria-label={label}
      style={
        {
          "--avatar-height": heightScale,
          "--avatar-weight": weightScale,
          "--avatar-side-weight": weightScale * 0.76,
          "--motion-cycle": `${motionSeconds}s`,
          "--motion-easing": movementDefinition?.easing ?? "ease-in-out",
          "--idle-cycle": `${5.1 + weightFactor * 1.6}s`,
          "--ambient-cycle": `${16.5 + weightFactor * 4.2}s`,
          "--motion-travel": `${12 - weightFactor * 3.4}px`,
          "--motion-lift": `${7.2 - weightFactor * 1.5}px`,
          "--cloth-cycle": `${4.5 + clothingWeight * 2.7 + weightFactor * 0.7}s`,
          "--cloth-swing": `${1.2 + clothingWeight * 2.8}deg`,
          "--cloth-drop": `${0.8 + clothingWeight * 2.4}px`,
          ...articulatedVariables,
        } as CSSProperties
      }
    >
      {movementDefinition && (
        <style>{movementAnimationCss(movementDefinition, avatar, view)}</style>
      )}
      <g className="trainer__scale">
        <ellipse className="trainer__shadow" cx="180" cy="294" rx="98" ry="9" />
        {movementPosition === "quadruped" && (
          <QuadrupedGuide avatar={avatar} hidesHair={hidesHair} />
        )}
        <g className="trainer__support trainer__support--back">
          <g className="trainer__wheelchair">
            <circle cx="184" cy="237" r="55" />
            <path d="M183 180v56h55m-55 0-28-38" />
          </g>
          <g className="trainer__chair">
            <rect className="trainer__chair-seat" x="143" y="218" width="88" height="12" rx="6" />
            <path d="M226 151v77H151m75-4 18 57m-88-57-10 57" />
          </g>
        </g>

        <g className="trainer__motion">
          <g className="trainer__headwear-back trainer__head-part trainer__front-only" data-layer="headwear-back">
            <path className="trainer__hijab-back" d="M180 14c-31 0-52 23-51 58l-15 88 49-35h34l49 35-15-88c1-35-20-58-51-58Z" />
            <path className="trainer__veil-back" d="M180 11c-30 0-51 21-52 57l-18 106 53-48h34l53 48-18-106c-1-36-22-57-52-57Z" />
            <path className="trainer__burqa-back" d="M180 8c-34 0-58 26-57 65l-21 202c46 21 110 21 156 0L237 73c1-39-23-65-57-65Z" />
          </g>

          {!hidesHair && avatar.hair !== "bald" && (
            <g className="trainer__hair-group trainer__hair-group--back trainer__head-part trainer__front-only" data-layer="hair-back">
              <path className="trainer__hair-base" d="M132 78C126 38 148 10 183 10c38 0 56 29 45 81l-13 34-19-14c8-36-3-58-23-58-19 0-29 18-26 57l-18 14c-5-18-5-33 3-46Z" />
              <path className="trainer__hair trainer__hair--crop" d="M136 69c-2-39 22-56 49-53 31 3 43 24 39 56-21-17-66-19-88-3Z" />
              <path className="trainer__hair trainer__hair--wave" d="M132 76c-8-43 17-66 52-62 37 4 52 33 42 77l-14 25-10-8c4-36-9-58-32-57-18 1-27 12-29 31Z" />
              <g className="trainer__hair trainer__hair--coils">
                <circle cx="141" cy="61" r="18" />
                <circle cx="145" cy="38" r="18" />
                <circle cx="163" cy="24" r="18" />
                <circle cx="185" cy="21" r="19" />
                <circle cx="207" cy="31" r="18" />
                <circle cx="220" cy="51" r="18" />
                <circle cx="221" cy="76" r="17" />
                <circle cx="137" cy="84" r="16" />
                <circle cx="216" cy="96" r="16" />
              </g>
              <path className="trainer__hair trainer__hair--braid" d="M134 72c-3-40 20-58 50-56 35 2 48 28 40 65l-12 23c-2-32-16-52-39-50-18 2-27 13-28 31Zm77 9c22 21 19 56 6 76l-13-4c11-29 6-49-6-62Z" />
              <path className="trainer__hair trainer__hair--long" d="M131 75c-5-43 21-64 54-60 39 5 52 36 41 91l-11 44-18-7c9-45 4-77-24-89-17 6-25 35-14 87l-18 7c-14-31-17-54-10-73Z" />
            </g>
          )}

          {!seated && (
            <g className="trainer__legs trainer__front-only" data-layer="limbs-back">
              <g className="trainer__leg-chain trainer__leg-chain--left">
                <path className="trainer__leg trainer__leg--left trainer__leg--upper" d="M157 195Q153 219 149 240" />
                <circle className="trainer__joint trainer__joint--knee" cx="149" cy="240" r="7" />
                <g className="trainer__shin trainer__shin--left">
                  <path className="trainer__leg trainer__leg--left trainer__leg--lower" d="M149 240Q142 267 134 289" />
                  <path className="trainer__shoe trainer__shoe--left" d="m136 286-27 5" />
                </g>
              </g>
              <g className="trainer__leg-chain trainer__leg-chain--right">
                <path className="trainer__leg trainer__leg--right trainer__leg--upper" d="M203 195Q210 219 216 240" />
                <circle className="trainer__joint trainer__joint--knee" cx="216" cy="240" r="7" />
                <g className="trainer__shin trainer__shin--right">
                  <path className="trainer__leg trainer__leg--right trainer__leg--lower" d="M216 240Q223 266 230 289" />
                  <path className="trainer__shoe trainer__shoe--right" d="m228 286 27 4" />
                </g>
              </g>
            </g>
          )}

          {seated && (
            <g className="trainer__seated-legs trainer__front-only" data-layer="limbs-back">
              <g className="trainer__leg-chain trainer__leg-chain--left">
                <path className="trainer__leg trainer__leg--left trainer__leg--upper" d="M157 201Q160 222 182 228" />
                <circle className="trainer__joint trainer__joint--knee" cx="182" cy="228" r="7" />
                <g className="trainer__shin trainer__shin--left">
                  <path className="trainer__leg trainer__leg--left trainer__leg--lower" d="M182 228Q176 254 170 278" />
                  <path className="trainer__shoe trainer__shoe--left" d="m169 278-25 5" />
                </g>
              </g>
              <g className="trainer__leg-chain trainer__leg-chain--right">
                <path className="trainer__leg trainer__leg--right trainer__leg--upper" d="M202 201Q199 222 180 228" />
                <circle className="trainer__joint trainer__joint--knee" cx="180" cy="228" r="7" />
                <g className="trainer__shin trainer__shin--right">
                  <path className="trainer__leg trainer__leg--right trainer__leg--lower" d="M180 228Q188 253 194 278" />
                  <path className="trainer__shoe trainer__shoe--right" d="m194 278 25 5" />
                </g>
              </g>
            </g>
          )}

          <g className="trainer__arm trainer__arm--left trainer__front-only">
            <path className="trainer__arm-segment trainer__arm-segment--upper" d="M147 126Q133 136 127 155" />
            <circle className="trainer__joint trainer__joint--elbow" cx="127" cy="155" r="7" />
            <g className="trainer__forearm trainer__forearm--left">
              <path className="trainer__arm-segment trainer__arm-segment--lower" d="M127 155Q119 171 117 184" />
              <circle cx="117" cy="190" r="10" />
            </g>
            <path className="trainer__sleeve trainer__sleeve--left" d="M147 126c-11 5-18 15-22 28" />
          </g>
          {!oneArm && (
            <g className="trainer__arm trainer__arm--right trainer__front-only">
              <path className="trainer__arm-segment trainer__arm-segment--upper" d="M214 126Q227 137 233 156" />
              <circle className="trainer__joint trainer__joint--elbow" cx="233" cy="156" r="7" />
              <g className="trainer__forearm trainer__forearm--right">
                <path className="trainer__arm-segment trainer__arm-segment--lower" d="M233 156Q239 171 239 184" />
                <circle cx="239" cy="190" r="10" />
              </g>
              <path className="trainer__sleeve trainer__sleeve--right" d="M214 126c11 6 17 16 20 29" />
            </g>
          )}

          <g className="trainer__clothing" data-layer="clothing">
            <g className="trainer__torso">
              <path className="trainer__garment trainer__garment--movement" d="M143 113c13-22 59-23 75 0l-8 101c-19 18-48 18-67 1Z" />
              <path className="trainer__garment trainer__garment--tunic" d="M140 113c14-22 64-23 80 0l8 119c-30 14-66 14-96 0Z" />
              <path className="trainer__garment trainer__garment--robe" d="M141 112c13-22 64-23 79 0l24 151c-42 12-86 12-128 0Z" />
              <path className="trainer__garment trainer__garment--loose" d="M134 116c22-30 74-29 94 0l-13 104c-25 17-49 17-73 0Z" />
              <path className="trainer__garment trainer__garment--athletic" d="M146 112c16-17 54-18 69 0l-4 98c-20 12-42 12-63 0Z" />
              <path className="trainer__collar" d="M164 111q16 17 32 0" />
              <path className="trainer__waist" d="M151 170q29 12 58 0" />
            </g>
          </g>

          <rect className="trainer__skin trainer__head-part trainer__front-only" x="170" y="87" width="21" height="28" rx="9" />
          <ellipse className="trainer__skin trainer__head-part trainer__front-only" cx="180" cy="68" rx="43" ry="46" />

          {!hidesHair && avatar.hair !== "bald" && (
            <g className="trainer__hair-group trainer__hair-group--front trainer__head-part trainer__front-only" data-layer="hair-front">
              <path className="trainer__hair-base" d="M135 72c0-39 20-59 49-59 28 0 44 20 42 58-15-13-29-18-43-21-12 11-27 18-48 22Z" />
              <path className="trainer__hair trainer__hair--crop" d="M138 65c4-29 24-43 47-43 24 0 39 13 40 40-20-12-38-10-50-17-10 10-22 16-37 20Z" />
              <path className="trainer__hair trainer__hair--wave" d="M137 64c7-31 29-45 52-40 22 5 34 18 35 41-13-13-27-16-39-18-8 9-25 16-48 17Z" />
              <g className="trainer__hair trainer__hair--coils">
                <circle cx="145" cy="51" r="13" />
                <circle cx="158" cy="36" r="14" />
                <circle cx="177" cy="31" r="14" />
                <circle cx="196" cy="34" r="14" />
                <circle cx="214" cy="49" r="13" />
                <path className="trainer__coil-line" d="M137 52c8-11 18-2 11 6-6 7-15 1-10-6m15-15c8-11 19-1 11 7-6 6-15 0-10-7m17-8c8-11 19-1 11 7-6 6-15 0-10-7m18 3c8-11 19-1 11 7-6 6-15 0-10-7m17 13c8-11 19-1 11 7-6 6-15 0-10-7" />
              </g>
              <path className="trainer__hair trainer__hair--braid" d="M138 64c4-30 25-44 49-41 24 3 37 18 37 43-13-12-28-17-42-18-10 9-24 14-44 16Z" />
              <path className="trainer__hair trainer__hair--long" d="M137 63c7-31 29-44 52-39 22 5 34 19 35 43-14-13-29-18-44-19-9 9-23 14-43 15Z" />
            </g>
          )}

          <g className="trainer__headwear-front trainer__head-part trainer__front-only" data-layer="headwear-front">
            <path
              className="trainer__hijab-front"
              fillRule="evenodd"
              d="M180 14c-31 0-51 23-51 58v49l30 21h42l30-21V72c0-35-20-58-51-58Zm0 25c17 0 29 13 29 33 0 22-11 35-29 35s-29-13-29-35c0-20 12-33 29-33Z"
            />
            <path className="trainer__dastar" d="M140 62c-1-19 6-35 21-45 5-11 16-17 28-15 18 2 31 15 34 34 5 8 6 18 1 29-26-12-57-13-84-3Z" />
            <path className="trainer__dastar-lines" d="M153 24c18-9 40-5 57 8m-66 10c22-10 51-7 74 6m-76 5c25-8 53-5 80 6" />
            <path className="trainer__kippah" d="M158 28q22-22 45 1c-16-4-30-4-45-1Z" />
            <path className="trainer__kufi" d="m151 45 3-25q26-8 52 0l3 26c-19-7-39-7-58-1Z" />
            <path className="trainer__kufi-lines" d="M154 31c17-5 35-5 52 0" />
            <path className="trainer__veil-band" d="M145 48q35-21 70 0l-4 14q-31-14-62 0Z" />
            <path className="trainer__veil-front-drape" d="M148 91c-12 18-18 44-18 74 31 16 69 16 100 0 0-30-6-56-18-74l-14 21c-10 9-26 9-36 0Z" />
            <path
              className="trainer__veil-coif"
              fillRule="evenodd"
              d="M180 17c-28 0-45 20-45 53v28l22 18c11 9 35 9 46 0l22-18V70c0-33-17-53-45-53Zm0 36c15 0 25 7 25 22 0 17-9 26-25 26s-25-9-25-26c0-15 10-22 25-22Z"
            />
            <path className="trainer__burqa-front" d="M180 12c-30 0-51 22-51 57l-17 197c38 20 98 20 136 0L231 69c0-35-21-57-51-57Z" />
          </g>

          <g className="trainer__eyes trainer__head-part trainer__front-only" data-layer="features">
            <path className="trainer__eye-white" d="M139 70q18-20 41-2-18 22-41 2Z" />
            <path className="trainer__eye-white" d="M180 68q23-18 41 2-23 20-41-2Z" />
            <ellipse className="trainer__pupil" cx="159" cy="70" rx="8.5" ry="11.5" />
            <ellipse className="trainer__pupil" cx="201" cy="70" rx="8.5" ry="11.5" />
          </g>
          <g className="trainer__closed-eyes trainer__head-part trainer__front-only" aria-hidden="true">
            <path d="M143 70q15 12 31 0M186 70q15 12 30 0" />
          </g>
          <g className="trainer__glasses trainer__head-part trainer__front-only">
            <rect x="137" y="52" width="43" height="36" rx="14" />
            <rect x="180" y="52" width="43" height="36" rx="14" />
            <path d="M177 67h6m-46-1-9-4m95 4 9-4" />
          </g>
          <g className="trainer__hearing-aids trainer__head-part trainer__front-only">
            <path d="M138 69q-9 4-5 16" />
            <path d="M222 69q9 4 5 16" />
          </g>
          <path className="trainer__smile trainer__head-part trainer__front-only" d="M171 91q9 7 18 0" />
          <path className="trainer__frown trainer__head-part trainer__front-only" d="M171 98q9-8 18 0" />
          <g className="trainer__cheeks trainer__head-part trainer__front-only" aria-hidden="true">
            <ellipse cx="148" cy="88" rx="7" ry="3.5" />
            <ellipse cx="212" cy="88" rx="7" ry="3.5" />
          </g>
          <g className="trainer__burqa-mesh trainer__head-part trainer__front-only" aria-hidden="true">
            <rect x="139" y="52" width="82" height="39" rx="11" />
            <path d="M143 60h74M141 69h78M142 78h76M149 54l-6 34M160 53l-5 37M172 52l-3 39M184 52l2 39M196 53l5 37M208 54l9 34" />
          </g>

          <g className="trainer__profile-only">
            {!seated ? (
              <g className="trainer__profile-legs">
                <g className="trainer__leg-chain trainer__leg-chain--left">
                  <path className="trainer__leg trainer__leg--left trainer__leg--upper" d="M178 195Q175 219 174 241" />
                  <circle className="trainer__joint trainer__joint--knee" cx="174" cy="241" r="7" />
                  <g className="trainer__shin trainer__shin--left">
                    <path className="trainer__leg trainer__leg--left trainer__leg--lower" d="M174 241Q172 265 171 286" />
                    <path className="trainer__shoe trainer__shoe--left" d="m171 286-20 2" />
                  </g>
                </g>
                <g className="trainer__leg-chain trainer__leg-chain--right">
                  <path className="trainer__leg trainer__leg--right trainer__leg--upper" d="M196 195Q203 218 205 241" />
                  <circle className="trainer__joint trainer__joint--knee" cx="205" cy="241" r="7" />
                  <g className="trainer__shin trainer__shin--right">
                    <path className="trainer__leg trainer__leg--right trainer__leg--lower" d="M205 241Q208 266 208 286" />
                    <path className="trainer__shoe trainer__shoe--right" d="m208 286 27 3" />
                  </g>
                </g>
              </g>
            ) : (
              <g className="trainer__profile-seated-legs">
                <g className="trainer__leg-chain trainer__leg-chain--left">
                  <path className="trainer__leg trainer__leg--left trainer__leg--upper" d="M178 199Q193 220 220 224" />
                  <circle className="trainer__joint trainer__joint--knee" cx="220" cy="224" r="7" />
                  <g className="trainer__shin trainer__shin--left">
                    <path className="trainer__leg trainer__leg--left trainer__leg--lower" d="M220 224Q218 252 215 278" />
                    <path className="trainer__shoe trainer__shoe--left" d="m215 278 25 2" />
                  </g>
                </g>
                <g className="trainer__leg-chain trainer__leg-chain--right">
                  <path className="trainer__leg trainer__leg--right trainer__leg--upper" d="M192 198Q210 216 234 216" />
                  <circle className="trainer__joint trainer__joint--knee" cx="234" cy="216" r="7" />
                  <g className="trainer__shin trainer__shin--right">
                    <path className="trainer__leg trainer__leg--right trainer__leg--lower" d="M234 216Q240 244 244 269" />
                    <path className="trainer__shoe trainer__shoe--right" d="m244 269 24 5" />
                  </g>
                </g>
              </g>
            )}
            <g className="trainer__arm trainer__arm--left trainer__profile-arm">
              <path className="trainer__arm-segment trainer__arm-segment--upper" d="M178 126Q176 143 181 157" />
              <circle className="trainer__joint trainer__joint--elbow" cx="181" cy="157" r="7" />
              <g className="trainer__forearm trainer__forearm--left">
                <path className="trainer__arm-segment trainer__arm-segment--lower" d="M181 157Q184 174 187 184" />
                <circle cx="189" cy="190" r="10" />
              </g>
              <path className="trainer__sleeve trainer__sleeve--left" d="M178 126c-2 11-1 21 2 30" />
            </g>
            {!oneArm && (
              <g className="trainer__arm trainer__arm--right trainer__profile-arm">
                <path className="trainer__arm-segment trainer__arm-segment--upper" d="M205 126Q213 141 214 157" />
                <circle className="trainer__joint trainer__joint--elbow" cx="214" cy="157" r="7" />
                <g className="trainer__forearm trainer__forearm--right">
                  <path className="trainer__arm-segment trainer__arm-segment--lower" d="M214 157Q216 173 214 184" />
                  <circle cx="214" cy="190" r="10" />
                </g>
                <path className="trainer__sleeve trainer__sleeve--right" d="M205 126c7 10 9 20 9 30" />
              </g>
            )}
            <g className="trainer__profile-head trainer__head-part">
              <path className="trainer__profile-neck trainer__skin" d="M169 96q6 13 1 24h25q-6-13-1-28Z" />
              <path className="trainer__profile-face trainer__skin" d="M160 28c26-17 55 0 57 29l18 13-17 13c-6 22-29 34-49 25-23-10-31-38-20-61 3-8 7-14 11-19Z" />
              {!hidesHair && avatar.hair !== "bald" && (
                <g className="trainer__profile-hair">
                <path className="trainer__hair trainer__hair--crop" d="M151 51c1-29 22-43 45-39 20 4 30 17 30 38-19-10-48-11-75 1Z" />
                <path className="trainer__hair trainer__hair--wave" d="M148 57c-4-34 20-51 45-47 27 4 39 23 34 53l-12 18c0-30-17-42-40-36-8 4-16 8-27 12Z" />
                <g className="trainer__hair trainer__hair--coils">
                  <circle cx="153" cy="48" r="16" /><circle cx="160" cy="27" r="17" />
                  <circle cx="181" cy="16" r="18" /><circle cx="204" cy="20" r="18" />
                  <circle cx="220" cy="38" r="17" /><circle cx="221" cy="58" r="15" />
                </g>
                <path className="trainer__hair trainer__hair--braid" d="M150 54c0-31 21-47 46-42 24 5 34 22 30 49-20-11-47-12-76-7Zm63 22c22 23 18 54 7 75l-13-4c9-26 6-46-7-60Z" />
                <path className="trainer__hair trainer__hair--long" d="M148 56c-2-34 21-50 47-45 28 5 39 27 31 66l-9 70-19-5c10-50 3-79-24-96-8 23-8 55 1 92l-20 5c-10-39-12-67-7-87Z" />
                </g>
              )}
              <g className="trainer__profile-headwear" data-layer="headwear-front">
              <path className="trainer__profile-hijab" fillRule="evenodd" d="M160 17c-28 15-32 57-13 88l-17 54 58-34c22-6 38-24 40-50l-8-42c-17-21-42-27-60-16Zm15 24c19-9 37 4 40 24 2 20-11 36-30 38-18 1-31-12-32-31-1-14 7-26 22-31Z" />
              <path className="trainer__profile-dastar" d="M149 56c-2-18 5-34 19-44 6-11 17-16 29-13 17 3 29 16 31 34 5 8 6 17 1 28-24-11-51-13-80-5Z" />
              <path className="trainer__profile-dastar-lines" d="M162 19c17-7 38-2 55 11m-64 5c21-8 47-4 70 10m-72 1c24-6 50-2 76 10" />
              <path className="trainer__profile-kippah" d="M168 27q22-20 43 3-23-5-43-3Z" />
              <path className="trainer__profile-kufi" d="m159 45 4-25q25-7 50 1l7 27q-30-8-61-3Z" />
              <path className="trainer__profile-kufi-lines" d="M163 31c17-4 35-2 53 3" />
              <path className="trainer__profile-veil-back" fillRule="evenodd" d="M159 13c-29 14-34 57-16 92l-19 67 63-46c23-6 39-25 41-51l-9-44c-16-20-41-25-60-18Zm17 28c19-8 36 5 39 24 2 20-11 35-29 37-18 1-31-12-32-30-1-14 7-25 22-31Z" />
              <path className="trainer__profile-veil-drape" d="M151 91c-11 19-15 45-13 73 27 14 59 12 84-3-1-27-7-50-17-67l-12 18c-10 7-23 8-34 2Z" />
              <path className="trainer__profile-veil-coif" fillRule="evenodd" d="M174 18c-24 7-38 27-36 54 2 29 22 48 48 46 25-2 43-23 41-50-2-29-22-57-53-50Zm8 34c15-2 27 7 29 20 2 15-9 27-25 29-15 1-26-9-27-23-1-13 8-23 23-26Z" />
              <path className="trainer__profile-burqa" d="M172 9c-31 10-45 37-41 72l-19 187c37 18 92 18 129 0L224 79c8-34-10-64-52-70Z" />
              <g className="trainer__profile-burqa-mesh">
                <path d="M167 50q29-12 55 8l-3 34q-25-13-51-2Z" />
                <path d="M171 58l47 8m-48 2 47 8m-47 2 45 7m-35-31-5 35m17-35-4 34m17-29-2 31" />
              </g>
              <path className="trainer__profile-cover-fiber" d="M158 31c18-7 39-4 58 6M152 49c23-6 47-3 70 6M148 76c25-3 49 1 71 9M166 21l-7 62M188 16l-4 76M208 23l3 64" />
              </g>
              <path className="trainer__profile-eye-white" d="M176 61q18-18 38 0-18 19-38 0Z" />
              <ellipse className="trainer__profile-pupil" cx="199" cy="61" rx="8.5" ry="11.5" />
              <path className="trainer__profile-closed-eye" d="M178 62q17 12 34 0" />
              <g className="trainer__profile-glasses">
                <rect x="173" y="44" width="45" height="35" rx="14" />
                <path d="M216 61l15 5" />
              </g>
              <path className="trainer__profile-smile" d="M214 87q7 5 13 0" />
              <path className="trainer__profile-frown" d="M213 94q7-6 14 0" />
            </g>
          </g>

          <g className="trainer__faith-accessory trainer__front-only" data-layer="accessory-front">
            <g className="trainer__cross"><path d="M181 129v15m-6-9h12" /></g>
            <g className="trainer__rosary"><path d="M161 123q20 22 39 0" /><circle cx="180" cy="142" r="2" /><path d="M180 144v9m-4-5h8" /></g>
            <g className="trainer__mala"><path d="M157 123q23 28 46 0" /><circle cx="180" cy="150" r="3" /></g>
            <g className="trainer__star"><path d="m180 129 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" /></g>
            <g className="trainer__crescent"><path d="M185 131a9 9 0 1 0 2 14 7 7 0 1 1-2-14Z" /></g>
          </g>
          <g className="trainer__fiber-lines" aria-hidden="true">
            <path className="trainer__fiber trainer__fiber--garment" d="M151 133c18-5 38-4 58 1M147 149c24 4 44 3 67-2M146 186c20-4 43-3 65 2M150 203c18 3 38 2 57-2M160 123l-4 77M181 119l2 91M202 123l4 76" />
            <path className="trainer__fiber trainer__fiber--skin" d="M140 82c5 2 9 2 13 0M207 82c5 2 9 2 13 0M146 43l-3 9M217 44l3 9M160 98l7 2M194 99l7-2" />
            {!hidesHair && avatar.hair !== "bald" && (
              <path className="trainer__fiber trainer__fiber--hair" d="M145 35c12-9 27-13 43-12M139 51c24-13 49-14 74-2M151 24l-4 33M177 15l-2 37M205 24l-4 34" />
            )}
            <path className="trainer__fiber trainer__fiber--cover trainer__front-only" d="M145 35c22-8 47-8 70 1M139 55c28-7 55-6 81 2M133 83c31-5 63-3 93 3M156 21l-5 54M180 16l-2 75M205 22l5 58" />
          </g>
          <g className="trainer__fists" aria-hidden="true">
            <rect x="106" y="178" width="23" height="21" rx="6" />
            <path d="M111 185h13m-12 5h12" />
            <rect x="228" y="178" width="23" height="21" rx="6" />
            <path d="M233 185h13m-12 5h12" />
          </g>
        </g>

        <g className="trainer__support trainer__support--front" data-layer="support-front">
            <g className="trainer__cane">
              <path d="M289 170q21-8 18 12l-19 101" />
            </g>
            <g className="trainer__walker">
              <path d="M75 171h58l-8 103m-43-103 4 103m-8 0h14m26 0h14" />
            </g>
            <g className="trainer__rail">
              <path d="M64 175h73m-59 0v105m46-105v105" />
            </g>
        </g>
      </g>
    </svg>
  );

  if (!onInteract) return figure;

  return (
    <div
      className="trainer-interactive"
      data-view={view}
      data-mobility={avatar.mobility}
      data-reaction={reaction}
      data-facing={facing}
      data-behavior={behavior}
    >
      {figure}
      <div className="trainer-hit-zones" aria-label="Interact with your guide">
        <button className="trainer-hit trainer-hit--head" type="button" aria-label="Pat your guide’s head" onClick={() => onInteract("head")} />
        <button className="trainer-hit trainer-hit--left-hand" type="button" aria-label="Wave to your guide’s left hand" onClick={() => onInteract("leftHand")} />
        {!oneArm && (
          <button className="trainer-hit trainer-hit--right-hand" type="button" aria-label="Wave to your guide’s right hand" onClick={() => onInteract("rightHand")} />
        )}
        <button className="trainer-hit trainer-hit--left-leg" type="button" aria-label="Tap your guide’s left leg" onClick={() => onInteract("leftLeg")} />
        <button className="trainer-hit trainer-hit--right-leg" type="button" aria-label="Tap your guide’s right leg" onClick={() => onInteract("rightLeg")} />
        <button className="trainer-hit trainer-hit--boundary" type="button" aria-label="Interact with your guide" onClick={() => onInteract("boundary")} />
      </div>
    </div>
  );
}
