"use client";

import { useState } from "react";
import { Chess, type Square } from "chess.js";
import type { AvatarBehaviorState } from "../../domain/avatar-machine";
import type {
  AvatarConfig,
  BoardTheme,
  ChoiceId,
  Daypart,
  FaithAccessory,
  Flow,
  FlowStep,
  GarmentStyle,
  GuidePart,
  GuideReaction,
  HairStyle,
  Headwear,
  MobilityMode,
  MovementDiscipline,
  MovementPractice,
  MovementView,
  OutcomeId,
  PeerConfig,
  SavedChess,
  SceneName,
  SkinTone,
  SupportAccessory,
  ThemeMode,
  ThemeName,
  ViewId,
  VisitNote,
} from "../../domain/types";
import {
  defaultAvatar,
  flows,
  literacyNotes,
  navItems,
  sceneLabels,
  scenesByTheme,
} from "../../domain/content";
import {
  adaptFlow,
  availableMovementPractices,
  effectiveSupport,
  formatTime,
  movementDefinitionFor,
  movementDemoFor,
  movementDescription,
  movementFlow,
  movementHowTo,
  movementStartingPose,
  secondsFor,
} from "../../domain/movement-logic";
import { DATA_INVENTORY } from "../../domain/persistence";
import { Trainer } from "../avatar/Trainer";
import { ChessStudio } from "../chess/ChessStudio";
import { ModalSheet } from "../ui/ModalSheet";

export function Mark() {
  return <span aria-hidden="true">E</span>;
}

export function browserDaypart(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function daypartGreeting(daypart: Daypart | null) {
  if (!daypart) return "";
  if (daypart === "night") return "A quiet night.";
  return `Good ${daypart}.`;
}

function PeerFigure({ peer }: { peer: PeerConfig }) {
  return (
    <div className="peer-figure">
      <Trainer
        compact
        label="Ephemeral abstract practice participant"
        avatar={{
          ...defaultAvatar,
          hair: peer.hair,
          garment: peer.garment,
          skin: peer.skin,
          headwear: peer.headwear,
          faithAccessory: peer.faithAccessory,
          glasses: peer.glasses,
          height: peer.height,
          weight: peer.weight,
        }}
      />
    </div>
  );
}

export function AppNavigation({
  view,
  onChange,
}: {
  view: ViewId;
  onChange: (view: ViewId) => void;
}) {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <div className="app-nav__brand">
        <span className="brand__mark"><Mark /></span>
        <span>Evenward</span>
      </div>
      <div className="app-nav__items">
        {navItems.map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <span aria-hidden="true">{item.mark}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <p>Practice without performance.</p>
    </nav>
  );
}

function FlowSteps({ flow }: { flow: Flow }) {
  return (
    <ol className="thread-steps">
      {flow.steps.map((step, index) => (
        <li key={`${step.label}-${index}`}>
          <span className="step-number">{index + 1}</span>
          <span className="step-copy">
            <strong>{step.label}</strong>
            <small>{step.kind}</small>
          </span>
          <span>{step.duration}</span>
        </li>
      ))}
    </ol>
  );
}

export function TodayView({
  selectedChoice,
  avatar,
  daypart,
  onSelectChoice,
  onStart,
}: {
  selectedChoice: ChoiceId;
  avatar: AvatarConfig;
  daypart: Daypart | null;
  onSelectChoice: (choice: ChoiceId) => void;
  onStart: (flow: Flow) => void;
}) {
  const baseFlow = flows.find((flow) => flow.id === selectedChoice) ?? flows[0];
  const selectedFlow = adaptFlow(baseFlow, avatar);

  return (
    <>
      <section className="arrival">
        <p className="eyebrow">Notice → choose → practice → observe</p>
        <h1>{`${daypartGreeting(daypart) ? `${daypartGreeting(daypart)} ` : ""}What direction feels closest right now?`}</h1>
        <p className="lede">
          Choose the closest direction, or begin with simple observation.
        </p>
        <div className="choice-grid" aria-label="Regulation direction">
          {flows.map((flow) => (
            <button
              key={flow.id}
              className="choice-button"
              aria-pressed={selectedChoice === flow.id}
              onClick={() => onSelectChoice(flow.id)}
            >
              <span className="choice-button__icon" aria-hidden="true">{flow.icon}</span>
              <span>{flow.prompt}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="recommendation" aria-labelledby="recommendation-title">
        <div className="recommendation__heading">
          <div>
            <p className="eyebrow">{selectedFlow.mode} · suggested thread</p>
            <h2 id="recommendation-title">{selectedFlow.title}</h2>
            <p>{selectedFlow.description}</p>
          </div>
          <span className="duration">{selectedFlow.duration}</span>
        </div>
        <FlowSteps flow={selectedFlow} />
        <button
          className="primary-button"
          onClick={() => onStart(selectedFlow)}
        >
          Begin this thread <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="reflection-card">
        <div className="reflection-card__mark" aria-hidden="true">⌁</div>
        <div>
          <p className="eyebrow">A prompt, not a score</p>
          <h2>Try the smallest form that still feels deliberate.</h2>
          <p>Range and pace can change. The structure of attention remains.</p>
        </div>
      </section>
    </>
  );
}

export function PracticeView({
  avatar,
  onStart,
  onOpenAccess,
}: {
  avatar: AvatarConfig;
  onStart: (flow: Flow) => void;
  onOpenAccess: () => void;
}) {
  const movementOptions = availableMovementPractices(avatar);
  return (
    <section className="view-section">
      <p className="eyebrow">Practice library</p>
      <h1>Four modes, one shared structure.</h1>
      <p className="lede">
        Choose by what might help. Movement cards follow the access setup attached to
        your guide.
      </p>
      <div className="practice-list">
        {flows.map((baseFlow) => {
          const flow = adaptFlow(baseFlow, avatar);
          return (
            <article className="practice-card" key={flow.id}>
              <div className="practice-card__mark" aria-hidden="true">{flow.icon}</div>
              <div>
                <p className="eyebrow">{flow.mode}</p>
                <h2>{flow.title}</h2>
                <p>{flow.description}</p>
                <div className="practice-card__meta">
                  <span>{flow.duration}</span>
                  <span>{flow.steps.length} steps</span>
                </div>
              </div>
              <button
                onClick={() => onStart(flow)}
                aria-label={`Begin ${flow.title}`}
              >
                Begin <span aria-hidden="true">→</span>
              </button>
            </article>
          );
        })}
      </div>
      <details className="movement-disclosure">
        <summary>
          <span>
            <small>Movement library</small>
            <strong>Explore {movementOptions.length} adapted forms</strong>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="movement-library__heading">
          <div>
            <h2>Forms matched to this guide.</h2>
            <p>
              Movement mode, range, and selected support shape the version shown.
              Front and side demonstrations remain available during practice.
            </p>
          </div>
          <button className="quiet-button" onClick={onOpenAccess}>Adjust movement setup</button>
        </div>
        <div className="movement-library">
          {movementOptions.map((move) => {
            const flow = movementFlow(move, avatar);
            return (
              <article className="movement-card" key={move.id}>
                <span className="movement-card__view">
                  {move.discipline} · 5 min · gentle · one body-length · {move.preferredView} view
                </span>
                <h3>{flow.title}</h3>
                <p>{flow.description}</p>
                <button onClick={() => onStart(flow)} aria-label={`Begin ${flow.title}`}>
                  Practice <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}

export function PatternsView({
  notes,
  onClear,
  onResetAll,
}: {
  notes: VisitNote[];
  onClear: () => void;
  onResetAll: () => void;
}) {
  return (
    <section className="view-section">
      <p className="eyebrow">This visit only</p>
      <h1>Patterns without a record.</h1>
      <p className="lede">
        Practice reflections can remain visible while this page is open. They are
        never written to browser storage and disappear on reload.
      </p>
      {notes.length ? (
        <div className="visit-notes">
          {notes.map((note, index) => (
            <article key={`${note.flowTitle}-${index}`}>
              <span aria-hidden="true">◌</span>
              <div>
                <strong>{note.flowTitle}</strong>
                <p>
                  {note.outcome === "neutral"
                    ? "No clear change"
                    : `More ${note.outcome}`}
                </p>
              </div>
            </article>
          ))}
          <button onClick={onClear}>Clear this visit now</button>
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">⌘</span>
          <h2>No visit-only observations yet.</h2>
          <p>A reflection can appear here after a practice, without being saved.</p>
        </div>
      )}
      <div className="privacy-ledger">
        <p className="eyebrow">Storage boundary</p>
        <h2>Local settings, in plain view.</h2>
        <ul>
          {DATA_INVENTORY.map((entry) => (
            <li key={entry.item}>
              <span>{entry.item}</span>
              <strong>{entry.location}</strong>
            </li>
          ))}
          <li><span>Keyboard input</span><strong>Not captured</strong></li>
        </ul>
        <p>
          Evenward makes no analytics or advertising requests. It does not retain
          practice choices, reflections, dwell time, or guide interactions.
        </p>
        <button className="quiet-button" onClick={onResetAll}>
          Delete all saved Evenward data
        </button>
      </div>
    </section>
  );
}

function MovementLesson({
  move,
  avatar,
  open,
  active,
  view,
  onToggle,
  onView,
}: {
  move: MovementPractice;
  avatar: AvatarConfig;
  open: boolean;
  active: boolean;
  view: MovementView;
  onToggle: () => void;
  onView: (view: MovementView) => void;
}) {
  const flow = movementFlow(move, avatar);

  return (
    <details className="movement-lesson" open={open} data-active={active}>
      <summary
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        <span>
          <small>{move.discipline} · 5 min · gentle · {view} demonstration · adapted</small>
          <strong>{flow.title}</strong>
        </span>
        <span aria-hidden="true">+</span>
      </summary>
      <div className="movement-lesson__body">
        <div className="movement-lesson__copy">
          <p>{movementDescription(flow.title, avatar)}</p>
          <MovementDirections move={move} avatar={avatar} />
          <p className="movement-lesson__status" aria-live="polite">
            {active ? "The large guide is repeating this movement." : "Open to demonstrate on the large guide."}
          </p>
          <div className="movement-view-toggle" aria-label={`${flow.title} demonstration view`}>
            <button aria-pressed={view === "front"} onClick={() => onView("front")}>
              Front
            </button>
            <button aria-pressed={view === "side"} onClick={() => onView("side")}>
              Side
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

function MovementDirections({
  move,
  avatar,
  compact = false,
}: {
  move: MovementPractice;
  avatar: AvatarConfig;
  compact?: boolean;
}) {
  const directions = movementHowTo(move, avatar);
  return (
    <section
      className={`movement-directions ${compact ? "movement-directions--compact" : ""}`}
      aria-label={`How to perform ${move.title}`}
    >
      <p>
        <strong>Start:</strong> {movementStartingPose(move, avatar)}
      </p>
      <ol>
        {directions.map((direction, index) => (
          <li key={`${move.id}-direction-${index}`}>{direction}</li>
        ))}
      </ol>
    </section>
  );
}

export function UnderstandView({
  avatar,
  activeMove,
  activeView,
  onSelectMove,
  onView,
  onStop,
  onOpenAccess,
}: {
  avatar: AvatarConfig;
  activeMove: MovementPractice | null;
  activeView: MovementView;
  onSelectMove: (move: MovementPractice, view: MovementView) => void;
  onView: (view: MovementView) => void;
  onStop: () => void;
  onOpenAccess: () => void;
}) {
  const movementOptions = availableMovementPractices(avatar);
  const disciplines: MovementDiscipline[] = ["Tai chi", "Yoga", "Tap", "Jazz", "Swing"];
  const [openDisciplines, setOpenDisciplines] = useState<MovementDiscipline[]>([]);

  return (
    <section className="view-section">
      <p className="eyebrow">Systems literacy</p>
      <h1>Learn by seeing, then understanding.</h1>
      <p className="lede">
        Open one lesson at a time. Your guide repeats every compatible tai chi,
        yoga, tap, jazz, and swing movement in the form selected by your access setup.
      </p>
      <div className="learn-intro">
        <p>
          Showing {avatar.mobility === "standing" ? "standing" : avatar.mobility}
          {effectiveSupport(avatar) === "none" ? "" : ` with ${effectiveSupport(avatar)}`}.
          Movement lessons follow this setup.
        </p>
        <button className="quiet-button" onClick={onOpenAccess}>
          Adjust movement setup
        </button>
      </div>
      <div className="movement-disciplines" aria-label="Movement lessons">
        {disciplines.map((discipline) => {
          const moves = movementOptions.filter((move) => move.discipline === discipline);
          if (!moves.length) return null;
          const disciplineOpen = activeMove
            ? activeMove.discipline === discipline
            : openDisciplines.includes(discipline);
          return (
            <details className="movement-discipline" key={discipline} open={disciplineOpen}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setOpenDisciplines((current) =>
                    current.includes(discipline) ? [] : [discipline],
                  );
                  if (activeMove) onStop();
                }}
              >
                <span>
                  <small>Repeating demonstrations</small>
                  <strong>{discipline} · {moves.length} movements</strong>
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="movement-lessons">
                {moves.map((move) => (
                  <MovementLesson
                    key={move.id}
                    move={move}
                    avatar={avatar}
                    open={activeMove?.id === move.id}
                    active={activeMove?.id === move.id}
                    view={activeMove?.id === move.id ? activeView : move.preferredView}
                    onToggle={() => {
                      if (activeMove?.id === move.id) {
                        onStop();
                      } else {
                        onSelectMove(move, move.preferredView);
                      }
                    }}
                    onView={(view) => {
                      if (activeMove?.id !== move.id) onSelectMove(move, view);
                      else onView(view);
                    }}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <details className="literacy-disclosure">
        <summary>
          <span>
            <small>Systems literacy</small>
            <strong>Short explanations and evidence boundaries</strong>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
      <div className="literacy-list">
        {literacyNotes.map((note) => (
          <details key={note.title}>
            <summary>
              <span><small>{note.category}</small><strong>{note.title}</strong></span>
              <span aria-hidden="true">+</span>
            </summary>
            <p>{note.body}</p>
          </details>
        ))}
      </div>
      <div className="evidence-card">
        <p className="eyebrow">Language standard</p>
        <h2>Direction, not prescription.</h2>
        <p>
          Evenward offers user-chosen downregulating, upregulating, attention,
          movement, and observation practices. It does not assess a person,
          select a correct state, provide medical or mental-health care,
          diagnose, or promise an outcome.
        </p>
      </div>
      </details>
    </section>
  );
}

export function GuidePresence({
  avatar,
  guideState,
  daypart,
  activeMove,
  onMovementView,
  onPause,
  onResume,
  onPreviousPose,
  onNextPose,
  onNextMovement,
  onStopMovement,
  onCustomize,
  onAvatarInteract,
}: {
  avatar: AvatarConfig;
  guideState: AvatarBehaviorState;
  daypart: Daypart | null;
  activeMove: MovementPractice | null;
  onMovementView: (view: MovementView) => void;
  onPause: () => void;
  onResume: () => void;
  onPreviousPose: () => void;
  onNextPose: () => void;
  onNextMovement: () => void;
  onStopMovement: () => void;
  onCustomize: () => void;
  onAvatarInteract: (part: GuidePart) => void;
}) {
  const activeFlow = activeMove ? movementFlow(activeMove, avatar) : null;
  const definition = movementDefinitionFor(
    guideState.movement === "singleCloud" ? "cloudHands" : guideState.movement,
  );
  const isPaused = guideState.mode === "paused";
  const isReduced = guideState.mode === "reduced-motion";

  return (
    <aside
      className="guide-presence"
      aria-labelledby="guide-presence-title"
      data-demonstrating={Boolean(activeMove)}
    >
      <div className="guide-presence__figure">
        <Trainer
          avatar={avatar}
          primary
          mood={guideState.mood}
          reaction={guideState.reaction}
          movement={guideState.movement}
          view={guideState.view}
          facing={guideState.facing}
          behavior={guideState.mode}
          poseIndex={guideState.poseIndex}
          reducedPresentation={guideState.reducedMotion}
          paused={isPaused}
          onInteract={onAvatarInteract}
          label={
            activeFlow
              ? `${activeFlow.title}, repeating ${guideState.view} movement demonstration`
              : `Your Evenward guide, ${
                  guideState.mood === "calm" ? "calm and attentive" : "responding happily"
                }`
          }
        />
      </div>
      <div className="guide-presence__copy">
        <p className="eyebrow">
          {activeMove ? `${activeMove.discipline} · repeating` : daypartGreeting(daypart) || "Here with you"}
        </p>
        <h2 id="guide-presence-title">
          {activeFlow
            ? activeFlow.title
            : guideState.mood === "calm"
              ? "A steady companion."
              : "A small, happy response."}
        </h2>
        {activeFlow ? (
          <>
            <p className="guide-presence__cue">{movementDescription(activeFlow.title, avatar)}</p>
            {activeMove && (
              <MovementDirections move={activeMove} avatar={avatar} compact />
            )}
            <div className="movement-view-toggle" aria-label={`${activeFlow.title} guide view`}>
              <button aria-pressed={guideState.view === "front"} onClick={() => onMovementView("front")}>Front</button>
              <button aria-pressed={guideState.view === "side"} onClick={() => onMovementView("side")}>Side</button>
            </div>
            {isReduced && definition && (
              <div className="reduced-pose" role="status">
                <strong>Pose {guideState.poseIndex + 1} of 3</strong>
                <span>{definition.reducedMotionSteps[guideState.poseIndex]}</span>
                <div>
                  <button className="quiet-button" onClick={onPreviousPose}>Previous pose</button>
                  <button className="quiet-button" onClick={onNextPose}>Next pose</button>
                </div>
              </div>
            )}
            <div className="guide-presence__lesson-controls">
              <button className="quiet-button" onClick={onStopMovement}>Stop</button>
              <button
                className="quiet-button"
                onClick={isPaused ? onResume : onPause}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button className="primary-button" onClick={onNextMovement}>Next</button>
            </div>
          </>
        ) : (
          <button className="quiet-button" onClick={onCustomize}>Adjust guide</button>
        )}
      </div>
    </aside>
  );
}

export function SessionView({
  flow,
  avatar,
  stepIndex,
  remaining,
  running,
  reflecting,
  peers,
  chessState,
  chessGame,
  onToggle,
  onNext,
  onExit,
  onRegeneratePeers,
  onComplete,
  onChessMove,
  onChessTheme,
  onChessUndo,
  onChessNew,
  onChessClear,
  guideVisible,
  guideState,
  onMovementView,
  onPreviousPose,
  onNextPose,
  onAvatarInteract,
}: {
  flow: Flow;
  avatar: AvatarConfig;
  stepIndex: number;
  remaining: number;
  running: boolean;
  reflecting: boolean;
  peers: PeerConfig[];
  chessState: SavedChess;
  chessGame: Chess;
  onToggle: () => void;
  onNext: () => void;
  onExit: () => void;
  onRegeneratePeers: () => void;
  onComplete: (outcome: OutcomeId) => void;
  onChessMove: (from: Square, to: Square) => void;
  onChessTheme: (theme: BoardTheme) => void;
  onChessUndo: () => void;
  onChessNew: () => void;
  onChessClear: () => void;
  guideVisible: boolean;
  guideState: AvatarBehaviorState;
  onMovementView: (view: MovementView) => void;
  onPreviousPose: () => void;
  onNextPose: () => void;
  onAvatarInteract: (part: GuidePart) => void;
}) {
  const step = flow.steps[stepIndex];
  const totalSeconds = flow.steps.reduce((sum, item) => sum + secondsFor(item.duration), 0);
  const completedSeconds =
    flow.steps.slice(0, stepIndex).reduce((sum, item) => sum + secondsFor(item.duration), 0) +
    (secondsFor(step.duration) - remaining);
  const progress = Math.min((completedSeconds / totalSeconds) * 100, 100);
  const movementDemo =
    step.kind === "movement" ? step.movement ?? movementDemoFor(step.label) : "rest";
  const preferredView =
    step.kind === "movement"
      ? step.preferredView ?? (["riseSink", "partHorse", "brushKnee", "wardOff", "repulseMonkey", "goldenRooster"].includes(movementDemo) ? "side" : "front")
      : "front";
  const demoView =
    guideState.sourceId === `session:${step.id}` ? guideState.view : preferredView;
  const movementDefinition = movementDefinitionFor(
    movementDemo === "singleCloud" ? "cloudHands" : movementDemo,
  );

  if (reflecting) {
    return (
      <section className="reflection-view" aria-labelledby="reflection-title">
        <button className="back-button" onClick={onExit}>End without noting</button>
        <div className="reflection-view__mark" aria-hidden="true">◌</div>
        <p className="eyebrow">Observe · not saved</p>
        <h1 id="reflection-title">What changed, if anything?</h1>
        <p className="lede">
          The answer remains only for this open visit and disappears on reload.
        </p>
        <div className="outcome-grid">
          <button onClick={() => onComplete("settled")}>More settled</button>
          <button onClick={() => onComplete("alert")}>More alert</button>
          <button onClick={() => onComplete("focused")}>More focused</button>
          <button onClick={() => onComplete("neutral")}>No clear change</button>
        </div>
      </section>
    );
  }

  const isFocus = step.kind === "focus";
  const cueByKind: Record<FlowStep["kind"], string> = {
    sensory:
      "Let your attention register edges, distance, and points of support before changing anything.",
    breath:
      "Keep the inhale ordinary. Allow the exhale to finish without pushing or holding.",
    movement:
      avatar.mobility === "seated"
        ? "Stay connected to the selected seat or wheelchair. Let the motion travel through a comfortable range."
        : avatar.mobility === "balance"
          ? `Keep contact with your ${avatar.support === "rail" ? "wall or rail" : avatar.support}. Make each shift smaller than your maximum.`
          : avatar.mobility === "oneArm"
            ? "Let the available arm trace the pathway. The other side can remain quiet."
            : "Let the movement stay smaller than your maximum. Keep your gaze easy and broad.",
    focus:
      "Look before calculating. Name one relationship, make a move, and return when attention wanders.",
    pattern:
      "Name one repeating relationship without deciding what it means.",
    literacy:
      "Choose a next mode from what you observed, not from a standard you are trying to meet.",
  };
  const demoDescription =
    step.kind === "movement" ? movementDescription(step.label, avatar) : "";

  return (
    <section className="active-session" aria-labelledby="active-step-title">
      <div className="active-session__top">
        <button className="back-button" onClick={onExit}>← Exit</button>
        <span>Step {stepIndex + 1} of {flow.steps.length}</span>
      </div>
      <div className="session-progress" aria-label={`${Math.round(progress)} percent complete`}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="active-session__copy">
        <p className="eyebrow">{flow.mode} · {step.kind}</p>
        <h1 id="active-step-title">{step.label}</h1>
        <p className="lede">{cueByKind[step.kind]}</p>
      </div>

      {isFocus ? (
        <ChessStudio
          compact
          chessState={chessState}
          game={chessGame}
          onMove={onChessMove}
          onTheme={onChessTheme}
          onUndo={onChessUndo}
          onNew={onChessNew}
          onClear={onChessClear}
        />
      ) : (
        <div className="practice-demo">
          <div className={`practice-stage ${guideVisible ? "" : "practice-stage--empty"}`}>
            <div className="flowing-path" aria-hidden="true" />
            {guideVisible && (
              <Trainer
                avatar={avatar}
                primary
                movement={guideState.movement}
                view={demoView}
                reaction={guideState.reaction}
                mood={guideState.mood}
                facing={guideState.facing}
                behavior={guideState.mode}
                poseIndex={guideState.poseIndex}
                reducedPresentation={guideState.reducedMotion}
                paused={!running || guideState.mode === "paused"}
                onInteract={onAvatarInteract}
                label={
                  step.kind === "movement"
                    ? `${step.label} movement demonstration`
                    : "Your abstract Evenward guide"
                }
              />
            )}
          </div>
          {step.kind === "movement" && (
            <div className="movement-caption">
              <span>Movement demonstration</span>
              <strong>{step.label}</strong>
              <p>{demoDescription}</p>
              {movementDefinition && (
                <MovementDirections
                  move={movementDefinition}
                  avatar={avatar}
                  compact
                />
              )}
              <div className="movement-view-toggle" aria-label="Demonstration view">
                <button
                  aria-pressed={demoView === "front"}
                  onClick={() => onMovementView("front")}
                >
                  Front
                </button>
                <button
                  aria-pressed={demoView === "side"}
                  onClick={() => onMovementView("side")}
                >
                  Side
                </button>
              </div>
              {guideState.mode === "reduced-motion" && movementDefinition && (
                <div className="reduced-pose" role="status">
                  <strong>Pose {guideState.poseIndex + 1} of 3</strong>
                  <span>
                    {movementDefinition.reducedMotionSteps[guideState.poseIndex]}
                  </span>
                  <div>
                    <button className="quiet-button" onClick={onPreviousPose}>
                      Previous pose
                    </button>
                    <button className="quiet-button" onClick={onNextPose}>
                      Next pose
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="timer" aria-live="polite">
        <span>
          {step.kind === "movement"
            ? running
              ? "Repeating until Next"
              : "Demonstration paused"
            : running
              ? "In practice"
              : "Paused"}
        </span>
        <strong>{step.kind === "movement" ? "Looping" : formatTime(remaining)}</strong>
      </div>
      <div className="session-controls">
        <button onClick={onToggle}>{running ? "Pause" : "Resume"}</button>
        <button onClick={onNext}>Next step</button>
      </div>
      <section className="practice-room" aria-label="Ephemeral practice room">
        <div>
          <p className="eyebrow">Quiet room</p>
          <h2>Company without comparison.</h2>
          <span>Generated for this practice · never saved</span>
        </div>
        <div className="peer-row" aria-label="Three randomized abstract participants">
          {peers.map((peer) => <PeerFigure key={peer.id} peer={peer} />)}
        </div>
        <button className="regenerate-button" onClick={onRegeneratePeers}>
          Regenerate room
        </button>
      </section>
      <button className="too-much-button" onClick={onExit}>
        Stop here
      </button>
    </section>
  );
}

export function ThemePanel({
  theme,
  mode,
  scene,
  onTheme,
  onMode,
  onScene,
  onReset,
  onClose,
}: {
  theme: ThemeName;
  mode: ThemeMode;
  scene: SceneName;
  onTheme: (theme: ThemeName) => void;
  onMode: (mode: ThemeMode) => void;
  onScene: (scene: SceneName) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const chooseTheme = (nextTheme: ThemeName) => {
    onTheme(nextTheme);
    if (!scenesByTheme[nextTheme].includes(scene)) onScene(scenesByTheme[nextTheme][0]);
  };
  return (
    <ModalSheet labelledBy="theme-title" onClose={onClose}>
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <div><p className="eyebrow">Appearance</p><h2 id="theme-title">Choose the atmosphere</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close theme settings">×</button>
        </div>
        <div className="theme-grid" aria-label="Color theme">
          {(["forest", "sea", "sunrise"] as ThemeName[]).map((option) => (
            <button
              key={option}
              className="theme-choice"
              data-preview={option}
              aria-pressed={theme === option}
              onClick={() => chooseTheme(option)}
            >
              <span className="theme-choice__swatches" aria-hidden="true"><i /><i /><i /></span>
              <span>{option === "sunrise" ? "Sunrise / sunset" : option[0].toUpperCase() + option.slice(1)}</span>
            </button>
          ))}
        </div>
        <div className="segmented" aria-label="Light or dark variation">
          {(["light", "dark"] as ThemeMode[]).map((option) => (
            <button key={option} aria-pressed={mode === option} onClick={() => onMode(option)}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
        <fieldset className="scene-picker">
          <legend>Background movement</legend>
          {scenesByTheme[theme].map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={scene === option}
              onClick={() => onScene(option)}
            >
              <i data-scene-icon={option} aria-hidden="true" />
              {sceneLabels[option]}
            </button>
          ))}
        </fieldset>
        <div className="sheet-footer">
          <p>Color and atmosphere save in this browser.</p>
          <button onClick={onReset}>Reset appearance</button>
        </div>
    </ModalSheet>
  );
}

export function GuidePanel({
  avatar,
  reaction,
  guideVisible,
  onAvatarInteract,
  onChange,
  onReset,
  onClose,
}: {
  avatar: AvatarConfig;
  reaction: GuideReaction;
  guideVisible: boolean;
  onAvatarInteract: (part: GuidePart) => void;
  onChange: (next: AvatarConfig) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<"identity" | "shape" | "access">("identity");
  return (
    <ModalSheet labelledBy="guide-title" className="sheet--guide" onClose={onClose}>
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <div><p className="eyebrow">Your guide</p><h2 id="guide-title">Shape a familiar companion</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close guide settings">×</button>
        </div>
        <div className="guide-tabs" aria-label="Guide editor sections">
          <button aria-pressed={section === "identity"} onClick={() => setSection("identity")}>Style</button>
          <button aria-pressed={section === "shape"} onClick={() => setSection("shape")}>Shape</button>
          <button aria-pressed={section === "access"} onClick={() => setSection("access")}>Access</button>
        </div>
        <div className="guide-editor">
          <div className={`guide-editor__preview ${guideVisible ? "" : "guide-editor__preview--empty"}`}>
            {guideVisible && (
              <Trainer
                avatar={avatar}
                compact
                reaction={reaction}
                onInteract={onAvatarInteract}
                label="Guide appearance preview"
              />
            )}
          </div>
          <div className="guide-editor__controls">
            {section === "identity" && (
              <>
                <label>Hair
                  <select value={avatar.hair} onChange={(event) => onChange({ ...avatar, hair: event.target.value as HairStyle })}>
                    <option value="crop">Cropped</option>
                    <option value="wave">Soft wave</option>
                    <option value="coils">Coils</option>
                    <option value="braid">Long braid</option>
                    <option value="long">Long</option>
                    <option value="bald">No hair</option>
                  </select>
                </label>
                <label>Garment
                  <select value={avatar.garment} onChange={(event) => onChange({ ...avatar, garment: event.target.value as GarmentStyle })}>
                    <option value="movement">Movement set</option>
                    <option value="tunic">Long modest tunic</option>
                    <option value="robe">Flowing robe</option>
                    <option value="loose">Loose separates</option>
                    <option value="athletic">Athletic set</option>
                  </select>
                </label>
                <label>Religious head covering
                  <select value={avatar.headwear} onChange={(event) => onChange({ ...avatar, headwear: event.target.value as Headwear })}>
                    <option value="none">None</option>
                    <option value="hijab">Hijab</option>
                    <option value="dastar">Sikh dastār</option>
                    <option value="kippah">Kippah</option>
                    <option value="kufi">Kufi</option>
                    <option value="veil">Nun’s veil</option>
                    <option value="burqa">Burqa</option>
                  </select>
                </label>
                <label>Religious accessory
                  <select value={avatar.faithAccessory} onChange={(event) => onChange({ ...avatar, faithAccessory: event.target.value as FaithAccessory })}>
                    <option value="none">None</option>
                    <option value="cross">Cross necklace</option>
                    <option value="rosary">Rosary beads</option>
                    <option value="mala">Mala beads</option>
                    <option value="star">Star pendant</option>
                    <option value="crescent">Crescent pendant</option>
                  </select>
                </label>
              </>
            )}
            {section === "shape" && (
              <>
                <label>Skin tone
                  <select value={avatar.skin} onChange={(event) => onChange({ ...avatar, skin: event.target.value as SkinTone })}>
                    <option value="porcelain">Porcelain</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="olive">Olive</option>
                    <option value="brown">Brown</option>
                    <option value="deep">Deep</option>
                  </select>
                </label>
                <label className="range-control">
                  <span>Height <output>{avatar.height}%</output></span>
                  <input type="range" min="86" max="114" value={avatar.height} onChange={(event) => onChange({ ...avatar, height: Number(event.target.value) })} />
                  <small>Shorter illustration <i /> Taller illustration</small>
                </label>
                <label className="range-control">
                  <span>Weight <output>{avatar.weight}%</output></span>
                  <input type="range" min="72" max="132" value={avatar.weight} onChange={(event) => onChange({ ...avatar, weight: Number(event.target.value) })} />
                  <small>Lighter build <i /> Heavier build</small>
                </label>
                <label className="toggle-row"><span>Glasses</span><input type="checkbox" checked={avatar.glasses} onChange={(event) => onChange({ ...avatar, glasses: event.target.checked })} /></label>
              </>
            )}
            {section === "access" && (
              <>
                <label>Movement mode
                  <select value={avatar.mobility} onChange={(event) => onChange({ ...avatar, mobility: event.target.value as MobilityMode })}>
                    <option value="standing">Standing</option>
                    <option value="seated">Seated movement</option>
                    <option value="balance">Balance-supported</option>
                    <option value="limited">Limited range</option>
                    <option value="oneArm">One-arm movement</option>
                  </select>
                </label>
                <label>Support accessory
                  <select value={avatar.support} onChange={(event) => onChange({ ...avatar, support: event.target.value as SupportAccessory })}>
                    <option value="none">None selected</option>
                    <option value="chair">Stable chair</option>
                    <option value="wheelchair">Wheelchair</option>
                    <option value="cane">Cane</option>
                    <option value="walker">Walker / rollator</option>
                    <option value="rail">Wall or rail access</option>
                  </select>
                </label>
                <label className="toggle-row"><span>Low-vision mode</span><input type="checkbox" checked={avatar.lowVision} onChange={(event) => onChange({ ...avatar, lowVision: event.target.checked })} /></label>
                <label className="toggle-row"><span>Hearing support shown</span><input type="checkbox" checked={avatar.hearingSupport} onChange={(event) => onChange({ ...avatar, hearingSupport: event.target.checked })} /></label>
                <label className="toggle-row"><span>Reduce visual motion</span><input type="checkbox" checked={avatar.reducedMotion} onChange={(event) => onChange({ ...avatar, reducedMotion: event.target.checked })} /></label>
                <label>Demonstration speed
                  <select value={avatar.playbackSpeed} onChange={(event) => onChange({ ...avatar, playbackSpeed: event.target.value as AvatarConfig["playbackSpeed"] })}>
                    <option value="standard">Standard</option>
                    <option value="slow">Slower</option>
                  </select>
                </label>
                <label className="toggle-row"><span>More opaque surfaces</span><input type="checkbox" checked={avatar.solidSurfaces} onChange={(event) => onChange({ ...avatar, solidSurfaces: event.target.checked })} /></label>
                <p className="access-explainer">
                  Every movement remains in the library. This setup selects its
                  standing, seated, supported, limited-range, or one-arm form and
                  shows the chosen accessory in demonstrations.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="sheet-footer">
          <p>Guide appearance and access setup save in this browser.</p>
          <button onClick={onReset}>Reset guide</button>
        </div>
    </ModalSheet>
  );
}
