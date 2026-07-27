# Architecture

## System shape

Evenward is a React and Next.js application exported as static files. There is
no application server, account system, database, or client-side data service.

The architecture separates four concerns:

1. durable browser preferences;
2. visit-only interaction state;
3. declarative practice and movement content;
4. visual execution by the trainer and interface.

This keeps the application portable across static hosts and makes its privacy
boundary inspectable in source.

## Application boundaries

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Navigation, active practice, current lesson, daypart, and visit-only state |
| `app/domain/content.ts` | Directional pathways, themes, literacy notes, and defaults |
| `app/domain/movement-catalog.ts` | Named movement instructions, poses, phases, access rules, and cautions |
| `app/domain/movement-animation.ts` | Access adaptation and articulated animation tracks |
| `app/domain/movement-logic.ts` | Compatibility and support selection |
| `app/domain/persistence.ts` | The complete browser-storage boundary |
| `app/domain/avatar-machine.ts` | Pure trainer behavior transitions |
| `app/hooks/use-avatar-controller.ts` | Timers, cancellation, and lifecycle-safe commands |
| `app/components/avatar/Trainer.tsx` | SVG rig, clothing, coverings, supports, and interaction regions |
| `app/components/studio/StudioUI.tsx` | Screens and user commands |

## State model

Only appearance/access preferences and chess progress persist. Active
practices, selected directions, lesson state, reflections, reactions, and
temporary room figures remain in memory and disappear on reload.

The trainer state machine distinguishes entering, directional walking, idle,
transitioning, demonstrating, paused, reduced-motion, reacting, returning,
leaving, and hidden states. A demonstration owns the trainer until it is
paused, replaced, advanced, or stopped. New commands cancel incompatible
timers before transition.

Walking uses a profile silhouette whose facing matches travel. Movement
demonstrations use the named movement’s preferred front or profile view.

## Movement model

Each movement definition supplies:

- a stable identifier, discipline, title, and preferred view;
- a literal starting position and concise ordered directions;
- availability rules for movement setup, supports, and clothing;
- three or more timed phases;
- body translation, rotation, scale, and weight side;
- explicit shoulder, elbow, hip, knee, foot, hand, and head values;
- reduced-motion poses drawn from the same phase sequence;
- cautions and access-specific wording.

The animation layer produces separate tracks for the body, head, upper arms,
forearms, upper legs, shins, and feet. Front and profile views use distinct
transform origins. Floor-based movement uses dedicated grounded geometry rather
than rotating a standing figure.

The catalog is broad, but visual correctness remains under review. A named
movement is not considered complete merely because it has data and animation;
its instructions, body position, joint path, facing, support use, clothing
behavior, and return pose must agree.

## Trainer layering

The SVG uses named layers:

1. headwear back;
2. hair back;
3. rear limbs;
4. clothing;
5. skin and head;
6. hair front;
7. headwear front;
8. facial features;
9. front accessories;
10. front supports.

Hair covered by a selected garment is omitted at render time. Front and profile
coverings are separately drawn. Clothing weight changes the lag and amplitude
of secondary motion. Movement availability is determined from the combination
of selected movement setup, support accessory, clothing, and the movement’s
requirements; the application does not infer a person’s capability.

## Presentation system

Forest, sea, and sunrise themes expose semantic tokens for background,
foreground, surfaces, accents, borders, focus, and atmosphere. Light and dark
variants share a stable trainer-face palette. Glass surfaces are translucent by
default; the more-opaque preference and browser fallback replace them with
solid semantic surfaces.

All fonts and application assets are included locally. Ambient scenes are
decorative and generated in memory. Reduced-motion settings stop decorative
loops and replace continuous instruction with user-advanced poses.

## Build and deployment

`npm run build` produces a complete static export in `out/`. The same source is
used for development and export; there is no separate application codebase for
the static host.

Deployment boundaries:

- application: static files at `evenward.rest`;
- documentation: repository `/docs`;
- development and review: source, tests, issues, and version history.

## Known limits

- The trainer is a stylized two-dimensional rig, not a biomechanical model.
- Profile and front views are authored separately rather than produced from a
  three-dimensional body.
- Movement, clothing, support, and body-shape combinations have not completed
  exhaustive visual review.
- Automated screenshot comparison is not yet implemented.
- Browser storage can be unavailable in hardened contexts; the current visit
  still works, but selected preferences cannot persist.
