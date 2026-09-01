# Accessibility

Evenward targets WCAG 2.2 AA behavior where applicable. Accessibility is part
of the product model, not a later presentation layer.

## Input and structure

- Navigation, headings, sections, lists, buttons, disclosures, status regions,
  and dialogs use native semantics.
- A skip link moves to the main region.
- Every required control is keyboard-operable.
- Modal dialogs manage focus, support Escape, and return focus to their opener.
- Lesson groups begin closed; one selected lesson controls the full-size
  trainer.
- Status changes are announced through a restrained live region rather than
  continuous animation narration.
- Body-region reactions are optional personality details. Keyboard focus is
  visible around the trainer without exposing a selected anatomical region.

## Movement access

Users choose a movement setup and available support; Evenward does not infer
capability.

The compatibility layer considers:

- standing, seated, balance-sensitive, limited-range, and one-arm modes;
- chair, wheelchair, cane, walker, wall, or rail support;
- the starting position and weight-transfer demands of the movement;
- whether selected clothing permits the intended range and geometry.

The Learn catalog remains broad, while each selected setup presents only a
compatible form. When a support makes a form workable, instructions and trainer
geometry incorporate it. Clothing weight changes visible secondary motion but
does not substitute cultural assumptions for movement rules.

Every lesson includes a starting position and ordered text directions so the
animation is not the sole instruction channel.

## Visual presentation

- Jost is used throughout.
- Focus uses a visible semantic ring in every theme.
- Controls meet a minimum 44 CSS-pixel target.
- Layouts reflow across phone, tablet, and desktop widths.
- Selection, progress, and status do not rely on color alone.
- More-opaque surfaces replace translucency.
- Low-vision mode strengthens boundaries, surface opacity, and base text size.
- Trainer pupils, sclera, glasses, and mouth retain the same palette between
  light and dark variants.

## Motion

- Demonstrations repeat until advanced or stopped.
- Pause and Resume remain available.
- Slower playback changes timing without changing the sequence.
- System and application reduced-motion settings stop atmosphere, film weave,
  idle loops, and continuous interpolation.
- Reduced-motion lessons use user-controlled representative poses from the
  selected movement’s actual phase data.
- Page visibility pauses animation and countdowns.

## Patterns privacy hardening

The Patterns page has no text input, keyboard logger, global application
keypress listener, or stored observation field. This does not prevent
keyboard navigation: native controls remain reachable and operable through the
browser’s standard focus and activation behavior.

## Footwear care

- Compatibility, preparation, contact, wait, completion, pause, cancel, and
  recovery use native controls and literal text.
- The canvas is presentation-only and hidden from assistive technology. One
  immutable semantic care snapshot supplies stage, shoe, region, tool, contact,
  modeled value, motion mode, availability, next actions, and recovery in the
  DOM. Renderer capability and renderer-failure acknowledgement are separate
  from that revision; full multi-consumer parity remains blocked.
- Selected targets and motion modes use text, shape, borders, and
  `aria-pressed`; they do not depend on gloss or color.
- Normal, Reduced, and Still share the same semantic event sequence. System or
  application reduced motion releases active contact before changing the
  presented mode.
- Care progress requires explicit semantic contact actions. Rubbing, dragging,
  hovering, timing an animation, or matching the demonstrated cadence is never
  an input requirement.
- Polite announcements occur only after explicit semantic transitions;
  contact-loss and transition rejection use assertive alerts.
- The stable primary action remains focusable when gated with `aria-disabled`,
  and restart does not key-remount the Care component. These are reference
  mechanisms, not executed focus or assistive-technology evidence.

## Verification limits

Automated tests cover semantics, native keyboard-compatible control markup, disclosure
state, modal structure, reduced-motion behavior, movement adaptation, and
Patterns input boundaries.

The footwear UI checks are server-rendered structure checks, not browser input,
focus, timing, live-region, WebGL, or assistive-technology interaction evidence.

Manual review is still required for:

- screen-reader and browser pairings;
- switch and voice-control hardware;
- contrast at zoom and text-spacing overrides;
- every clothing, hair, support, body-shape, view, and movement combination;
- movement accuracy and clarity.
- the complete Care path with screen readers, voice control, switch hardware,
  200%/400% zoom, text spacing, forced colors, touch, and context loss;
- physical equality between the described and rendered care contact.
