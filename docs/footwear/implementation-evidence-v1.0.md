# Leather Footwear and Polish - Implementation Evidence Map

Date: 2026-09-01

Register: `requirements-v1.3-current.jsonl`

Evidence boundary: **145 IDs mapped; zero Verified; production locked**

This map records what the executable reference currently exercises. It does not change a register row's scope disposition and it does not promote any row to Verified.

## Status vocabulary

| Evidence status | Meaning |
| --- | --- |
| **Implemented - unverified** | An executable mechanism and relevant automated software evidence exist. Required device, optical, physical, accessibility, or independent evidence may still be absent. |
| **Partial - unverified** | The procedural reference exercises only part of the requirement or lacks the acceptance measurement named by the row. |
| **Documented - unverified** | Provenance, architecture, or a fail-closed claim boundary is recorded and mechanically checked, but external admission or independent review is absent. |
| **Blocked - inherited** | The current register explicitly retains the obligation as an inherited blocker; the reference supplies no production acceptance evidence. |

There is intentionally no `Verified` status in this document.

## Exact ID-to-evidence mapping

| Requirement IDs | Implementation anchor | Automated or documentary evidence | Evidence status |
| --- | --- | --- | --- |
| `EVW-FP-AUTH-001`, `EVW-FP-AUTH-003`, `EVW-FP-AUTH-006`, `EVW-FP-AC-001` | Additive registers, both care candidates, pinned authority metadata, and fail-closed summary under [`docs/footwear`](.). | Independent v1.3 hash/count/root checks, hard-coded published v1.1 and reviewed v1.2 byte anchors, and append-only composition proof in [`tests/footwear-register.test.ts`](../../tests/footwear-register.test.ts). | Documented - unverified |
| `EVW-FP-AUTH-002`, `EVW-FP-AUTH-004`, `EVW-FP-AUTH-005` | Typed separation among [`footwear-care.ts`](../../app/domain/footwear-care.ts), [`footwear-material.ts`](../../app/domain/footwear-material.ts), and the renderer/integration. | Layer-ownership source contract in [`tests/footwear-source-contract.test.ts`](../../tests/footwear-source-contract.test.ts). | Implemented - unverified |
| `EVW-FP-SCOPE-001`, `EVW-FP-SCOPE-002`, `EVW-FP-SCOPE-003` | Fixed black smooth-leather/product profile and explicit user confirmations in the care reducer and studio. | Compatibility, unavailable-fact, and transcript tests. | Implemented - unverified |
| `EVW-FP-GEO-001`, `EVW-FP-GEO-006` | Separate procedural meshes plus rotated/scaled sole and welt grounded from computed dimensions in [`LeatherFootwearRenderer.tsx`](../../app/components/care/LeatherFootwearRenderer.tsx). | Numeric grounding/axis checks in [`tests/footwear-renderer-invariants.test.ts`](../../tests/footwear-renderer-invariants.test.ts) and local source contract. | Partial - unverified |
| `EVW-FP-GEO-002`, `EVW-FP-GEO-003`, `EVW-FP-GEO-004`, `EVW-FP-GEO-005` | No canonical bones/markers or measured authored silhouette/normal asset. | Visible in the inherited-blocker register denominator. | Blocked - inherited |
| `EVW-FP-REG-001`, `EVW-FP-REG-002`, `EVW-FP-REG-003`, `EVW-FP-REG-004`, `EVW-FP-REG-005`, `EVW-FP-REG-006`, `EVW-FP-REG-007`, `EVW-FP-REG-008` | Independent procedural mesh/material ownership and deeply frozen regional range records/tuples in the renderer. | Named-region source contract plus nested mutation tests. No GPU parameter readback. | Partial - unverified |
| `EVW-FP-MAT-001`, `EVW-FP-MAT-002`, `EVW-FP-MAT-003`, `EVW-FP-MAT-004`, `EVW-FP-MAT-005` | Neutral near-black base, dielectric parameters, disabled transmission/iridescence/sheen, and immutable source ranges in physical materials. | Source and deep-freeze tests only; no output measurement. | Partial - unverified |
| `EVW-FP-MAT-006`, `EVW-FP-MAT-007`, `EVW-FP-MAT-008` | Production precision, leather grain, and micron-equivalent micro-swirls are not authored or measured. | Inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-COLOR-001` | Shared buried-Admiral luma gate in [`footwear-material.ts`](../../app/domain/footwear-material.ts) and diffuse-only shader injection. | Linear-luma boundary test in [`tests/footwear-care.test.ts`](../../tests/footwear-care.test.ts). | Partial - unverified |
| `EVW-FP-COLOR-002`, `EVW-FP-COLOR-003`, `EVW-FP-COLOR-004` | No masked output color measurement exists. | Inherited optical-QA denominator. | Blocked - inherited |
| `EVW-FP-REF-001`, `EVW-FP-REF-002`, `EVW-FP-REF-003` | Procedural physical material, local cube camera/target, and point glint exercise the layer interfaces. Per-generation sentinels check six cube FBOs and basic output; raw mip 0 is explicitly not claimed. | Source-order/oracle contracts in [`tests/footwear-renderer-invariants.test.ts`](../../tests/footwear-renderer-invariants.test.ts); no browser GPU execution. | Partial - unverified |
| `EVW-FP-REF-004`, `EVW-FP-REF-009` | Confidence-weighted near field and full production reflection composition are absent. | Inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-REF-005`, `EVW-FP-REF-006`, `EVW-FP-REF-007`, `EVW-FP-REF-008` | Target hiding, rough other-shoe proxy, locally generated hall landmarks, and excluded UI/postprocess in probe capture. | Renderer source contract; cleanup source inspection. | Partial - unverified |
| `EVW-FP-LIGHT-001`, `EVW-FP-LIGHT-002`, `EVW-FP-LIGHT-003` | Point glint, fixed tone-map exposure, and no bloom/postprocess path in the reference. | Source inspection; no apparent-angle or output-halo measurement. | Partial - unverified |
| `EVW-FP-LOD-001`, `EVW-FP-LOD-002`, `EVW-FP-LOD-003`, `EVW-FP-LOD-004`, `EVW-FP-LOD-005`, `EVW-FP-LOD-006`, `EVW-FP-LOD-007` | Pure conservative-Pshoe and tier-selection functions with a runtime-frozen tier registry in [`footwear-material.ts`](../../app/domain/footwear-material.ts). The procedural renderer presents no tier. | Exact endpoints, asymmetric-view maximum, max-demand, and registry-mutation tests. | Implemented - unverified |
| `EVW-FP-LOD-008`, `EVW-FP-LOD-009`, `EVW-FP-LOD-010`, `EVW-FP-LOD-011` | No octave, source-texel, parity-transition, or requested-versus-resident production coordinator exists. | Inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-CARE-001`, `EVW-FP-CARE-002`, `EVW-FP-CARE-003` | Exact opaque state, runtime-frozen semantic registries, bounded/collision-safe run IDs, compound event identity, one-revision transitions, and finite controls. | Initial-state, registry mutation, hostile/revoked state, strict-event, A -> B -> A replay, invariant, and transition tests. | Implemented - unverified |
| `EVW-FP-CARE-004`, `EVW-FP-CARE-005` | Float32-ordered toe and flex conversion functions owned by [`footwear-material.ts`](../../app/domain/footwear-material.ts). | Independent float32 and invalid-input tests. | Implemented - unverified |
| `EVW-FP-CARE-006`, `EVW-FP-CARE-007` | Explicit compatibility and preparation confirmations in the reducer/UI. | Compatibility and preparation matrices. | Implemented - unverified |
| `EVW-FP-CARE-008`, `EVW-FP-CARE-009` | One descriptor-safe frozen renderer snapshot drives shoe/region/tool/contact/stage poses; tool-specific faces have numeric zero-distance toe/heel locator offsets, and Normal uses a nominal 12 mm peak-to-peak, four-reversal-per-second path. A per-generation preflight includes each primary, the hand independently, and cotton/Lustreur hand composites across shoe by region. While renderer capability is unavailable or unknown, the UI blocks new approach and recording/finish progress but retains non-recording withdraw/release. | Pure snapshot/hostile-coercion, locator/pose-identity, mesh-renderability, variant-source, and renderer-contact-policy tests plus domain ordering and representative SSR. No browser GPU/callback sequence, rendered frame, or physical-contact measurement. | Partial - unverified |
| `EVW-FP-CARE-010`, `EVW-FP-CARE-011`, `EVW-FP-CARE-012` | Current-pass cycle proof, Water-Back proof consumption, resistance and label-permission gate, explicit product-directed wait, and literal finish sequence. | Water, Back/new-cycle, wait, and representative copy tests. | Implemented - unverified |
| `EVW-FP-CARE-013`, `EVW-FP-CARE-014`, `EVW-FP-CARE-015`, `EVW-FP-CARE-016` | Monotonic Back, released-boundary pause/Cancel/mode operations with immutable two-step traces, contact mutation rejection, and outcome-limited completion. | Back, exact release/pause and release/Cancel traces, terminal, and representative completion tests. Framework batching is not visual evidence. | Implemented - unverified |
| `EVW-FP-MODE-001`, `EVW-FP-MODE-002` | Reduced boundary presentation, release-first protective changes, restart promotion from Normal to required Reduced, and Still preservation/representative controls with no reducer clock. | Three-mode domain equivalence, pure restart-policy cases, and Still SSR tests. | Partial - unverified |
| `EVW-FP-MODE-003` | Cross-mode optical, topological, shadow, written, and nonvisual equivalence is not device-tested. | Inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-COPY-001` | Operative safety, order, stop, recovery, and outcome boundaries avoid raw caller-controlled run identity. | Bounded reachable semantic-state/event transcript model plus adversarial run-ID injection tests; no human comprehension evidence. | Implemented - unverified |
| `EVW-FP-COPY-002` | Catalysis copy remains disabled; no classification or semantic-equivalence evidence exists. | Inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-A11Y-001`, `EVW-FP-A11Y-002`, `EVW-FP-A11Y-003`, `EVW-FP-A11Y-004` | Text labels, semantic controls, stable focusable primary, active-contact Cancel ordering, neutral optional-Water history, no run-key remount, terminal controls, revision-derived copy, live channels, description, low-vision scaling, and one Studio alert arbiter ordered domain error over renderer failure over rejection. Renderer loss blocks contact progress while preserving withdraw/release. | Narrow pure-function/source/representative SSR and immutable-snapshot tests. No renderer-callback sequence, `activeElement`, input, CSS, live-region timing, or AT execution. | Partial - unverified |
| `EVW-FP-PRIV-001` | Care stays in reducer memory and is absent from persisted types/write projections; app CSS/TS/TSX excludes direct common transport, remote-URL, tracker, and selected console primitives. | [`tests/persistence.test.ts`](../../tests/persistence.test.ts) and [`tests/privacy-source.test.ts`](../../tests/privacy-source.test.ts). No runtime traffic observation. | Implemented - unverified |
| `EVW-FP-QA-001`, `EVW-FP-QA-002`, `EVW-FP-QA-003`, `EVW-FP-QA-004`, `EVW-FP-QA-005`, `EVW-FP-QA-006`, `EVW-FP-QA-007`, `EVW-FP-QA-008`, `EVW-FP-QA-009` | No independent mask, glint, recognition, tier-parity, landmark, luma-stability, or trail measurements exist. | All nine remain in the inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-PERF-001`, `EVW-FP-PERF-002` | No supported-device frame-cost matrix or three-run 180-second soak exists. | Both remain inherited blockers. | Blocked - inherited |
| `EVW-FP-EVID-001`, `EVW-FP-AC-011` | Additive [evidence ledger](evidence-ledger-v1.0.md), [preimplementation report](preimplementation-red-team-v1.0.md), [postimplementation report](postimplementation-red-team-v1.0.md), and this map. | Register schema/hash checks and explicit issue-to-correction chains. | Documented - unverified |
| `EVW-FP-EVID-002` | The claim policy refuses to substitute source/DOM evidence for executed mechanisms. | Zero-Verified summary and residual-blocker audit. Independent review is still absent. | Documented - unverified |
| `EVW-FP-RT-001`, `EVW-FP-RT-002`, `EVW-FP-RT-003`, `EVW-FP-RT-004` | Theme-independent physical materials, no cosmetic shortcut, procedural 3D geometry, and per-region ownership. | Renderer source contract. No independent pixels or authored-asset evidence. | Partial - unverified |
| `EVW-FP-RT-005`, `EVW-FP-RT-006`, `EVW-FP-RT-007`, `EVW-FP-RT-008`, `EVW-FP-RT-009` | Required mask denominators, balanced regions, isolated color layers, perturbations, and atomic six-face transaction are absent. | All five remain inherited blockers. | Blocked - inherited |
| `EVW-FP-RT-010` | Probe mutation restoration uses `finally`; generation-local ownership begins at allocation; independent idempotent cleanup survives a throwing disposer; sentinels are cached per generation. | Injected pure ownership/cleanup faults and renderer source-order audit; no browser GPU fault matrix. | Partial - unverified |
| `EVW-FP-RT-011`, `EVW-FP-RT-012` | No full identity-bound resource transaction or cumulative capture-origin invalidator exists. | Both remain inherited blockers. | Blocked - inherited |
| `EVW-FP-RT-013`, `EVW-FP-RT-014` | Context loss fails closed on the retained canvas; listeners precede initial resize, underlying loss is checked before limit queries and in the catch path, and restore advances a full generation. Exact validated drawing-buffer sizing uses a safe 1 x 1 baseline; allocation-time ownership and independent teardown cover RAF/listener/observer/GPU resources. | Pure buffer/ownership/cleanup fault tests and lifecycle-order source assertions; no browser context-loss, GPU-allocation, or Strict Mode trace. | Partial - unverified |
| `EVW-FP-RT-015` | Renderer resources are generated locally; app CSS/TS/TSX has no direct common transport constructor/call, HTTP(S) literal, named tracker, or selected console primitive. | Narrow negative source contracts; aliases, transitive dependencies, and runtime traffic are not proven absent. | Implemented - unverified |
| `EVW-FP-RT-016`, `EVW-FP-RT-017`, `EVW-FP-RT-018`, `EVW-FP-RT-019`, `EVW-FP-RT-020` | Modeled-only labeling, event-only semantics, product-scoped physical copy, no heat inference, release-first mode changes, and required-motion restart promotion. | Domain transitions, pure restart-policy cases, and representative copy tests. | Implemented - unverified |
| `EVW-FP-RT-021`, `EVW-FP-RT-022` | Page capture exits for the active Care view and care surfaces; route/visibility exit records release-then-pause store trace entries and root lifecycle metadata. | Page/store source contracts and exact trace tests. Framework batching is not a browser/device visual trace. | Partial - unverified |
| `EVW-FP-RT-023` | Exact persistence projections exclude care fields and hostile serializers. | Persistence injection tests. | Implemented - unverified |
| `EVW-FP-RT-024`, `EVW-FP-RT-025` | Whole-consumer denominator and one-revision canvas acknowledgement are not complete. | Both remain inherited blockers. | Blocked - inherited |
| `EVW-FP-RT-026` | Bounded reachable semantic copy remains Operative-only and excludes raw run identity. | Model traversal covers every registered event type, stage, status, target, mode, contact, unavailable reason, Back destination, and rejection code discovered within the finite semantic graph. | Implemented - unverified |
| `EVW-FP-RT-027` | No equal-fidelity resource-pressure coordinator exists. | Inherited-blocker denominator. | Blocked - inherited |
| `EVW-FP-RT-028` | Build/source/unit success is isolated from register scope, Verified count, and production lock. | Fail-closed register test and summary. | Documented - unverified |
| `EVW-FP-AC-002`, `EVW-FP-AC-003`, `EVW-FP-AC-004`, `EVW-FP-AC-005` | Opaque exact state/events, functional CAS, persistent target lock, deterministic current-pass progress, and the Water gate. | State-forgery, strict-event, race, target-lock, cycle, and Water tests. | Implemented - unverified |
| `EVW-FP-AC-006`, `EVW-FP-AC-007` | Exact Saphir finish boundary and terminal modeled-only completion report. | Reachable copy and complete-event tests. | Implemented - unverified |
| `EVW-FP-AC-008` | Versioned render request/acknowledgement does not exist; current availability is a revisionless boolean callback. | Explicitly retained inherited blocker. | Blocked - inherited |
| `EVW-FP-AC-009` | Procedural renderer metadata is explicitly unrated and claims no presented tier or compliance. A descriptor-safe whole-component boundary emits inert invalid metadata on hostile inputs; per-generation FBO/geometry/readback sentinels include the shoe, each tool primary, the hand independently, and cotton/Lustreur hand composites. | Renderer source, pure invariants, hostile-coercion SSR, and preflight-order checks; no browser GPU execution. | Implemented - unverified |
| `EVW-FP-AC-010` | UI/source mechanisms include canonical Studio assertive-failure ownership, nonassertive/hidden renderer duplication control, explicit domain-error > renderer-failure > rejection priority, and renderer-loss contact gating with a withdraw/release escape. Focus, input, zoom, colors, callback timing, live-region behavior, and AT traces have not run. | Explicitly retained inherited blocker. | Blocked - inherited |
| `EVW-FP-AC-012` | Canonical admission, authored assets, measured contact/kinematics, optical transactions, tier residency, propagation, device evidence, and independent review are absent. | Explicitly retained release blocker. | Blocked - inherited |
| `EVW-FP-INT-001`, `EVW-FP-INT-005`, `EVW-FP-INT-006` | The dated [author integration decision](author-integration-decision-2026-09-01.md) separates source integration from the unchanged release/production gate and preserves v1.0-v1.2 by append-only composition. | Independent decision hash, v1.1/v1.2 byte anchors, v1.3 append-only register test, and fail-closed summary. | Documented - unverified |
| `EVW-FP-INT-002`, `EVW-FP-INT-003`, `EVW-FP-INT-004`, `EVW-FP-INT-007`, `EVW-FP-INT-008` | Public `ShoeCareStudio`, its bounded extraction, PolyForm Noncommercial 1.0.0 license surface, exact metadata, and post-operation record are author-approved requirements. | The source repository already carries the noncommercial licensing model; standalone path-denominator/build evidence plus public metadata, refs, and merge require post-operation evidence. | Partial - unverified |

## Frozen v1.2 execution checkpoint

The final code checkpoint `npm run check && npm run test:footwear && git diff --check` exited 0 before this additive documentation close. It reported lint and type-check passing, a Next 16.2.6 production build with static `/` and `/_not-found`, 100/100 unit tests, 1/1 rendered-HTML test, register `--check`, and 76/76 focused footwear tests. The bounded semantic model covered 10,263 states and 543,939 transitions. The register remained 137 unique rows (95 candidate-required, 42 inherited blockers), 0 Verified, `productionUnlocked: false`, with SHA-256 `043e233b6596225623585a1ffaf04f1b977a655474478fcfd8cb1c86cebd6491`.

This checkpoint supports only the automated/documentary evidence named in the table. It does not provide browser callback/interaction, WebGL/GPU, physical, optical, device, accessibility-tree/AT, performance-soak, runtime-network, comprehension, or independent-review evidence, so none of the statuses below becomes Verified.

## Evidence locations

- Domain and store: [`app/domain/footwear-care.ts`](../../app/domain/footwear-care.ts), [`app/domain/footwear-care-store.ts`](../../app/domain/footwear-care-store.ts)
- Material conversion and fidelity selection: [`app/domain/footwear-material.ts`](../../app/domain/footwear-material.ts)
- Reference renderer and care UI: [`app/components/care/LeatherFootwearRenderer.tsx`](../../app/components/care/LeatherFootwearRenderer.tsx), [`app/components/care/ShoeCareStudio.tsx`](../../app/components/care/ShoeCareStudio.tsx)
- Integration and persistence: [`app/page.tsx`](../../app/page.tsx), [`app/domain/persistence.ts`](../../app/domain/persistence.ts)
- Executable software checks: [`tests/footwear-care.test.ts`](../../tests/footwear-care.test.ts), [`tests/footwear-renderer-invariants.test.ts`](../../tests/footwear-renderer-invariants.test.ts), [`tests/footwear-ui.test.tsx`](../../tests/footwear-ui.test.tsx), [`tests/footwear-source-contract.test.ts`](../../tests/footwear-source-contract.test.ts), [`tests/footwear-register.test.ts`](../../tests/footwear-register.test.ts), [`tests/persistence.test.ts`](../../tests/persistence.test.ts), [`tests/privacy-source.test.ts`](../../tests/privacy-source.test.ts)

## v1.3 author-integration registration

The additive author decision changes source-governance authority only. The v1.3
register contains 145 unique rows: 103 `candidate-required` and 42
`inherited-blocker`. It reports 0 Verified and `productionUnlocked: false`.
The register's integration-authority record permits the Evenward main merge and
the public standalone repository, denies commercial-use and production-release
authority, and leaves every v1.2 production blocker unchanged. Remote creation,
push, metadata, and merge results must be appended after those operations are
observed.

After the additive registration, `npm run test:footwear` exited 0: the
v1.3 `--check` gate passed and all 76 focused footwear tests passed. Independent
mapping inspection found every one of the 145 register IDs exactly once in this
map, with no missing or extra ID. Both staged and unstaged `git diff --check`
also exited 0; `.gitattributes` suppresses only intentional Markdown hard-break
spaces in the three exact preserved footwear artifacts.

## Claim result

This map accounts for all 145 register IDs, but it records **0 Verified**. Implemented and partial mechanisms remain pre-production evidence. Every inherited blocker and every missing acceptance measurement remains release-blocking.
