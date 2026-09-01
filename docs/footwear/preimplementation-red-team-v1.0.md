# Leather Footwear and Polish - Preimplementation Red Team

Date: 2026-09-01  
Subject: `requirements-v1.0-pre-redteam.jsonl`  
Verdict: **FAIL - correction and re-atomization required**  
Initial denominator: 97 unique requirements (68 candidate-required, 29 inherited blockers)

This record is immutable failure evidence. Its corrections are additive in `requirements-v1.1-redteam-delta.jsonl`; the original register remains unchanged.

## Attacks, failures, and required atoms

| Attack | Initial false-pass route | Result | Required correction IDs |
| --- | --- | --- | --- |
| Dark-theme identity | Existing shoes inherit `--ink`, which becomes near-white in dark modes. A new renderer could also consume theme color. | FAIL | `EVW-FP-RT-001` |
| Cosmetic shine | A CSS gradient, SVG stroke, matcap, decal, baked hall, or screen-fixed window could satisfy source-presence tests. | FAIL | `EVW-FP-RT-002`, `EVW-FP-RT-003` |
| Whole-upper patent shortcut | One low-roughness material can look shiny while erasing flex, seam, welt, and sole ownership. | FAIL | `EVW-FP-RT-004` |
| Mask-denominator gaming | Empty or tiny polished masks can make every percentage gate pass. | FAIL | `EVW-FP-RT-005` |
| Background-dominated similarity | Black pixels outside meaningful regions can inflate SSIM and hide a broken toe reflection. | FAIL | `EVW-FP-RT-006` |
| Blue branding leak | A subtle navy base or tinted glint may pass subjective review while breaking buried-lobe-only ownership. | FAIL | `EVW-FP-RT-007` |
| Reflection-source substitution | PMREM-only, SSR-only, or unprojected cube-only paths each fail a different camera/environment perturbation. | FAIL | `EVW-FP-RT-008` |
| Split cubemap | Six faces from different semantic times can be displayed as one probe. | FAIL | `EVW-FP-RT-009` |
| Capture cleanup failure | An exception can leave the target hidden or the other shoe in proxy material. | FAIL | `EVW-FP-RT-010` |
| Stale asynchronous commit | Rapid scene, shoe, region, mode, DPR, or zoom changes can commit old resources to a newer state (ABA race). | FAIL | `EVW-FP-RT-011` |
| Subthreshold drift | Repeated movement below each invalidation threshold can accumulate without refreshing a now-wrong probe. | FAIL | `EVW-FP-RT-012` |
| Context loss | WebGL loss or memory eviction can resume with partial or stale resources. | FAIL | `EVW-FP-RT-013` |
| Lifecycle leak | React Strict Mode remounts can duplicate render loops, listeners, GPU resources, and announcements. | FAIL | `EVW-FP-RT-014` |
| Remote dependency | Loading HDR, models, textures, or analytics from the network breaks local-only privacy and offline behavior. | FAIL | `EVW-FP-RT-015` |
| Progress-as-physical-truth | A normalized virtual `careAmount` can be read as measured coverage or guaranteed real finish. | FAIL | `EVW-FP-RT-016` |
| Timer-made care | A timer, animation end, pointer distance, or shader frame can advance a care stage without a semantic transition. | FAIL | `EVW-FP-RT-017` |
| Unsafe product generalization | A named product's water/drop/dry behavior can silently become advice for every polish or leather. | FAIL | `EVW-FP-RT-018` |
| “Hot water” laundering | The source phrase can become an unbounded physical temperature instruction or Catalysis metaphor. | FAIL | `EVW-FP-RT-019` |
| Mode switch in contact | Reduced/Still changes can teleport the tool or leave contact asserted against a different representative pose. | FAIL | `EVW-FP-RT-020` |
| Route and global click collision | Existing idle click capture can trigger the guide's wave while a care control is used; leaving the route can strand active contact. | FAIL | `EVW-FP-RT-021`, `EVW-FP-RT-022` |
| Persistent care history | Adding footwear to appearance preferences can retain run state without consent. | FAIL | `EVW-FP-RT-023` |
| One compliant hero | A large inspection shoe can pass while the other shoe, compact trainer, peers, profile, seated state, or fallback retains generic strokes. | FAIL | `EVW-FP-RT-024` |
| Accessible state drift | Canvas, DOM, Wayfinder, live region, and on-demand description can expose different revisions. | FAIL | `EVW-FP-RT-025` |
| Linguistic-register self-attestation | Candidate flags or labels can declare copy “Operative” without proving protected facts are directly comprehensible. | FAIL | `EVW-FP-RT-026` |
| Resource downgrade | Reduced effects, compute tier, memory pressure, or performance code can flatten reflection or expose under-tier resources. | FAIL | `EVW-FP-RT-027` |
| Unsupported completion | The reference branch can be mistaken for a production implementation because it renders and its unit tests pass. | FAIL | `EVW-FP-RT-028` |

## Boundary probes added by the red team

- `careAmount` and transition mask: `0` and `1` valid; negative epsilon, `1 + epsilon`, `NaN`, positive/negative infinity, `null`, and string values fail before material activation.
- `Pshoe`: immediately below and exactly at `96`, `256`, `640`, and `1200`; DPR 1, 2, and 3; 200% and 400% zoom; asymmetric left/right sizes; multiple active views.
- Color: C*ab `1.999` passes and `2.000` fails; Delta E00 `1.499` passes and `1.500` fails.
- Glint: nonempty masks, pixel-count rounding, `>95%` and `>80%` denominators, core and halo endpoints.
- Reflection: camera orbit, shoe rotation, environment movement, off-screen landmark, asymmetric handedness, invalid near-field hit, and probe fallback.
- Probe invalidation: below, equal to, and above each registered translation, rotation, near-geometry, and light threshold, plus cumulative subthreshold movement.
- Care contact: approach, exact contact, release, wrong shoe, wrong region, wrong tool, pause, cancel, mode switch, route exit, rapid restart, and stale event revision.
- Motion: exact 8 mm/18 mm travel and approximate 3 Hz/5 Hz reversal endpoints; the input path never demands those values from the user.
- Temporal: 120-frame ordinary still, 300-frame Still mode, 90-degree/second orbit, background/foreground transitions, and zero autonomous glint.
- Lifecycle: Strict Mode mount/unmount/remount, WebGL context loss/restore, route unmount, page visibility change, and resource-preparation cancellation.

## Decisions after attack

1. Preserve the existing SVG shoe paths as explicit noncompliant legacy evidence; do not paint shine onto them.
2. Implement the feature only on the isolated `feat/leather-footwear-polish` branch as a pre-production reference route.
3. Use real 3D geometry and a physical dielectric material. A procedural reference mesh may exercise interfaces, but it cannot satisfy authored-asset, silhouette, macro-texture, full-avatar, device, or independent optical gates.
4. Keep care run state in memory only. No care history enters `AvatarConfig` or local storage.
5. Keep all reachable care copy Operative-only until the exact Catalysis register authority and independent copy validator pass. The layered architecture remains documented but disabled in this candidate.
6. Expose modeled care progress explicitly as a virtual demonstration value, not a measurement of a physical shoe.
7. Treat every unavailable full-system obligation as an inherited blocker, not an omitted or waived requirement.

## Implementation unlock for this branch

The red team authorizes only an executable reference implementation after the 28 corrections are re-atomized. It does not unlock production, merge to main, release, or Verified status. Full production remains blocked by the canonical Evenward propagation, replacement 3D runtime, authored assets, exact device manifest, independent optical/accessibility review, and every inherited requirement in the current register.
