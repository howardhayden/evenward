# Evenward Footwear Care Addendum

Version: 1.0 candidate  
Date: 2026-09-01  
Decision lineage: `EVC-015`  
Claim boundary: pre-production authority candidate; zero Verified requirements; no production unlock

## 1. Authority and boundary

This candidate supplies the missing care authority required by `EVC-015`. It does not supersede the Evenward Avatar Production Manual revision 1.0 or the Mirror-Polished Black Footwear manual revision 1.0.

Ownership remains separated:

- Care owns the care state graph, tool compatibility, procedural safeguards, region selection, stage progression, normalized per-region care state, progress language, completion language, recovery, accessibility descriptions, and care evidence.
- Avatar and movement own body, hand, foot, tool, and contact kinematics and locators.
- Footwear owns immutable material regions, clearcoat conversion, optics, reflection sources, and `ShoeFidelityTier` selection.

Care may emit a finite normalized `careAmount` for one immutable material region. It may not write shader roughness, create a material region, change a region boundary, recolor the shoe, or lower optical fidelity.

The tracked product remains production-locked by the complete Evenward specification gate. This addendum and its reference implementation carry no production-compliance credit until they are admitted to the canonical manifest, propagated into the complete register, independently reviewed, and verified with the required physical and device evidence.

## 2. Supported care scope

The sequence admits only black, smooth, finished leather dress or service footwear whose maker and selected product permit wax glazing. Unknown material, suede, nubuck, patent leather, shell cordovan, exotic leather, oiled leather, damaged finish, synthetic material, or an incompatible product fails closed to `unavailable` with a literal reason and recovery.

Before application, the user must confirm that the footwear and product are compatible and that an inconspicuous-area test has been completed. Product-label directions and warnings govern physical use. Evenward never infers material or product compatibility from an image, color, filename, or prior run.

The reference sequence models Saphir Amiral Gloss only as a named compatibility profile. The maker describes it as glazing for toe caps and heel counters, directs a small amount on a cotton cloth in small circles with light pressure, introduces a drop of water when resistance is felt, advises alternating shoes while layers dry, requires a 30-minute final dry without brushing, and directs an inconspicuous-area test. The application must not generalize that profile to another product.

The Avatar manual's phrase “hot-water-assisted” is preserved in provenance, but it does not authorize an invented temperature. User-facing operative copy says “one drop of clean water, only when the product label permits.” The reference implementation does not tell the user to heat water. The 8–18 mm travel and roughly 3–5 Hz reversal are authored demonstration kinematics, not a gesture, speed, or precision target the user must reproduce.

## 3. Canonical care state

The care state is one synchronously queryable record:

```ts
type CareState = {
  revision: number;
  runId: string;
  status: "checking" | "ready" | "active" | "paused" | "complete" | "unavailable" | "cancelled";
  stage: "compatibility" | "prepare" | "apply" | "work" | "water" | "set" | "finish" | "complete";
  shoe: "left" | "right";
  region: "toe" | "heel";
  tool: "cotton-cloth" | "water-drop" | "finishing-cloth";
  contact: "clear" | "approach" | "contact" | "release";
  careAmount: Record<"left-toe" | "left-heel" | "right-toe" | "right-heel", number>;
  requestedMotion: "normal" | "reduced" | "still";
  presentedMotion: "normal" | "reduced" | "still";
  message: string;
  error: string | null;
};
```

Every transition increments `revision`. The runtime rejects a missing, stale, non-finite, out-of-range, or incompatible state. It never silently clamps `careAmount`, advances a stage from elapsed animation, or substitutes another tool, region, material, product, or shoe.

Care progress is session-only. It is not written to browser storage, analytics, history, or a peer/profile record. Leaving the care route pauses the run; Cancel discards it; Restart creates a new run. Reload discards it.

## 4. State graph and recovery

Only these forward transitions are valid:

1. `compatibility -> prepare` after explicit smooth-leather, product-label, and hidden-area confirmations.
2. `prepare -> apply` after laces/debris and dryness are confirmed.
3. `apply -> work` after a thin amount is placed on the selected rigid region.
4. `work -> water` after at least one authored contact cycle; this does not assert a physical result.
5. `water -> work` when another thin pass is wanted and the product label permits one drop of water.
6. `work -> set` when the user chooses to let the layer set.
7. `set -> finish` only after the user explicitly confirms the product-directed wait has completed.
8. `finish -> complete` after the finishing-cloth pass is released.

`Back` returns to the preceding safe boundary without undoing physical care or decreasing recorded `careAmount`; the copy must say that the screen cannot undo material already applied. `Pause` releases contact and freezes the care clock. `Cancel` releases contact, records `cancelled`, and makes no finish claim. Contact loss during an active motion pauses the run and presents a literal recovery action.

The sequence may alternate left and right shoes at a safe release boundary. Shoe or region changes during contact are rejected. Toe and heel are the only glazing targets. Vamp/flex, seams, welt, and sole remain visible and selectable for explanation, but never receive mirror-glaze progress.

## 5. Demonstrated contact and progression

The authored normal-motion track couples hand, cloth, selected shoe, selected rigid region, and care state. The cloth remains tangent to the leather through each working stroke, travels 8–18 mm, reverses roughly 3–5 times per second, and releases before any shoe, region, tool, stage, or mode transaction.

Progress is earned from valid contact cycles on the selected immutable region. A visual animation, timer, pointer gesture, shader frame, or texture transition cannot independently advance it. The renderer receives only the semantic `careAmount` after a valid transition. `EVC-049` then converts that value to public clearcoat roughness; `EVC-050` reevaluates demanded shoe fidelity.

No stage may show a blue film, broaden the glint, brighten the whole upper, flatten the shoe, or crossfade between before/after textures. Increasing care makes reflected information more coherent within the authored rigid region while the shoe remains neutral black leather and flex remains materially rougher.

## 6. Layered language

Every care instruction is segmented before presentation:

- Operative: exact tool, region, contact, order, product-directed wait, material limit, consequence, and recovery.
- Experiential: optional Catalysis language describing observable attention or surface change.
- Interpretive: optional explanation of optics or system causality.
- Accessibility equivalent: the complete meaning without imagery, color, sound, animation, or spatial inference.

Contact, timing, accessibility, and safety content is Operative-only and immediately legible. It cannot be moved into a tooltip, illustration, animation, metaphor, color state, or optional layer. The register may shape eligible care orientation and reflection only after semantic-fact equality is proven.

## 7. Motion and accessibility

Normal presents the authored contact motion. Reduced presents the same stage and contact truth using a slow, bounded approach-contact-release demonstration with no rapid reversal, shimmer, or inertia. Still presents one contact-safe representative for the current stage and exposes Previous phase, Next phase, Describe current state, Pause, Cancel, and Restart controls. Changing to a more protective mode releases contact first and commits the representative state atomically.

The complete sequence is operable with keyboard, touch, switch, and voice without rubbing, dragging, hovering, color recognition, or animation timing. Focus remains on the initiating control across preparation, failure, retry, and mode changes. No automatic focus movement accompanies progress.

Written state names the current shoe, region, tool, contact, stage, and next available action. Shape and text distinguish selected shoe, eligible rigid region, excluded flex region, contact, progress, and completion. The mirror finish is never the only state cue. On-demand description is immediate. Unsolicited progress is polite, atomic, coalesced within the current run, and no more frequent than once per second. Contact loss and operation failure use a separate assertive alert.

## 8. Completion language

`complete` means only that the modeled sequence reached its final release boundary. It does not assert that the physical shoe is restored, protected, undamaged, inspection-ready, or polished to a particular optical threshold. The final state reports the selected regions, recorded care amounts, observed/declared finish, and any regions not treated.

## 9. Evidence and release gates

Care evidence must preserve the chain `issue -> constraint -> design decision -> implementation -> failed test -> correction -> verification`. At minimum it includes:

- legal and illegal state-transition fixtures;
- material/product compatibility and hidden-area negative fixtures;
- wrong-shoe, wrong-region, wrong-tool, hovering, clipping, and contact-loss fixtures;
- measured 8–18 mm travel and 3–5 Hz reversal evidence for Normal;
- Reduced and Still phase/contact equivalence;
- keyboard, touch, switch, voice, zoom, contrast, forced-colors, and screen-reader traces;
- proof that progress is absent from persistent storage and network output;
- shader input/readback showing finite normalized per-region state without direct care-to-roughness writes;
- optical regressions required by the footwear manual after every care-state change;
- failure, correction, and independent review records.

## 10. External care references

- Saphir, “Amiral Gloss,” product instructions and compatibility guidance: https://saphir.com/products/amiral-gloss
- Saphir, “Bulling High Shine Guide,” sequence overview: https://uk.saphir.com/pages/bulling-high-shine-guide-detail

These references inform the named compatibility profile. They do not supersede product labeling, the Evenward manuals, or a later signed care authority.
