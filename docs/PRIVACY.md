# Privacy

Privacy is an architectural constraint in Evenward. The application has no
account, application database, advertising code, behavioral analytics,
tracking pixels, telemetry, health inference, or remote application logging.

## Saved data

| Data | Location | Retention | User control |
| --- | --- | --- | --- |
| Theme, light/dark variant, atmosphere | Browser storage | Until reset or browser clearing | Appearance reset or delete-all |
| Trainer appearance and access setup | Browser storage | Until reset or browser clearing | Trainer reset or delete-all |
| Chess position, board theme, completed count | Browser storage | Until cleared or browser clearing | Chess clear or delete-all |
| Active practice and lesson | Memory only | Reload or exit | Exit or reload |
| Optional visit reflection | Memory only | Reload or immediate clear | Clear or reload |
| Temporary room figures | Memory only | Regeneration, exit, or reload | Regenerate, exit, or reload |
| Trainer interactions | Not retained | Immediate response only | No stored record |
| Browser hour | Memory only | Periodically re-read | Not stored |

The current storage keys are:

- `evenward-preferences-v1`
- `evenward-chess-v1`

Legacy `cadence-*` keys are removed during migration.

## Not collected

Evenward does not retain:

- selected regulation direction;
- practice or lesson history;
- duration, dwell time, interruptions, or completion;
- reflections after reload;
- inferred mood, health, identity, or diagnosis;
- trainer interactions;
- keyboard input;
- temporary figure identities.

The Patterns page explains this boundary and provides deletion controls. It
does not ask the user to record a pattern.

## User control

Users can:

- reset appearance without clearing chess;
- clear chess without changing appearance;
- delete every saved Evenward value from Patterns;
- clear site storage through browser controls;
- continue for the current visit when storage is unavailable.

Storage failure never triggers a network fallback.

## Network boundary

The application source makes no client-side network request. Fonts and other
assets ship with the static build. The hosting provider necessarily receives
ordinary requests required to deliver files and may keep infrastructure logs
under its own policy; Evenward does not receive or combine those logs.

## Practice boundary

Evenward is an educational, self-directed practice environment. It does not
claim medical or psychological authority, diagnose, assess safety, provide
treatment, select a correct state, or promise a result. A user chooses whether
to explore an upregulating, downregulating, focusing, movement, or observation
direction and may pause, change course, or leave at any time.
