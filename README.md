# Evenward

Evenward is a mobile-first, self-directed regulation studio built around
movement, attention, pattern recognition, systems literacy, and play.

Its organizing loop is:

1. Notice the present state without assigning a diagnosis.
2. Choose a direction: downregulating, upregulating, gathering attention,
   moving through tension, or simply observing.
3. Complete a small practice.
4. Observe what changed without treating the result as a score.

Evenward is an educational practice environment. It does not claim medical or
psychological authority, assess a condition, choose a correct state, provide
treatment, or promise an outcome.

## Project status

Evenward is a functional prototype with an in-progress illustration and
movement system.

The information architecture, privacy boundary, persistence model, accessible
controls, theme system, chess state, and movement catalog are implemented.
The trainer graphics are not production-finished. Joint articulation,
movement-specific poses, seated and profile geometry, clothing occlusion,
secondary motion, and cross-browser rendering still require systematic visual
review and subject-matter review. The trainer must not be treated as an
authoritative form reference in its current state.

## Experience

- **Today** begins with a user-selected direction rather than an inferred state.
- **Practice** offers movement, breathing, sensory, focus, and pattern
  activities directly.
- **Chess** provides a bounded-attention game with browser-saved progress.
- **Patterns** explains storage and offers deletion controls without collecting
  observations or keyboard input.
- **Learn** presents concise movement instructions and one repeating,
  full-size trainer demonstration.

The interface uses Jost throughout, translucent glass surfaces with restrained
skeuomorphic depth, forest/sea/sunrise themes, light and dark variants, and
progressive disclosure.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. The project folder can be opened
directly in VSCodium.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Export the complete static site to `out/` |
| `npm run preview` | Preview the static export |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript checking |
| `npm run test:unit` | Run behavior, privacy, persistence, accessibility, and visual-contract tests |
| `npm test` | Build and run all automated tests |
| `npm run check` | Run lint, type checking, build, and tests |

## Structure

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Application orchestration and visit-only state |
| `app/components/studio` | Screens, pathways, panels, and session UI |
| `app/components/avatar` | Articulated SVG trainer and attachment layers |
| `app/components/ambient` | Decorative atmosphere and surface texture |
| `app/components/chess` | Chess interaction, board themes, and pieces |
| `app/domain` | Typed content, movement rules, state, and persistence |
| `app/hooks` | Trainer lifecycle and transition control |
| `tests` | Behavior, semantic, privacy, and production-output checks |
| `docs` | Product and engineering documentation |

## Distribution

`npm run build` creates a host-neutral static site in `out/`. Upload the
contents of `out/`, rather than the directory itself, to the application host.
Source, documentation, tests, and version history belong in this repository.

## Documentation

- [Documentation index](docs/index.md)
- [Product](docs/PRODUCT.md)
- [UX and UI](docs/UX-UI.md)
- [Graphics status](docs/GRAPHICS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Privacy](docs/PRIVACY.md)
- [Distribution](docs/DISTRIBUTION.md)
- [Testing](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)

## Licensing

Evenward is **source-available for noncommercial use** under
**PolyForm-Noncommercial-1.0.0**; commercial use requires a separate written license. Separable original documentation and media use **CC-BY-NC-SA-4.0**.
No current source file or function has a permissive commercial-use exception.
See [`LICENSING.md`](LICENSING.md),
[`WORKFLOW-BOUNDARIES.md`](WORKFLOW-BOUNDARIES.md), and
[`LICENSE-MAP.json`](LICENSE-MAP.json) for scope and historical limits.
