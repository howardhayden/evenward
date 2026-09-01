# Author Integration and Standalone Repository Decision

Decision ID: `EVD-AUTHOR-SCS-2026-09-01`

Date: 2026-09-01

Authority: direct author instruction in the active implementation review

## Decision

The author authorizes all of the following source-governance operations:

1. commit and push the completed leather-footwear and polish implementation;
2. merge its reviewed source branch into Evenward's main branch;
3. create a separate public GitHub repository named `ShoeCareStudio`;
4. publish the applicable source, documentation, tests, and preserved evidence in that repository;
5. set an accurate GitHub description and relevant repository topics; and
6. commit, push, and merge the standalone repository's reviewed source to its main branch.

The standalone artifact is an extraction, not a renamed copy of all Evenward.
Its package name is `shoe-care-studio` and its display name is
`ShoeCareStudio`. It includes the care Studio and renderer; the care state,
store, and material domains; focused footwear tests; the additive register and
evidence set; and the complete applicable noncommercial license suite. It does
not include Evenward's trainer/avatar, chess, regulation-practice catalog, or
Evenward deployment configuration and domains. A minimal standalone shell,
styles, and build configuration may be retained where the extracted care
surface requires them.

The standalone repository must remain source-available for noncommercial use.
Its original software must use the PolyForm Noncommercial License 1.0.0, and
its public license surface must not contain a conflicting grant of commercial
use. Separable original documentation may remain under CC BY-NC-SA 4.0. This
decision does not alter third-party terms.

## Exact precedence

This decision supersedes only earlier statements that made the reviewed source
ineligible for merge to main or ineligible for a public standalone repository:

- `EVW-FP-AUTH-006`: the phrase "cannot unlock main" no longer bars the
  author-approved source merge; its zero-production-compliance rule remains;
- `EVW-FP-RT-028`: "merge/release eligibility" is separated. A green build
  still cannot create release eligibility, but the author's explicit decision
  can authorize source integration;
- care addendum 1.1, section 8: "no merge ... credit" remains historical, but
  no longer bars the operations enumerated above; its no-release and
  no-production-credit boundaries remain; and
- the footwear work-packet README's statement that checks are not permission
  to merge remains true: the permission now comes from this author decision,
  not from the checks.

No prior candidate, red-team report, register, or summary is rewritten. The
precedence change is represented only by the additive v1.3 decision and delta.

## Boundaries not changed

This decision does not:

- admit a candidate addendum into the canonical production specification;
- mark any requirement Verified;
- reduce or waive an inherited blocker;
- set `productionUnlocked` to true;
- represent a production release, deployment, safety certification, optical or
  physical validation, accessibility conformance, or independent review;
- authorize commercial use under the public license; or
- permit public metadata to describe the reference as production-ready or
  compliant.

The standalone repository uses this exact description:

> A local-first, accessibility-oriented pre-production leather shoe-care reference with fail-closed care semantics and a procedural Three.js renderer.

Its exact topics are `leather-care`, `shoe-care`, `threejs`, `webgl`, `nextjs`,
`react`, `typescript`, `accessibility`, `local-first`, `privacy`,
`source-available`, and `noncommercial`. It has no GitHub homepage until an
actual standalone deployment exists. The README must identify the work as a
pre-production reference and state the noncommercial license boundary.

## Required operational evidence

The integration record must capture the source and standalone repository commit
identities, target branches, push results, merge results, public repository URL,
visibility, default branch, license identity, description, and topics. Those
facts prove only the requested source-governance operations. They do not supply
any missing production acceptance evidence.
