# Testing

## Automated checks

`npm run test:unit` covers:

- trainer state transitions, directional walking, reactions, rapid input,
  pause/resume, reduced motion, leaving, and reload recovery;
- movement-catalog completeness, distinct animation signatures, starting
  positions, ordered directions, access adaptation, grounded floor geometry,
  and phase data;
- appearance and chess persistence, validation, migration, and deletion;
- source-level absence of direct common transport, tracker, remote-URL, and
  sensitive console primitives, plus Patterns keyboard/text capture;
- initially closed lesson disclosures and one authoritative full-size trainer;
- native dialog semantics and absence of application-level key capture;
- trainer layer names, joints, profile pivots, theme-stable facial colors, and
  translucent-surface fallbacks.

`npm run test:footwear` first checks the composed 145-row candidate register
(103 candidate-required, 42 inherited blockers, zero Verified) without rewriting
it, then covers:

- exact care-state schema, legal and illegal transitions, revision and run
  identity, stale/ABA rejection, contact ordering, release boundaries, and
  target isolation;
- all supported and unsupported compatibility facts, preparation, one-drop
  label permission, explicit wait, cancellation, restart, and bounded
  completion copy;
- finite no-clamp modeled values, float32 conversion order, and exact SF0-SF4
  projected-pixel boundaries;
- bounded model-based enumeration of reachable canonical semantic states and
  their accepted/rejected operative copy under the registered event exemplars,
  plus representative server-rendered UI transcripts;
- source-level memory/network exclusions, Care click-capture isolation,
  production-blocker labels, local-only renderer contracts, and dependency
  pins;
- exact register schema, rooted acyclic dependencies, byte-derived counts and
  hashes, and stale generated-artifact detection.

The focused suite does not execute browser clicks, focus movement, live-region
timing, WebGL drawing, device input, arbitrary hostile JavaScript beyond the
registered attack fixtures, or independent linguistic review. Those claims
remain in the manual and independent-review gates.

`npm test` builds the production export before running unit and rendered-HTML
tests. `npm run check` also runs ESLint and strict TypeScript checking.

## Manual browser matrix

Before publishing visual or movement changes, inspect:

1. phone widths from 320–390 CSS pixels;
2. tablet portrait and landscape;
3. desktop at 1024 and 1440 CSS pixels or wider;
4. forest, sea, and sunrise in light and dark;
5. default glass, more-opaque surfaces, and low-vision mode;
6. system and application reduced motion;
7. front and profile movement views;
8. standing, seated, balance-sensitive, limited-range, and one-arm modes;
9. every support with compatible movements;
10. every hairstyle, covering, garment, and accessory combination;
11. keyboard-only navigation, modal focus return, lesson controls, chess, and
    deletion;
12. current Safari, Chromium, and Firefox engines.
13. the complete Care path at normal, reduced, and still presentation;
14. Care at 200% and 400% zoom, forced colors, touch, keyboard, screen reader,
    switch, and voice control;
15. WebGL context loss/restore, route exit during approach/contact, rapid
    restart, and repeated mount/unmount.

Visual review must confirm:

- pupils and all facial lines remain dark in dark themes;
- elbows, knees, hands, feet, facing, and weight transfer remain trackable;
- walking faces the direction of travel;
- floor and seated movements use the correct body relationship;
- clothing and accessories remain attached and layer correctly;
- natural-fiber texture remains visible without excessive blur;
- one full-size trainer owns the active demonstration;
- a named movement’s text, pose, and animation agree.

## Graphics review status

Passing automated tests does not establish movement or illustration accuracy.
The graphics remain in progress and require systematic visual review plus
qualified review of named movement instruction before production claims.

Passing the footwear suite proves only deterministic reference semantics and
source contracts. It does not prove the rendered BRDF, reflection confidence,
authored geometry, physical polish outcome, contact kinematics, device support,
accessibility pairing, performance, or production compliance.

## Documentation audit

Before publication:

- verify every document from `docs/index.md`;
- compare privacy claims with `app/domain/persistence.ts`;
- compare movement claims with the catalog and compatibility logic;
- scan source and generated output for prohibited metadata or vocabulary;
- confirm the repository contains source and documentation, not dependency or
  build-cache directories.
