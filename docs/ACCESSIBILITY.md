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

## Verification limits

Automated tests cover semantics, keyboard-compatible controls, disclosure
state, modal structure, reduced-motion behavior, movement adaptation, and
Patterns input boundaries.

Manual review is still required for:

- screen-reader and browser pairings;
- switch and voice-control hardware;
- contrast at zoom and text-spacing overrides;
- every clothing, hair, support, body-shape, view, and movement combination;
- movement accuracy and clarity.
