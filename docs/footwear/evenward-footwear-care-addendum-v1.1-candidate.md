# Evenward Footwear Care Addendum — Implementation Red-Team Correction

Version: 1.1 candidate  
Date: 2026-09-01  
Precedence: additive correction to version 1.0 candidate  
Claim boundary: executable pre-production reference; zero Verified requirements; production remains locked

## 1. Precedence and provenance

Version 1.0 remains preserved as the authority candidate that failed implementation red-teaming. This document supersedes only the clauses named below. The Avatar and Footwear manuals retain their prior ownership. A generated register summary pins the exact bytes of both care addenda and the two source manuals.

The named product profile is the Saphir Amiral Gloss page as reviewed on 2026-09-01. Its current label and warnings govern physical use. A changed or unavailable label requires renewed review; this static reference cannot attest that a later label is unchanged.

## 2. Exact reducer boundary

Version 1.0 section 3 is corrected. The reducer-issued state has exactly these fields:

```ts
type CareState = {
  revision: number;
  runId: string;
  status: "checking" | "ready" | "active" | "paused" | "complete" | "unavailable" | "cancelled";
  stage: "compatibility" | "prepare" | "apply" | "work" | "water" | "set" | "finish" | "complete";
  shoe: "left" | "right";
  region: "toe" | "heel";
  targetLocked: boolean;
  tool: "cotton-cloth" | "water-drop" | "lustreur-glove";
  contact: "clear" | "approach" | "contact" | "release";
  cycleRecordedThisPass: boolean;
  careAmount: Record<"left-toe" | "left-heel" | "right-toe" | "right-heel", number>;
  requestedMotion: "normal" | "reduced" | "still";
  presentedMotion: "normal" | "reduced" | "still";
  message: string;
  error: string | null;
};
```

Reducer issuance is part of the runtime trust boundary. A reconstructed object is invalid even when structurally identical. This prevents a caller from forging completion history, cycle proof, or operative copy. State stays memory-only.

Every event has exact keys, `expectedRunId`, and `expectedRevision`. Missing fields, semantic extras, a wrong run, a stale revision, or malformed payload reject without changing the state object or revision. A functional store evaluates events against the latest committed state; two events stamped from one snapshot cannot both commit. One accepted semantic event increments revision exactly once. A release followed by pause or protective-mode change therefore produces two ordered entries in the store's in-memory `transitionTrace`, and the application shell mirrors that trace in its care lifecycle metadata. Framework rendering may still batch the final presentation; this mechanism is not device-level visual-trace evidence.

### State coherence

| Status | Allowed stage | Tool | Contact rule | Current-pass proof |
| --- | --- | --- | --- | --- |
| `checking` | `compatibility` | cotton cloth | clear/release | false |
| `ready` | `prepare` | cotton cloth | clear/release | false |
| `active` | apply/work/water/set/finish | stage-owned | approach/contact only in work or finish | false in apply; otherwise reducer-owned |
| `paused` | any non-complete procedure stage | stage-owned | clear/release | preserved only when coherent with its stage |
| `complete` | `complete` | Lustreur Glove | release | true |
| `unavailable` | `compatibility` | cotton cloth | clear/release | false |
| `cancelled` | any non-complete stage | stage-owned | clear/release | false and modeled values cleared |

Water owns the water-drop tool. Finish and Complete own the Lustreur Glove. Other stages own the cotton cloth. Current-pass proof implies a positive modeled value on the locked target and is invalid in Compatibility, Prepare, Apply, Unavailable, or Cancelled.

Availability is `checking` throughout Compatibility unless the run is Unavailable or Cancelled, `available` after Compatibility, and `unavailable` for Unavailable or Cancelled. Renderer capability is reported separately and does not upgrade semantic availability.

## 3. Target and modeled-cycle correction

Version 1.0 section 4's safe-boundary alternation sentence is superseded. Shoe and region can change only during Compatibility or Prepare. Accepting preparation locks one toe-or-heel target for the remainder of that run. Another target requires Cancel or Complete followed by Restart. This constraint avoids falsely resuming a lossy per-target stage history that the canonical state does not contain.

`PLACE_THIN_AMOUNT` clears `cycleRecordedThisPass`. Only ordered Approach → Contact → Record-and-release sets it. Historical nonzero `careAmount` cannot prove a cycle in a new pass. Returning from the water-drop stage consumes the proof and requires a new contact cycle.

The caller no longer supplies an absolute care value. Each accepted record event adds exactly `0.125` to the selected in-memory demonstration value, saturating at `1`. The increment is a deterministic interface fixture, not a physical quantity, measured coverage, layer count, cadence, or product recommendation. Recording at saturation rejects; Set remains available after current-pass proof.

## 4. Water and final-dry correction

Work may enter Water only when all of these are explicit in the current pass:

- an ordered contact cycle was recorded;
- resistance is presently felt by the user and is not inferred by the application; and
- the current Saphir Amiral Gloss label permits one clean-water drop at that point.

The authorization covers one declared drop and is consumed when Work resumes. The interface never tells the user to create resistance or to reproduce an authored animation cadence.

For the reviewed Saphir profile, Set means keeping cloth and brush clear for the current label's 30-minute final dry. The application uses no timer to infer completion; the user confirms it explicitly. Finish then permits only a light pass with the Saphir Lustreur Glove named by the reviewed label. It does not authorize brushing, a generic substitute cloth, or another worked wax layer.

## 5. Completion and recovery

Complete is terminal except Restart. It means only that the modeled sequence reached the final Lustreur Glove release. Back, target changes, motion changes, pause, and care events reject from Complete.

The completion report lists all four modeled target values, says which were not treated, and says that physical finish is not measured or declared. Flex, seams, welt, sole, and unlisted material regions are described as excluded; they are not care-selectable. Version 1.0's promise to report an observed/declared physical finish is superseded.

Approach withdrawal is distinct from contact release. Renderer loss during either phase withdraws or releases first and then pauses with assertive recovery. Page hiding while Care is active and route exit perform the same release-then-pause ordering. Page hiding elsewhere does not alter an untouched care run.

## 6. Presentation correction

The procedural WebGL shoe is an **unrated procedural reference**, not SF0. SF0–SF4 remain demand intervals selected only from measured presentation pixels and other registered inputs. This route supplies no presented-tier transaction and earns no fidelity credit.

The renderer receives the complete four-target care map and applies toe and heel independently. It also receives canonical shoe, region, stage, tool, contact, and motion. Cotton cloth, one water drop, and Lustreur Glove have distinct representatives. Still may expose a separately labeled representative contact phase; it cannot alter canonical contact or modeled progress.

The reference camera is fixed to avoid trapping scroll or pointer input. Required camera perturbation, raw mip-0 reflection, box projection, near-field reflection, authored geometry, and optical comparison evidence remain blocked.

Renderer capability is not revision-acknowledged with the semantic snapshot. A renderer failure pauses active contact and is literal, but full multi-consumer request/ack parity remains an inherited production blocker.

## 7. Motion, focus, and announcements

Normal, Reduced, and Still accept the same semantic events. Reduced animates bounded non-contact approach and release presentation; committed contact is placed at the locator immediately. Still is demand-rendered and exposes Previous phase, Next phase, Describe current state, Pause, Cancel, and Restart without autonomous semantic advance.

The primary action occupies one stable control slot across ordinary forward progression. Unsolicited semantic announcements are run/revision scoped, coalesced, and limited to at most once per second. On-demand description is immediate. Failures use an assertive channel; when the canonical domain has acknowledged a renderer failure, the duplicate renderer message is hidden from assistive technology.

Keyboard focus, touch, switch, voice, zoom, forced-colors, and screen-reader equivalence still require device and human evidence. The reference implementation and source tests do not mark them Verified.

## 8. Preserved production blockers

This correction grants no merge, release, or production credit. The following remain blocked: canonical authority admission and signature; authored shoe assets and full avatar/tool locators; raw mip-0, box-projected, and near-field reflection transactions; projected-pixel tier and residency acknowledgements; full-consumer denominator coverage; optical, color, glint, temporal, and zoom evidence; measured contact and kinematics; device/browser/performance matrices; assistive-technology, comprehension, and independent review evidence.

## 9. External product reference

- Saphir, “Amiral Gloss,” Care Instructions, reviewed 2026-09-01: https://saphir.com/products/amiral-gloss

The product reference informs only this named compatibility profile and never supersedes its current physical label or warnings.
