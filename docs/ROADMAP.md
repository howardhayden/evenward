# Roadmap

## Current priority: visual and movement integrity

The project’s largest gap is graphics quality and movement accuracy.

Before describing the trainer as production-ready:

- review every named movement against its starting position and written steps;
- redraw unclear front, profile, seated, and floor relationships;
- verify hand, foot, gaze, mouth, joint, and weight direction;
- test every compatible support and clothing combination;
- improve natural-fiber texture without restoring excessive blur;
- refine material-specific clothing lag and secondary motion;
- obtain qualified review of simplified movement instruction.

## Accessibility and interaction

- complete keyboard and screen-reader testing across major browser engines;
- test zoom, text spacing, switch control, and voice control;
- audit every disclosure and modal focus path;
- review reduced-motion poses for equivalent instruction;
- validate access filtering against all movement and support combinations.

## Privacy and resilience

- keep the storage inventory synchronized with source;
- add a visible storage version when the schema changes;
- retain one-action deletion and failure-without-network-fallback behavior;
- add a release audit for client requests and prohibited metadata;
- document hosting-provider boundaries without adding behavioral tracking.

## Product validation

- conduct small moderated tests of directional language;
- assess whether upregulating and downregulating choices are understandable
  without sounding prescriptive;
- test whether users can distinguish Practice, Patterns, and Learn;
- test whether chess reads as bounded attention rather than a clinical claim;
- gather voluntary feedback on trust, privacy, and trainer usefulness.

## Distribution

- publish source and documentation on GitHub;
- publish `/docs` through GitHub Pages;
- connect `docs.evenward.rest`;
- keep the application at `evenward.rest` on Neocities;
- document releases and static-build checks.

## Release gates

### Prototype

- functional architecture;
- privacy boundary and deletion;
- keyboard-operable core paths;
- broad movement catalog;
- explicit graphics-in-progress notice.

### Public beta

- movement-by-movement visual audit;
- assistive-technology matrix;
- major-browser visual review;
- qualified movement-content review;
- documented known issues.

### Production-ready

- no unresolved high-severity movement mismatch;
- complete support/clothing/view compatibility review;
- stable privacy inventory and release audit;
- documented usability findings;
- graphics no longer described as in progress.
