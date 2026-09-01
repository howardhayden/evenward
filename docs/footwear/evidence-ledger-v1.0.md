# Leather Footwear and Polish - Evidence Ledger

Date opened: 2026-09-01

Branch: `feat/leather-footwear-polish`

Claim boundary: executable pre-production reference; zero Verified requirements

## Evidence chain

### `FP-E001` - Register ID validator rejected valid accessibility IDs

- Issue: the first v1.1 assembly failed on `EVW-FP-A11Y-001`.
- Constraint: stable IDs include category names that may contain digits.
- Design decision: preserve the failed command output and widen only the category character class.
- Rejected alternative: rename existing IDs after publication.
- Implementation: change `^EVW-FP-[A-Z]+-[0-9]{3}$` to `^EVW-FP-[A-Z0-9]+-[0-9]{3}$`.
- Failed test: `node tools/assemble-footwear-register.mjs` threw `EVW-FP-A11Y-001: unstable ID format`.
- Correction: validator updated without altering any requirement ID.
- Verification: assembly produced 125 unique rows, 86 candidate-required, 39 inherited blockers, 0 Verified, and `productionUnlocked: false`.

Further implementation failures and corrections are appended without rewriting this entry.

### `FP-E002` - First care-domain pass did not type-check

- Issue: the first reducer/test integration exposed five TypeScript errors before it could serve as executable evidence.
- Constraint: exact discriminated events, immutable canonical state, and test helpers must compile without weakening the public types.
- Design decision: correct the state/event/test boundaries while retaining the exact schema; do not cast the production reducer into accepting broader input.
- Rejected alternative: silence the failures with `any`, loosen the event union, or exclude the new files from type-checking.
- Implementation: event helpers, reducer branches, public snapshot construction, and test fixtures were aligned to the declared state and event types.
- Failed test: the initial `tsc --noEmit` checkpoint reported five errors.
- Correction: the focused type-check checkpoint passed after the type boundary corrections.
- Verification: later implementation red-teaming continued against a compiling reducer; final branch verification remains a separate ledger entry.
- Remaining blocker: compilation proves type consistency only, not safety, accessibility, optics, devices, or production admission.

### `FP-E003` - Historical progress could authorize a fresh pass

- Issue: a prior nonzero `careAmount` could be mistaken for proof of a cycle in the current pass, and a caller-authored amount could jump progress.
- Constraint: only the locked target, current pass, and an ordered contact cycle may affect modeled progress.
- Design decision: make cycle proof and increment size reducer-owned.
- Rejected alternative: infer cycle completion from `careAmount > 0`, elapsed time, pointer travel, or an event-supplied absolute amount.
- Implementation: add `cycleRecordedThisPass`, reset it at pass boundaries, remove caller amount input, and make each valid `RECORD_CONTACT_CYCLE` add exactly `0.125` with saturation.
- Failed test: a fresh-cycle bypass using historical modeled value reached a later branch in the first pass.
- Correction: historical value, absent current-cycle proof, arbitrary amounts, and saturated increments now reject without mutation.
- Verification: `historical modeled values cannot authorize a new pass`, deterministic-cycle, saturation, and one-target tests in `tests/footwear-care.test.ts`.
- Remaining blocker: the value is modeled demonstration state, not measured polish coverage, layer count, or physical finish.

### `FP-E004` - Care owned footwear material and fidelity concerns

- Issue: placing roughness conversion or fidelity selection in the care reducer would let semantic stages become optical truth and entangle three authorities.
- Constraint: care owns semantic control; footwear owns material conversion; the renderer/resource system owns presentation.
- Design decision: keep the reducer free of roughness, clearcoat, `Pshoe`, and tier logic.
- Rejected alternative: have stage names or completion directly select shader settings or production fidelity.
- Implementation: extract float32 conversion, conservative `Pshoe`, and exact SF0-SF4 selection into `app/domain/footwear-material.ts`.
- Failed test: source-contract red-teaming treated cross-layer material terms in the care domain as a failure.
- Correction: the care domain emits only finite modeled controls and canonical semantic state.
- Verification: layer-ownership source contract plus float32 and tier-boundary unit tests.
- Remaining blocker: the procedural renderer is unrated and no requested-versus-presented production tier transaction exists.

### `FP-E005` - Reachable care transcript weakened product-specific instructions

- Issue: the first reachable transcript did not preserve every protected Water/Set/Finish fact and allowed a generic finishing interpretation.
- Constraint: physical guidance must stay scoped to the named current-label profile; timers and presentation cannot infer confirmation.
- Design decision: use literal Operative copy throughout the reachable graph.
- Rejected alternative: generic cloth wording, historical progress as resistance, inferred waits, or the provenance-only phrase “hot water.”
- Implementation: require current-cycle proof, presently felt resistance, current-label permission for one clean-water drop, explicit 30-minute final dry with no brushing, and then only a light Saphir Lustreur Glove pass.
- Failed test: the initial UI transcript audit failed because required safety/finish language was missing or weaker than the reviewed source.
- Correction: domain messages, next actions, confirmations, controls, and completion disclaimers now share the literal boundary.
- Verification: water-branch tests, the bounded reachable semantic-state/event transcript model in `tests/footwear-care.test.ts`, and representative SSR in `tests/footwear-ui.test.tsx`.
- Remaining blocker: the model covers the registered finite semantic graph but not human comprehension; the current product label and warnings take precedence; the dated product URL is a mutable reference rather than an immutable content pin; and independent review has not passed.

### `FP-E006` - Cycle and terminal proof could be reconstructed

- Issue: object spread could fabricate `cycleRecordedThisPass`, a completion stage, or a safety message while preserving the visible structural shape.
- Constraint: public structural equality must not be sufficient authority to continue or describe a run.
- Design decision: accept only exact-key states issued by the reducer and enforce stage/status/tool/contact/cycle coherence before every transition or copy read.
- Rejected alternative: trust TypeScript types at runtime or validate only numeric fields.
- Implementation: register issued states in a module-private `WeakSet`, validate the complete state schema, and reject forged public-copy inputs.
- Failed test: forged-cycle and forged-complete fixtures demonstrated the structural false-pass route.
- Correction: both fixtures now fail as `INVALID_STATE`; copy/snapshot helpers throw before exposing attacker-authored messages.
- Verification: invalid-snapshot and forged-cycle tests in `tests/footwear-care.test.ts`.
- Remaining blocker: this is an in-process reducer boundary, not a signed or durable event log.

### `FP-E007` - Event exactness was vulnerable to JavaScript object tricks

- Issue: `Object.keys`-style validation could miss inherited identity, non-enumerable extras, symbols, or accessors; naive property reads could execute getter or proxy code.
- Constraint: every event must contain only its registered own enumerable string data fields and exact run/revision identity.
- Design decision: inspect own keys and descriptors, copy only data descriptors into a null-prototype record, and fail closed on reflection errors.
- Rejected alternative: strip unknown fields and continue, accept inherited values, or read candidate properties before descriptor validation.
- Implementation: exact field sets plus descriptor-safe capture in `app/domain/footwear-care.ts`; `targetLocked` separately prevents post-preparation target swaps even after Back.
- Failed test: inherited, hidden, symbolic, accessor, and hostile-reflection attack objects exposed gaps in successive validation drafts.
- Correction: malformed objects reject with the identical canonical state and no getter-derived semantic transition.
- Verification: strict-event and target-lock matrices in `tests/footwear-care.test.ts`.
- Remaining blocker: external event sources still need their own transport and origin controls.

### `FP-E008` - Local callbacks allowed stale last-write-wins commits

- Issue: two callbacks created from one snapshot could both commit if each closed over stale component state; revision reuse across runs created an ABA route.
- Constraint: acceptance must compare against the latest canonical state and use both run and globally monotonic revision identity.
- Design decision: centralize integration in a functional compare-and-swap reducer store.
- Rejected alternative: trust React callback capture order or use revision without run identity.
- Implementation: `footwear-care-store.ts` reduces against current store state; all events carry `expectedRunId` and `expectedRevision`; Restart changes run identity and preserves monotonic revision.
- Failed test: a two-events-from-one-snapshot probe demonstrated the second stale callback route.
- Correction: the first transition commits; the second returns the identical latest state with a stale rejection.
- Verification: functional-store, bounded/collision-safe run-ID, stale-run/revision, Restart, and explicit A -> B -> A replay tests.
- Remaining blocker: the renderer/resource pipeline still lacks the fuller generation/revision/target/mode/tier acknowledgement required by `EVW-FP-AC-008`.

### `FP-E009` - Renderer inputs and claims were under-specified

- Issue: a coarse contact flag and a procedural canvas could hide divergence among shoe, region, tool, stage, four regional values, and written state, while an SF label could launder the reference into an optical claim.
- Constraint: presentation must consume the canonical semantic fields while procedural output remains explicitly unrated.
- Design decision: pass the full semantic map and publish negative claim-boundary metadata.
- Rejected alternative: infer target/tool from stage, mirror one scalar across regions, or call the procedural asset SF0.
- Implementation: the renderer consumes full `CareAmount`, canonical contact/stage/tool/target/motion, owns independent toe/heel materials, presents distinct cotton/water/Lustreur tools, and declares `unrated` plus `data-production-compliance="none"`.
- Failed test: source-contract red-teaming rejected the coarse prop and unsupported SF0 interpretation.
- Correction: full prop mapping and explicit unrated metadata replaced those routes.
- Verification: renderer and UI source-contract tests.
- Remaining blocker: authored assets, measured contact, raw mip 0, near-field reflection, tier residency, and independent optical evidence remain absent.

### `FP-E010` - Renderer cleanup and motion scheduling had fail-open edges

- Issue: setup/render exceptions used different cleanup paths, context restore could reuse partial GPU state, resize handling could miss DPR-only changes, Reduced could miss its final sparse frame, and the Admiral gate was inert at the authored base luma.
- Constraint: failure must tear down the entire resource generation; bounded presentation must finish deterministically without changing semantic progress; color gating must be active only in the buried lobe.
- Design decision: converge lifecycle failure on one idempotent teardown and make presentation boundaries and luma intervals explicit.
- Rejected alternative: patch individual failure sites, resume a partially restored context, depend only on `ResizeObserver`, or claim shader intent without an active numeric gate.
- Implementation: teardown owns RAF/listeners/observer/GPU disposal; context loss stays unavailable on the retained canvas and context restoration starts a new resource generation; window resize plus observer refresh DPR; Reduced schedules through a 900 ms terminal frame; the shared material-domain luma gate drives shader injection.
- Failed test: implementation red-team inspection reproduced cleanup divergence, a sparse-final-frame route, stale DPR, and a zero-valued dark-base gate.
- Correction: all four routes were corrected in the renderer/material boundary.
- Verification: material luma test, source contracts, and static teardown inspection.
- Remaining blocker: executed Strict Mode/context-loss allocation traces, GPU output readback, device refresh-rate traces, and optical masks are still absent.

### `FP-E011` - Route, visibility, and mode changes could conceal contact release

- Issue: unmount, hidden-page, renderer loss, or protective-mode changes could jump directly to pause/new presentation while contact remained active.
- Constraint: contact release must be a visible semantic revision before pause or mode change; unrelated visibility changes must not mutate an inactive Care view.
- Design decision: provide explicit released-boundary store actions and guard page visibility by the active view.
- Rejected alternative: one opaque “pause everything” mutation or a renderer-owned stage transition.
- Implementation: direct active `CONTACT_LOST` rejects; store helpers apply release then pause as two revisions and preserve immutable per-revision/effect `transitionTrace` entries; the page root exposes compact lifecycle metadata; mode changes follow release; page visibility acts only while Care is active.
- Failed test: the first one-revision contact-loss behavior failed the ordered-boundary attack.
- Correction: ordered release and pause are separately observable and renderer time remains presentation-only.
- Verification: contact-loss, exact transition-trace, store boundary, mode transaction, source-contract, and no-clock tests.
- Remaining blocker: framework batching can still coalesce paint; root metadata is not browser visual-trace, visibility/unmount/focus, announcement, or assistive-technology evidence.

### `FP-E012` - Persistence projection admitted hostile extras

- Issue: object spreading or generic serialization could retain injected care fields, and a hostile `toJSON` could alter stored output.
- Constraint: appearance and chess persistence must write only their exact inventories; the care run must remain memory-only.
- Design decision: build exact allowlisted output records rather than serialize caller objects.
- Rejected alternative: blacklist known care keys or depend on TypeScript erasure.
- Implementation: persistence projections select only registered fields, ignore extra/symbolic/custom serializer behavior, and inventory the care run as memory-only.
- Failed test: injected care-looking keys and custom serializers reproduced the write-boundary route.
- Correction: stored JSON contains only the allowlisted appearance or chess schema.
- Verification: hostile injection and data-inventory cases in `tests/persistence.test.ts`.
- Remaining blocker: supported-browser storage and network observation remain required release evidence.

### `FP-E013` - Register checks could certify their own stale or malformed output

- Issue: loose row schemas, copied counts, unrooted or cyclic dependencies, unchecked artifact hashes, and a test command that regenerated outputs could all false-pass.
- Constraint: requirement composition and the production lock must be independently derived without mutating the artifact under test.
- Design decision: make assembly validation exact and keep normal test execution check-only.
- Rejected alternative: compare only the summary's self-reported count or accept arbitrary dependency roots.
- Implementation: exact row keys/types, stable IDs, allowed roots, DFS cycle detection, source/addendum composition hashes, current-register hash, derived counts, and explicit `--check` behavior.
- Failed test: successive mutation probes exposed permissive schema/root/hash checks and a test script that could rewrite stale output before asserting it.
- Correction: independent tests recompute all registered values from artifact bytes and retain the fail-closed status.
- Verification: `tests/footwear-register.test.ts` independently recomputes v1.2 and hard-codes the published v1.1 baseline/delta/addendum/current byte anchors before proving v1.2 appends its delta; current denominator is 137 rows, 95 candidate-required, 42 inherited blockers, 0 Verified, production locked.
- Remaining blocker: manual PDF pins require recomputation against the externally held authority bytes.

### `FP-E014` - Software success could be reported as specification completion

- Issue: a compiling route and passing focused tests could overwrite the meaning of the failed baselines or imply release eligibility.
- Constraint: software verification and requirement verification are separate axes.
- Design decision: preserve every failed artifact, append corrections, and publish an ID-linked evidence map with no Verified label.
- Rejected alternative: rewrite v1.0/v1.1 history, close inherited blockers from source presence, or let a build unlock production.
- Implementation: add `postimplementation-red-team-v1.0.md` and `implementation-evidence-v1.0.md`; keep summary fields `verifiedCount: 0` and `productionUnlocked: false`.
- Failed test: the red-team release audit treats any unqualified “complete,” “compliant,” or “production-ready” statement as a failure.
- Correction: reports distinguish implemented, partial, documented, and inherited-blocked evidence.
- Verification: exact ID coverage and Markdown-link checks are part of this artifact pass; the full branch gate is run independently after the implementation freezes.
- Remaining blocker: every residual production denominator listed in the postimplementation report remains release-blocking; these postimplementation evidence files are not themselves hash-pinned by the v1.2 register.

### `FP-E015` - Contact-offset correction used a noncanonical tool key

- Issue: a verification run during the final renderer correction found five TypeScript errors because new contact-offset records used `finishing-cloth` while the canonical `CareTool` value is `lustreur-glove`.
- Constraint: renderer lookup keys must be exhaustive over the exact care-domain tool union; aliases cannot silently split semantic and visual identity.
- Design decision: retain the canonical domain term everywhere and correct the renderer-owned lookup tables.
- Rejected alternative: widen `CareTool`, cast the records, or introduce a second name solely to make compilation pass.
- Implementation: contact offsets are keyed by `cotton-cloth`, `water-drop`, and `lustreur-glove`.
- Failed test: `npm run typecheck` reported TS2353, TS2741, and TS7053 at the contact-offset declarations/lookups.
- Correction: replace every `finishing-cloth` map key with `lustreur-glove` without changing reachable care events or copy.
- Verification: a clean type-check and focused footwear suite are required after the concurrent renderer correction lands.
- Remaining blocker: green TypeScript and unit checks still do not supply physical-contact, optical, device, or production evidence.

### `FP-E016` - Hostile state inspection and run restart retained edge escapes

- Issue: the event boundary failed closed, but an issued state wrapped by a hostile or revoked proxy could throw during invariant/copy inspection; naive restart suffixing could collide with the current ID or exceed 128 characters.
- Constraint: malformed runtime objects must not escape the reducer as exceptions, and every generated restart identity must remain valid, distinct, and stale-safe.
- Design decision: catch state-reflection failure separately from semantic invalidity and derive restart IDs from the next global revision in two bounded namespaces.
- Rejected alternative: trust `WeakSet.has` alone, append an unbounded suffix to user input, or rely only on run ID against an A -> B -> A replay.
- Implementation: state validation returns `INVALID_STATE` on hostile/revoked inspection; public snapshot/copy throws a bounded diagnostic; `nextCareRunId` returns `care-a:<revision>` or collision fallback `care-b:<revision>`.
- Failed test: hostile/revoked state proxies and a maximum-length/colliding current run exposed the escape/collision routes.
- Correction: reducer rejection preserves the identical supplied state; generated IDs satisfy the exact pattern and differ from the current ID.
- Verification: hostile/revoked proxy, ID-boundary, collision, and A -> B -> A stale-event cases in `tests/footwear-care.test.ts`.
- Remaining blocker: production resource coordinators still need the fuller transaction identity in `EVW-FP-AC-008`.

### `FP-E017` - Care shell and terminal controls exposed interaction contradictions

- Issue: global click capture could react the guide during Care; Complete still showed controls guaranteed to reject; terminal/restart secondary controls could unmount under focus; low-vision scaling omitted essential modeled/boundary/status microcopy.
- Constraint: Care input must not cause unrelated behavior, visible controls must match terminal semantics, and safety-critical text/focus intent must survive state changes.
- Design decision: suppress the ambient reaction for the whole Care view, keep a stable primary slot, refocus it after secondary terminal/restart actions, remove/disable terminal mutations, and explicitly scale essential care microcopy.
- Rejected alternative: depend only on a descendant selector, leave rejecting buttons enabled, allow focus to fall to `body`, or scale only paragraph text.
- Implementation: page capture checks `view === "care"`; the studio owns `primaryActionRef` and revision-scoped refocus intent; the page no longer keys the studio by `runId`, preserving the component/ref across Restart; terminal target/motion/run controls are disabled or absent; low-vision selectors include modeled notices, boundaries, captions, statuses, and release notes.
- Failed test: source/SSR red-team probes found the reaction, terminal affordance, focus-unmount, and microcopy selector gaps.
- Correction: the corresponding application, UI, and CSS source paths now encode the fail-closed behavior.
- Verification: narrow source contracts and representative terminal SSR assertions.
- Remaining blocker: source and SSR do not execute pointer/keyboard isolation, focus restoration, CSS rendering, zoom, low-vision usability, or assistive technology.

### `FP-E018` - Procedural sole and tool origins did not prove placement

- Issue: a vertical Capsule primitive followed by scale could yield the wrong world axis or a sunk sole, and one common tool origin could place differently shaped contact faces above or through a locator.
- Constraint: the procedural reference must at least expose deterministic numeric placement while avoiding a physical-contact claim.
- Design decision: rotate Capsule geometry before applying final scale, compute world dimensions and floor-centered height, and register tool-specific face offsets for toe and heel.
- Rejected alternative: infer grounding from a screenshot, reuse the object origin as the contact surface, or describe numeric coincidence as pressure/contact evidence.
- Implementation: the sole and other-shoe sole use the horizontal geometry helper and shared final scale; the sole lower face is exactly `y = 0`; cotton, water, and Lustreur faces each have an offset whose procedural locator distance is zero.
- Failed test: geometry analysis showed that orientation, final scale, and contact-face ownership were not independently testable.
- Correction: pure exported invariants and exact numeric tests now cover the procedural placement.
- Verification: grounding, aspect-ratio, rotation-source, other-shoe-scale, and all tool/region face-distance cases in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: authored silhouette, continuous normals, sole markers, deformation, pressure, and measured physical contact remain absent.

### `FP-E019` - A successful render call could publish empty or incomplete output

- Issue: `renderer.render` returning did not prove six complete cube framebuffers, required shoe geometry, registered shoe pixels, or readable presentation output; running readbacks every frame would create a performance false-pass of its own.
- Constraint: capability must fail closed on basic local resource/output failure without claiming optical conformance or imposing per-frame readback.
- Design decision: place a bounded sentinel before first capability publication and cache it only for the current resource generation.
- Rejected alternative: accept a successful API call, inspect one center pixel as proof of a shoe, or run the full oracle on every Normal animation frame.
- Implementation: validate each cube face FBO and WebGL error queue; require registered geometry; compare a 64 x 64 offscreen baseline with the shoe hidden versus visible; read an opaque default-buffer pixel; rerun after restored-context generation rebuild.
- Failed test: implementation review found that availability could be published without any framebuffer/readback/landmark oracle.
- Correction: `publishCapability(true)` occurs only after cube capture and the first-generation sentinel; later frames reuse the successful generation-local result.
- Verification: ordering/fail-closed source contracts and pure missing-geometry tests in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: Node tests do not execute browser WebGL; the sentinel does not prove raw mip 0, reflection accuracy, color, glint, optical masks, performance, or supported-device behavior.

### `FP-E020` - Published v1.1 history lacked an independent append-only guard

- Issue: recomputing only current files could accept a coordinated rewrite of the failed v1.1 baseline and summary, then present v1.2 as additive history.
- Constraint: already-published failure evidence must have independent byte anchors outside the mutable summaries being checked.
- Design decision: hard-code the published v1.1 baseline, red-team delta, v1.0 addendum, and current-register hashes in the test, then prove exact canonical concatenation at both version boundaries.
- Rejected alternative: trust only each summary's own hash fields or compare row counts.
- Implementation: `tests/footwear-register.test.ts` checks the preserved bytes and asserts `v1.1 = baseline + delta` and `v1.2 = v1.1 + implementation delta`.
- Failed test: authority red-teaming showed the prior suite could not distinguish coordinated mutation of preserved inputs and their summary.
- Correction: the immutable anchors and append-only equality now fail such a rewrite.
- Verification: `v1.2 preserves the failed v1.1 byte anchors and appends its delta`.
- Remaining blocker: the two manual PDFs remain external hard-coded pins, and mutable product URLs are not content-addressed snapshots.

### `FP-E021` - Back from Water reused consumed current-pass proof

- Issue: returning from Water to Work with Back preserved `cycleRecordedThisPass`, so the just-consumed proof could authorize Water or Set again without a new contact cycle.
- Constraint: Back preserves modeled amounts but cannot preserve an authorization whose meaning is “a cycle in the current pass.”
- Design decision: treat Water-Back as a new pass boundary and consume cycle proof without decreasing any modeled value.
- Rejected alternative: infer a new cycle from the historical positive amount or let the Water screen's unconsumed action preserve proof.
- Implementation: the Back transition clears `cycleRecordedThisPass` when the source stage is Water, while leaving all four `careAmount` values unchanged.
- Failed test: a Work -> Water -> Back sequence could immediately choose Set or Water in the first implementation.
- Correction: both choices now reject with `CONTACT_REQUIRED` until approach/contact/record completes another cycle.
- Verification: the historical-progress regression in `tests/footwear-care.test.ts` asserts preserved amounts, cleared proof, both rejections, and successful reauthorization after a new cycle.
- Remaining blocker: current-pass proof remains modeled semantic evidence, never proof of physical application or resistance.

### `FP-E022` - Restart could violate a newly required protective motion mode

- Issue: a terminal run that began in Normal could create a new Normal run after system/user policy began requiring reduced motion; using native `disabled` on the stable primary also made focus retention impossible while prerequisites were unmet.
- Constraint: restart cannot weaken a current protective motion requirement, Still must remain an explicit stronger choice, and the stable primary must remain focusable without accepting a disabled action.
- Design decision: compute restart motion from current requirement and use guarded `aria-disabled` on the primary action.
- Rejected alternative: copy stale requested motion blindly, force Still back to Reduced, use a native-disabled primary, or accept clicks while `aria-disabled`.
- Implementation: `restartMotionForRequirement` promotes Normal to Reduced only when required and preserves Reduced/Still; the primary button returns early when its `aria-disabled` state is true; the studio persists across Restart without a `runId` React key.
- Failed test: terminal Normal plus a newly true motion requirement constructed a Normal Restart event; focus analysis showed a native-disabled stable control could not retain focus.
- Correction: restart events carry the protected motion, and the primary remains in the tab/focus model while guarded against submission.
- Verification: four restart-policy unit cases and narrow source contracts for the guard, focus ref, and absent run key.
- Remaining blocker: no browser `activeElement`, media-query change, keyboard, switch, voice, or assistive-technology trace has executed.

### `FP-E023` - Runtime-mutable exported registries could poison validation

- Issue: TypeScript `as const` prevented ordinary compile-time mutation but emitted writable arrays, allowing a consumer to append an unsafe care member or fidelity tier before later membership checks.
- Constraint: the registered semantic and fidelity vocabularies must remain invariant for the lifetime of the module.
- Design decision: freeze every exported registry at construction rather than clone it only at individual call sites.
- Rejected alternative: trust compile-time readonly declarations, cast membership results, or freeze only the most visible motion list.
- Implementation: all exported `CARE_*` arrays, rejection codes, unavailable reasons, and `SHOE_FIDELITY_TIERS` use `Object.freeze`.
- Failed test: a runtime cast to `string[]` could call `push("unsafe")` on the first implementation.
- Correction: mutation throws `TypeError`, the unsafe value remains absent, and downstream constructors/target selectors still reject it.
- Verification: `exported semantic registries are runtime immutable and cannot admit unsafe members` in `tests/footwear-care.test.ts`.
- Remaining blocker: unrelated caller objects and external authority content require their own controls; renderer material ranges are handled in the next additive entry.

### `FP-E024` - Valid run identifiers could inject forbidden outcome language

- Issue: run IDs allow safe identifier characters but are caller-controlled. Interpolating `restored` or `inspection-ready` into a description/stale alert made forbidden outcome vocabulary appear even though domain-authored copy avoided it.
- Constraint: internal correlation identity may exist in the public snapshot but must not become user-facing safety or outcome language.
- Design decision: describe the identity boundary generically and never echo raw current or expected run IDs in user-facing copy.
- Rejected alternative: blacklist individual words in otherwise interpolated IDs or weaken valid run-ID syntax.
- Implementation: the description says only that run identity is held in memory; stale-run rejection directs the user to current controls without naming either ID.
- Failed test: initial state `runId="restored"` and stale event `expectedRunId="inspection-ready"` leaked those exact terms.
- Correction: both strings remain available only to machine identity checks/snapshots and are absent from description/rejection copy.
- Verification: adversarial run-ID copy test plus the bounded model's forbidden-language scan across accepted and rejected results.
- Remaining blocker: copy tests cannot replace independent comprehension and assistive-technology review.

### `FP-E025` - Top-level material-range freeze left mutable authority endpoints

- Issue: `FOOTWEAR_MATERIAL_RANGES` was frozen only at its outer record; regional records and their roughness/clearcoat tuples could still be mutated through a runtime cast before material creation.
- Constraint: published numeric endpoints must remain byte-stable in memory once the renderer module initializes.
- Design decision: construct each region through a helper that freezes the record and every non-null tuple, then freeze the containing record.
- Rejected alternative: rely on TypeScript readonly tuples, copy values only when making materials, or detect mutation after rendering.
- Implementation: `frozenMaterialRange` deeply freezes base roughness, clearcoat, coat roughness, and the regional object for toe, heel, side, flex, welt, and sole.
- Failed test: assigning `0.99` to the toe base-roughness lower endpoint through a cast succeeded against the shallow form.
- Correction: the assignment throws `TypeError`, and the original endpoint remains unchanged.
- Verification: `material ranges are deeply frozen against runtime mutation` in `tests/footwear-renderer-invariants.test.ts` checks every nested level and the mutation attempt.
- Remaining blocker: immutable CPU constants do not prove shader uniforms, framebuffer values, region masks, or rendered optical conformance.

### `FP-E026` - Privacy source scan covered too few direct exfiltration primitives

- Issue: a negative scan focused on direct `fetch`-style calls could pass while direct WebSocket, EventSource, Image beacon, CSS remote URL, console, or common tracker source remained.
- Constraint: the local-only reference should reject obvious direct network/telemetry primitives across application code and styles without overstating what regex can prove.
- Design decision: broaden the scanned application extensions and name the claim “direct common primitives.”
- Rejected alternative: describe a source scan as proof of no network behavior or ignore CSS because it is not TypeScript.
- Implementation: scan app CSS/TS/TSX for direct `fetch`/`sendBeacon`/XHR calls, `new WebSocket`/`EventSource`/`Image`, HTTP(S) literals, selected console calls, and common tracker names.
- Failed test: red-team inspection found transports and CSS URLs outside the narrower asserted denominator.
- Correction: each listed direct route now fails the source test.
- Verification: `client source excludes direct common transport, tracker, and console primitives` in `tests/privacy-source.test.ts`.
- Remaining blocker: aliased/computed calls, transitive packages, service workers, extensions, hosting infrastructure, and actual runtime traffic require network observation and dependency review.

### `FP-E027` - Active-contact Cancel was inaccessible despite release-first semantics

- Issue: the reducer correctly rejected direct Cancel during contact, but the UI disabled Cancel instead of offering the required release-then-cancel transaction.
- Constraint: a user must be able to stop a run during contact while `EVW-FP-CARE-014` keeps release observable before values are discarded.
- Design decision: add a store-owned `cancel-at-release` boundary action and keep Cancel available with literal ordering copy.
- Rejected alternative: enable a direct unsafe reducer event, hide Cancel until release, or collapse release and cancellation into one untraceable state.
- Implementation: active approach/contact first accepts `RELEASE`, then accepts `CANCEL`; the store retains two frozen entries with consecutive revisions and exact effects, and the page/studio wire the boundary action.
- Failed test: active-contact SSR exposed a disabled Cancel and no executable ordered boundary.
- Correction: the control is available; the first trace entry is active/release with contact-released, and the second is cancelled/release with run-cancelled and zero modeled values.
- Verification: exact two-entry store trace in `tests/footwear-care.test.ts`, representative UI accessibility in `tests/footwear-ui.test.tsx`, and narrow integration source contracts.
- Remaining blocker: framework batching and SSR do not prove two distinct paints, keyboard/touch/switch/voice operation, focus, announcements, or assistive-technology behavior.

### `FP-E028` - Linear wayfinder invented optional Water visit history

- Issue: the UI marked every stage with a lower index than the current stage as past, so Set or Finish implied optional Water had been visited even when the branch was skipped.
- Constraint: presentation cannot manufacture history that the reducer does not own.
- Design decision: represent missing optional-branch history neutrally rather than infer completed or skipped.
- Rejected alternative: add an unregistered history field, infer from current amount, or label Water completed based on stage order.
- Implementation: when Water is earlier than the current stage and no canonical visit history exists, its state is `optional-unrecorded` and its visible label says “Water (optional; visit not recorded).”
- Failed test: a skipped-Water path at Set rendered Water as a past step.
- Correction: the same state no longer emits `past` for Water and makes no visit claim.
- Verification: `wayfinder never reports optional Water as completed without branch history` in `tests/footwear-ui.test.tsx`.
- Remaining blocker: if product requirements later need visited/skipped reporting, reducer-owned history and additive authority are required.

### `FP-E029` - Setup failure could leak resources allocated before scene attachment

- Issue: tree traversal can dispose only attached objects. If a later constructor threw after a material/geometry/target allocation but before attachment, that resource had no teardown owner; a throwing disposer could also abort later cleanup.
- Constraint: every generation-owned disposable needs an owner at the allocation expression, and one cleanup fault cannot skip unrelated resources.
- Design decision: add a generation-local ownership ledger plus independent cleanup-step execution.
- Rejected alternative: rely only on scene traversal, register resources after successful construction, or allow the first disposer exception to abort teardown.
- Implementation: allocations immediately pass through `disposableOwnership.own`; `disposeAll` is idempotent, empties its set, and invokes every disposer through fault-isolated cleanup.
- Failed test: an injected setup exception before scene attachment left two registered stand-ins pending, and an injected first-disposer exception demonstrated the skip route.
- Correction: `disposeAll` invokes both, empties the ledger, and a second call performs no duplicate disposal; source audit covers hall, materials, shoe/proxy/tool resources, proxy material, and cube target.
- Verification: setup-ownership and independent-cleanup tests in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: browser GPU heap, Strict Mode remount, context restoration, and repeated injected-constructor failure traces have not executed.

### `FP-E030` - Renderer and Studio could duplicate assertive failure announcements

- Issue: both the pixel renderer and semantic Studio used `role="alert"` for one capability failure, risking duplicate assertive announcements across the acknowledgement transition.
- Constraint: one canonical semantic owner must announce failure assertively while the visual layer may still display its local fallback.
- Design decision: give Studio sole assertive ownership and downgrade/hide renderer semantics according to domain acknowledgement.
- Rejected alternative: let both alert, hide the visual failure entirely, or make Studio depend on canvas text.
- Implementation: renderer failure is `role="status"` before acknowledgement and `aria-hidden="true"` after `domainFailureAcknowledged`; no renderer markup uses `role="alert"`.
- Failed test: source-role inspection found two independent assertive channels for the same failure.
- Correction: the renderer no longer competes with the canonical Studio alert.
- Verification: `renderer failures defer assertive announcement ownership to Studio` in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: static source does not prove live-region timing, one announcement in an actual accessibility tree, coalescing, or screen-reader output.

### `FP-E031` - Unrelated rejection could suppress renderer-failure guidance

- Issue: after Studio became the sole assertive owner, selecting an event rejection before renderer capability failure could hide the instruction not to begin or resume contact.
- Constraint: a canonical domain error must remain highest priority, renderer unavailability must not be suppressed by an unrelated rejection, and only one Studio alert should be selected.
- Design decision: centralize alert arbitration in one pure function with the explicit order domain error, renderer capability failure, then event rejection.
- Rejected alternative: render multiple assertive nodes, let the most recently updated source win, or make event rejection unconditionally dominant.
- Implementation: `studioAlertMessage` returns `state.error` first, the fixed renderer-unavailable instruction second when capability is false, and `rejection` only after those conditions.
- Failed test: the adversarial false-capability plus unrelated-rejection case returned the rejection instead of the renderer safety instruction under rejection-first selection.
- Correction: the same case now selects the renderer instruction, while a canonical domain error still supersedes it and an ordinary available-renderer rejection remains visible.
- Verification: pure priority cases in `tests/footwear-ui.test.tsx` and the single-Studio-alert source contract in `tests/footwear-source-contract.test.ts`.
- Remaining blocker: pure-function, SSR, and source evidence do not execute React callback races, browser live-region replacement/coalescing, announcement order, or assistive-technology output.

### `FP-E032` - Renderer loss could permit contact progress or strand safe release

- Issue: Work/Finish controls could allow a new approach or a recording/finish transition while renderer capability was false or still unknown; simply disabling the primary action in every contact state would strand a tool already approaching or in contact.
- Constraint: unavailable or unknown visual capability must stop new contact-dependent progress without preventing a non-recording withdrawal or release to a safe boundary.
- Design decision: derive the primary action from a pure capability/contact policy: available continues, unavailable/unknown clear-or-release waits, and unavailable/unknown approach-or-contact exposes release.
- Rejected alternative: trust a stale enabled action, disable all Work/Finish controls, record a cycle while unavailable, or let the renderer mutate domain progress.
- Implementation: clear/release states show a guarded `aria-disabled` “Approach when the 3D reference is available” action; approach/contact states expose enabled `RELEASE` as “Withdraw”/“Release” and do not expose `RECORD_CONTACT_CYCLE` or `FINISH_PASS_RELEASED`. Renderer-loss recovery Resume stays guarded until capability is true.
- Failed test: the red-team policy matrix identified the false-capability clear-state progress route and the all-disabled approach/contact dead end.
- Correction: the matrix now returns `wait` for clear/release and `release` for approach/contact whenever capability is false or unknown, while returning `continue` only when true.
- Verification: pure policy cases and guarded recovery SSR in `tests/footwear-ui.test.tsx`, with narrow call-site/source assertions in `tests/footwear-source-contract.test.ts`.
- Remaining blocker: helper/SSR/source checks do not execute renderer callbacks, an end-to-end browser work/finish sequence, focus retention, live announcements, or assistive-technology behavior; the capability callback remains revisionless under `EVW-FP-AC-008`.

### `FP-E033` - Sequential resize calls could transiently exceed the drawing-buffer cap

- Issue: validating only the final width x height x DPR request did not bound intermediate allocation. Applying a new DPR to stale canvas dimensions before changing logical size could briefly allocate more than `MAX_DRAWING_BUFFER_PIXELS`.
- Constraint: every allocation step, not only the final observed dimensions, must stay within the exact validated target and the 8,388,608-pixel local cap.
- Design decision: remove sequential pixel-ratio/size mutation from the guarded resize and use exact drawing-buffer sizing from a known minimal baseline.
- Rejected alternative: trust Three.js update order, raise the cap, or validate only after the oversized intermediate allocation.
- Implementation: when dimensions or DPR change, resize first calls `setDrawingBufferSize(1, 1, 1)`, then `setDrawingBufferSize(width, height, devicePixelRatio)`, and rejects any result not equal to the prevalidated request.
- Failed test: the adversarial `1 x 320 @ 16` target is valid at 81,920 pixels, but applying DPR 16 to a stale 300 x 150 canvas could transiently request 4,800 x 2,400, or 11,520,000 pixels.
- Correction: both explicit allocation requests are bounded; the guarded source contains no `setPixelRatio` or `setSize` path.
- Verification: drawing-buffer boundary cases and exact source-order assertions in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: pure arithmetic and source order do not measure actual browser/GPU allocations, driver behavior, memory pressure, frame cost, or supported-device limits.

### `FP-E034` - Pre-dispatch WebGL loss could destroy the restoration path

- Issue: the local loss flag was set only by the context-loss event. If the underlying context was already lost first, a limit query could fail and follow the permanent-buffer-failure teardown path, removing the canvas/listeners required for restoration.
- Constraint: an underlying lost context must remain unavailable on its retained canvas until `webglcontextrestored` can initiate a clean generation, even before event dispatch updates local state.
- Design decision: install loss/restore listeners before the initial resize and inspect the underlying context both before limit queries and in the resize catch path.
- Rejected alternative: classify every query failure as unsupported hardware, tear down immediately, or rely only on event ordering.
- Implementation: resize checks `resizeContext.isContextLost()` before `MAX_RENDERBUFFER_SIZE`; its catch calls the guarded `underlyingContextIsLost`; either loss route calls `retainLostContextForRestore` without teardown, and restored context tears down then increments the resource generation.
- Failed test: lifecycle source-order review reproduced a window in which loss preceded local flag mutation and a null/throwing limit query selected permanent teardown.
- Correction: listeners precede the first resize, and pre-query/catch loss detection preserves the restoration route.
- Verification: context-loss ordering and detection assertions in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: no browser has executed the pre-dispatch race, actual loss/restore events, resource reallocation, Strict Mode interaction, or a supported backend/device matrix.

### `FP-E035` - Raw outer props could throw during renderer metadata coercion

- Issue: nested care semantics were validated before the WebGL effect, but JSX data attributes still interpolated raw outer prop values. A value with a throwing `Symbol.toPrimitive` or `toString` could escape during SSR before fail-closed runtime validation.
- Constraint: the whole component boundary must reject getters, proxies, symbols, extras, invalid enums, and hostile coercion without executing attacker-controlled accessors or serializing raw values.
- Design decision: capture exact own enumerable data descriptors once, validate a frozen semantic snapshot, and render only that snapshot or fixed inert metadata.
- Rejected alternative: validate only `careAmount`, read props through ordinary property access, catch only inside the effect, or coerce hostile values for diagnostics.
- Implementation: `captureRendererComponentBoundary` reflects the required semantic and optional callback/acknowledgement fields without invoking getters, delegates to exact semantic capture, and returns null on any trap or mismatch. JSX emits validated values or the literal `invalid`; the runtime receives a frozen invalid sentinel.
- Failed test: adversarial shoe metadata with throwing coercion hooks escaped while raw props were bound to `data-shoe`.
- Correction: representative SSR does not throw, emits `data-shoe="invalid"` and inert companion metadata, and never invokes an outer getter.
- Verification: getter/proxy/extra/invalid-enum capture cases and hostile-coercion SSR in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: this is a renderer-component boundary defense, not browser reconciliation, callback-race, framework, or arbitrary-application sanitization evidence.

### `FP-E036` - Primary-only capability checks omitted the rendered hand

- Issue: cotton, water, and Lustreur primaries could each be renderable while the hand mesh was missing/non-rendering or either cotton-hand/Lustreur-hand composite failed, yet capability could still publish true.
- Constraint: every presentation-owned tool surface actually used by the reference must participate in the fail-closed per-generation capability transaction across both shoes and both rigid target regions.
- Design decision: keep the three independent primary probes and add the hand independently plus the two hand-bearing composites.
- Rejected alternative: infer hand success from its existence in the scene graph, test only one shoe/region, or let a primary-only readback stand in for a composite.
- Implementation: preflight requires `care.hand` to be independently renderable and performs 64 x 64 baseline/output reads for `hand-independent`, `cotton-cloth-with-hand`, and `lustreur-glove-with-hand`, alongside all three primaries, for left/right x toe/heel before capability publication.
- Failed test: the prior oracle enumerated only the three primary meshes and explicitly hid all other care meshes, so a missing hand had no effect on its result.
- Correction: a zero-draw-range hand now fails the pure renderability guard, and the source-order contract requires all three added readback variants before publication.
- Verification: pure mesh renderability plus variant, shoe/region loop, readback, and publication-order assertions in `tests/footwear-renderer-invariants.test.ts`.
- Remaining blocker: Node does not execute the GPU reads. These probes do not prove physical hand/tool coupling, contact tolerance, occlusion quality, authored assets, optical metrics, accessibility, or supported-device output.

### `FP-E037` - Frozen software checkpoint passed without unlocking production

- Issue: after concurrent implementation and repeated red-team correction, an earlier partial run or the mere presence of tests could be mistaken for final execution evidence; conversely, a green final run could be laundered into a production or Verified claim.
- Constraint: preserve the exact final command/result boundary and keep software execution separate from register status and absent acceptance evidence.
- Design decision: record one closing checkpoint after code freeze, then revalidate the additive documentation separately without changing code or register artifacts.
- Rejected alternative: summarize only “tests pass,” omit the previously failed TypeScript checkpoint, count source/SSR checks as browser/GPU/AT evidence, or change `verifiedCount` after a green build.
- Implementation: on the frozen code, `npm run check && npm run test:footwear && git diff --check` exited 0. `check` reported lint PASS, type-check PASS, Next 16.2.6 production build PASS with static `/` and `/_not-found`, 100/100 unit tests PASS, and 1/1 rendered-HTML test PASS. `test:footwear` reported register `--check` PASS and 76/76 footwear tests PASS; the bounded semantic model covered 10,263 states and 543,939 transitions.
- Failed test: `FP-E015` preserves the earlier five-error renderer tool-key type-check failure; no failure from that checkpoint was erased or rewritten.
- Correction: the frozen rerun is green while the historical failure and every subsequent additive correction remain in sequence.
- Verification: the register reported 137 unique requirements = 95 candidate-required + 42 inherited blockers, `verifiedCount: 0`, `productionUnlocked: false`, and current-register SHA-256 `043e233b6596225623585a1ffaf04f1b977a655474478fcfd8cb1c86cebd6491`.
- Remaining blocker: the command transcript precedes this documentation-only append, and its software/build/source/SSR/unit coverage is not browser callback/interaction, WebGL/GPU, device, accessibility-tree/AT, physical-contact, optical, performance-soak, runtime-network, human-comprehension, or independent-review evidence. The postimplementation verdict remains FAIL with zero Verified requirements.

### `FP-E038` - Author-authorized source integration was conflated with production release

- Issue: the preserved authority and red-team records correctly prevented green checks from manufacturing release permission, but their broad wording also treated an explicit later author decision as unable to authorize a reviewed source merge or public standalone repository.
- Constraint: direct author authority may change repository-governance eligibility without rewriting failed history, admitting candidate production authority, reducing blockers, creating Verified credit, or unlocking production.
- Design decision: preserve every closed v1.0-v1.2 candidate, red-team, register, and summary byte; preserve the prior ledger as an exact prefix; and append a dated integration decision plus eight independently testable v1.3 atoms for the Evenward merge, standalone public repository, noncommercial license, exact metadata, historical preservation, gate separation, operational evidence, and bounded standalone extraction.
- Rejected alternative: edit `EVW-FP-AUTH-006`, `EVW-FP-RT-028`, or care addendum 1.1 in place; infer permission from passing tests; treat a GitHub merge as a release; or make the standalone repository commercially permissive.
- Implementation: `author-integration-decision-2026-09-01.md` records exact precedence; `requirements-v1.3-author-integration-delta.jsonl` appends to the canonical v1.2 register; the v1.3 summary independently records source/public authority, denies commercial-use and production-release authority, and retains the closed gate.
- Failed test: applying the preserved v1.2 wording after the direct author instruction still returned merge/public-repository ineligibility, while simply deleting the wording destroyed the evidence chain and risked collapsing merge into release.
- Correction: source integration is now explicitly authorized by the author rather than by CI. Release, production, compliance, and Verified eligibility remain unchanged.
- Verification: the register tests hard-code all closed v1.1 and v1.2 artifact anchors plus the ledger prefix, prove v1.3 is exactly v1.2 plus its eight-row delta, independently hash the decision and composition, and assert 145 unique rows = 103 candidate-required + 42 inherited blockers, 0 Verified, and `productionUnlocked: false`.
- Remaining blocker: creation, visibility, license, metadata, commit, push, and merge facts for the public standalone repository require a post-operation GitHub record. None can substitute for the 42 inherited production blockers or missing physical, optical, browser, accessibility, device, performance, privacy-observation, comprehension, and independent-review evidence.

### `FP-E039` - Additive integration authority could silently stale the register or evidence map

- Issue: adding a decision and delta without regenerating every current artifact could leave tests on v1.2, omit new IDs from the evidence map, or report copied rather than byte-derived counts and hashes.
- Constraint: v1.3 must remain exactly append-only, independently reproducible, completely mapped, and fail-closed before any repository operation begins.
- Design decision: move the assembler and focused tests to v1.3, retain hard-coded v1.1 and v1.2 anchors, independently derive every composition hash/count, and audit the evidence-map denominator separately.
- Rejected alternative: leave `requirements-v1.2-current.jsonl` as the test target, copy 145 into prose without parsing the register, or allow the generator to run implicitly during the checking command.
- Implementation: the assembler reads the eight-row integration delta only after the preserved 137-row v1.2 composition and writes `requirements-v1.3-current.jsonl` plus `requirements-v1.3-summary.json`; check mode remains read-only.
- Failed test: the former active test and documentation paths addressed v1.2 and therefore could not observe a stale or missing v1.3 decision.
- Correction: active paths, counts, append-only proof, authority pin, integration-authority fields, README, testing guide, documentation index, roadmap, distribution table, and evidence map now address v1.3.
- Verification: `npm run test:footwear` exited 0 with the corrected v1.3 register `--check` and 76/76 focused tests. The register reports SHA-256 `3bbeb298744c03f2897d9ea53666d0c7a0c5fe0c52f8755c4b2b3a1ba18f9c8f`, 145 unique rows = 103 candidate-required + 42 inherited blockers, 0 Verified, and `productionUnlocked: false`. A separate parser found all 145 IDs exactly once in the evidence map, and staged plus unstaged `git diff --check` exited 0.
- Remaining blocker: the local checkpoint contains no post-operation GitHub evidence and grants no production, release, compliance, commercial-use, or Verified credit.
