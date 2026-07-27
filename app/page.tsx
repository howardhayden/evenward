"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import type {
  AvatarConfig,
  ChoiceId,
  Daypart,
  Flow,
  MovementPractice,
  MovementView,
  OutcomeId,
  PeerConfig,
  SavedChess,
  SceneName,
  ThemeMode,
  ThemeName,
  ViewId,
  VisitNote,
} from "./domain/types";
import {
  defaultAvatar,
  defaultChess,
} from "./domain/content";
import {
  adaptFlow,
  availableMovementPractices,
  generatePeers,
  movementDemoFor,
  nextMovement,
  secondsFor,
} from "./domain/movement-logic";
import {
  clearAllEvenwardStorage,
  clearChessStorage,
  readLocalState,
  writeAppearance,
  writeChess,
} from "./domain/persistence";
import { useAvatarController } from "./hooks/use-avatar-controller";
import { AmbientScene, FilmSurface } from "./components/ambient/Atmosphere";
import { Trainer } from "./components/avatar/Trainer";
import { ChessStudio } from "./components/chess/ChessStudio";
import {
  AppNavigation,
  browserDaypart,
  GuidePanel,
  GuidePresence,
  Mark,
  PatternsView,
  PracticeView,
  SessionView,
  ThemePanel,
  TodayView,
  UnderstandView,
} from "./components/studio/StudioUI";

function makeAutomaticDarkMove(game: Chess) {
  if (game.turn() !== "b" || game.isGameOver()) return;
  const pieceValue: Partial<Record<PieceSymbol, number>> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
  };
  const candidates = game.moves({ verbose: true }).map((move) => {
    const fileDistance = Math.abs("abcdefgh".indexOf(move.to[0]) - 3.5);
    const rankDistance = Math.abs(Number(move.to[1]) - 4.5);
    return {
      move,
      score:
        (move.captured ? (pieceValue[move.captured] ?? 0) * 10 : 0) +
        (move.promotion ? 18 : 0) +
        (move.san.includes("+") ? 4 : 0) -
        (fileDistance + rankDistance) * 0.2,
    };
  });
  candidates.sort((left, right) =>
    right.score - left.score || left.move.san.localeCompare(right.move.san),
  );
  const reply = candidates[0]?.move;
  if (!reply) return;
  game.move({
    from: reply.from,
    to: reply.to,
    promotion: reply.promotion ?? "q",
  });
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeName>("forest");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [scene, setScene] = useState<SceneName>("leaves");
  const [avatar, setAvatar] = useState<AvatarConfig>(defaultAvatar);
  const [selectedChoice, setSelectedChoice] = useState<ChoiceId>("move");
  const [openPanel, setOpenPanel] = useState<"theme" | "guide" | null>(null);
  const [view, setView] = useState<ViewId>("today");
  const [visitNotes, setVisitNotes] = useState<VisitNote[]>([]);
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [peers, setPeers] = useState<PeerConfig[]>([]);
  const [chessState, setChessState] = useState<SavedChess>(defaultChess);
  const [ambientSeed, setAmbientSeed] = useState(74123);
  const [hydrated, setHydrated] = useState(false);
  const [daypart, setDaypart] = useState<Daypart | null>(null);
  const [pageHidden, setPageHidden] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const reducedPresentation = avatar.reducedMotion || systemReducedMotion;
  const guide = useAvatarController(reducedPresentation);

  const chessGame = useMemo(() => {
    const game = new Chess();
    if (chessState.pgn) {
      try {
        game.loadPgn(chessState.pgn);
      } catch {
        return new Chess();
      }
    }
    makeAutomaticDarkMove(game);
    return game;
  }, [chessState.pgn]);

  useEffect(() => {
    const randomizeAmbient = window.setTimeout(() => {
      const seed = new Uint32Array(1);
      window.crypto.getRandomValues(seed);
      setAmbientSeed(seed[0] || Date.now());
    }, 0);
    return () => window.clearTimeout(randomizeAmbient);
  }, []);

  useEffect(() => {
    const readBrowserTime = () => setDaypart(browserDaypart(new Date().getHours()));
    readBrowserTime();
    const clock = window.setInterval(readBrowserTime, 60_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageHidden(document.visibilityState !== "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setSystemReducedMotion(media.matches);
    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);
    return () => media.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const loadSavedState = window.setTimeout(() => {
      try {
        const saved = readLocalState(window.localStorage);
        setTheme(saved.preferences.theme);
        setMode(saved.preferences.mode);
        setScene(saved.preferences.scene);
        setAvatar(saved.preferences.avatar);
        setChessState(saved.chess);
      } catch {
        // Storage can be unavailable in hardened browser contexts. The in-memory
        // studio remains fully usable without changing its privacy boundary.
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(loadSavedState);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      writeAppearance(window.localStorage, { theme, mode, scene, avatar });
    } catch {
      // Preferences remain in memory when browser storage is unavailable.
    }
  }, [theme, mode, scene, avatar, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      writeChess(window.localStorage, chessState);
    } catch {
      // The current chess position remains playable for this visit.
    }
  }, [chessState, hydrated]);

  useEffect(() => {
    if (
      !activeFlow ||
      !running ||
      pageHidden ||
      reflecting ||
      activeFlow.steps[stepIndex]?.kind === "movement"
    ) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeFlow, pageHidden, running, reflecting, stepIndex]);

  useEffect(() => {
    if (
      !activeFlow ||
      !running ||
      pageHidden ||
      reflecting ||
      remaining !== 0 ||
      activeFlow.steps[stepIndex]?.kind === "movement"
    ) return;
    const moveForward = window.setTimeout(() => {
      if (stepIndex < activeFlow.steps.length - 1) {
        const nextIndex = stepIndex + 1;
        setStepIndex(nextIndex);
        setRemaining(secondsFor(activeFlow.steps[nextIndex].duration));
      } else {
        setRunning(false);
        setReflecting(true);
      }
    }, 0);
    return () => window.clearTimeout(moveForward);
  }, [activeFlow, pageHidden, reflecting, remaining, running, stepIndex]);

  const demonstrateGuide = guide.demonstrate;
  const returnGuideToIdle = guide.returnToIdle;

  useEffect(() => {
    if (!activeFlow || reflecting) {
      if (reflecting) returnGuideToIdle();
      return;
    }
    const step = activeFlow.steps[stepIndex];
    if (!step) return;
    if (step.kind === "movement") {
      demonstrateGuide(
        step.movement ?? movementDemoFor(step.label),
        `session:${step.id}`,
        step.preferredView ?? "front",
      );
    } else {
      returnGuideToIdle();
    }
  }, [
    activeFlow,
    demonstrateGuide,
    returnGuideToIdle,
    reflecting,
    stepIndex,
  ]);

  const guideVisible = guide.state.mode !== "hidden";
  const lessonOptions = availableMovementPractices(avatar);
  const activeLesson =
    lessonOptions.find((move) => move.id === guide.state.sourceId) ?? null;

  const selectLesson = (move: MovementPractice, movementView: MovementView) => {
    const movement =
      avatar.mobility === "oneArm" && move.id === "cloudHands"
        ? "singleCloud"
        : move.id;
    guide.demonstrate(movement, move.id, movementView);
  };

  const stopLesson = () => {
    guide.returnToIdle();
  };

  const nextLesson = () => {
    const next = nextMovement(guide.state.sourceId, lessonOptions);
    if (next) selectLesson(next, next.preferredView);
  };

  const startFlow = (baseFlow: Flow) => {
    const flow = adaptFlow(baseFlow, avatar);
    setActiveFlow(flow);
    setStepIndex(0);
    setRemaining(secondsFor(flow.steps[0].duration));
    setRunning(true);
    setReflecting(false);
    setPeers(generatePeers());
    window.scrollTo({ top: 0, behavior: reducedPresentation ? "auto" : "smooth" });
  };

  const exitSession = () => {
    setActiveFlow(null);
    setRunning(false);
    setReflecting(false);
    setStepIndex(0);
    setRemaining(0);
    setPeers([]);
    guide.returnToIdle();
  };

  const nextStep = () => {
    if (!activeFlow) return;
    if (stepIndex < activeFlow.steps.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      setRemaining(secondsFor(activeFlow.steps[nextIndex].duration));
      setRunning(true);
    } else {
      setRunning(false);
      setReflecting(true);
      guide.returnToIdle();
    }
  };

  const toggleSession = () => {
    const nextRunning = !running;
    setRunning(nextRunning);
    if (activeFlow?.steps[stepIndex]?.kind !== "movement") return;
    if (nextRunning) guide.resume();
    else guide.pause();
  };

  const completeSession = (outcome: OutcomeId) => {
    if (!activeFlow) return;
    setVisitNotes((current) => [{ flowTitle: activeFlow.title, outcome }, ...current]);
    exitSession();
    setView("patterns");
    window.scrollTo({ top: 0, behavior: reducedPresentation ? "auto" : "smooth" });
  };

  const makeChessGame = () => {
    const game = new Chess();
    if (chessState.pgn) game.loadPgn(chessState.pgn);
    makeAutomaticDarkMove(game);
    return game;
  };

  const moveChess = (from: Square, to: Square) => {
    const game = makeChessGame();
    if (game.turn() !== "w" || game.get(from)?.color !== "w") return;
    try {
      game.move({ from, to, promotion: "q" });
      makeAutomaticDarkMove(game);
      const finishedNow = game.isGameOver() && !chessState.finishedRecorded;
      setChessState((current) => ({
        ...current,
        pgn: game.pgn(),
        completed: current.completed + (finishedNow ? 1 : 0),
        finishedRecorded: current.finishedRecorded || finishedNow,
      }));
      guide.react("head");
    } catch {
      return;
    }
  };

  const undoChess = () => {
    const game = makeChessGame();
    const moveCount = game.history().length;
    if (!moveCount) return;
    game.undo();
    if (game.turn() === "b" && game.history().length) game.undo();
    setChessState((current) => ({
      ...current,
      pgn: game.pgn(),
      finishedRecorded: false,
    }));
  };

  const newChess = () => {
    setChessState((current) => ({ ...current, pgn: "", finishedRecorded: false }));
  };

  const clearChess = () => {
    setChessState(defaultChess);
    try {
      clearChessStorage(window.localStorage);
    } catch {
      // In-memory state is still cleared.
    }
  };

  const changeView = (next: ViewId) => {
    if (next !== "understand") stopLesson();
    setView(next);
    window.scrollTo({ top: 0, behavior: reducedPresentation ? "auto" : "smooth" });
  };

  const resetAppearance = () => {
    setTheme("forest");
    setMode("light");
    setScene("leaves");
  };

  const clearAllSavedData = () => {
    try {
      clearAllEvenwardStorage(window.localStorage);
    } catch {
      // In-memory state is still reset.
    }
    setTheme("forest");
    setMode("light");
    setScene("leaves");
    setAvatar(defaultAvatar);
    setChessState(defaultChess);
    setVisitNotes([]);
    guide.returnToIdle();
  };

  return (
    <div
      className="cadence-app"
      data-theme={theme}
      data-mode={mode}
      data-low-vision={avatar.lowVision}
      data-reduced-motion={reducedPresentation}
      data-solid-surfaces={avatar.solidSurfaces}
      data-page-hidden={pageHidden}
      onClickCapture={(event) => {
        if (guide.state.mode !== "idle") return;
        const target = event.target;
        if (target instanceof Element && target.closest(".trainer-hit")) return;
        guide.react("rightHand");
      }}
    >
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {guide.announcement}
      </div>
      <FilmSurface />
      <AmbientScene scene={scene} seed={ambientSeed} />
      <div className={`app-shell ${activeFlow ? "app-shell--session" : ""}`}>
        {!activeFlow && <AppNavigation view={view} onChange={changeView} />}
        <div className="app-column">
          <header className="topbar">
            <button className="brand mobile-brand" onClick={() => changeView("today")} aria-label="Evenward home">
              <span className="brand__mark"><Mark /></span><span>Evenward</span>
            </button>
            <div className="topbar__actions">
              <button className="quiet-button" onClick={() => setOpenPanel("theme")}>
                <span className="theme-dot" aria-hidden="true" />
                {theme === "sunrise" ? "Sunrise" : theme[0].toUpperCase() + theme.slice(1)} · {mode[0].toUpperCase() + mode.slice(1)}
              </button>
              {guideVisible && (
                <button className="avatar-button" onClick={() => setOpenPanel("guide")} aria-label="Customize your guide and access setup">
                  <Trainer
                    avatar={avatar}
                    compact
                    reaction={guide.state.reaction}
                    mood={guide.state.mood}
                    behavior={guide.state.mode}
                  />
                </button>
              )}
            </div>
          </header>

          <div className={`content-with-guide ${guideVisible ? "" : "content-with-guide--solo"}`}>
          <main id="main-content" className="app-main" tabIndex={-1}>
            {activeFlow ? (
              <SessionView
                flow={activeFlow}
                avatar={avatar}
                stepIndex={stepIndex}
                remaining={remaining}
                running={running}
                reflecting={reflecting}
                peers={peers}
                chessState={chessState}
                chessGame={chessGame}
                onToggle={toggleSession}
                onNext={nextStep}
                onExit={exitSession}
                onRegeneratePeers={() => setPeers(generatePeers())}
                onComplete={completeSession}
                onChessMove={moveChess}
                onChessTheme={(boardTheme) => setChessState((current) => ({ ...current, boardTheme }))}
                onChessUndo={undoChess}
                onChessNew={newChess}
                onChessClear={clearChess}
                guideVisible={guideVisible}
                guideState={guide.state}
                onMovementView={guide.setView}
                onPreviousPose={guide.previousPose}
                onNextPose={guide.nextPose}
                onAvatarInteract={guide.react}
              />
            ) : (
              <>
                {view === "today" && (
                  <TodayView
                    selectedChoice={selectedChoice}
                    avatar={avatar}
                    daypart={daypart}
                    onSelectChoice={setSelectedChoice}
                    onStart={startFlow}
                  />
                )}
                {view === "practice" && (
                  <PracticeView avatar={avatar} onStart={startFlow} onOpenAccess={() => setOpenPanel("guide")} />
                )}
                {view === "chess" && (
                  <ChessStudio
                    chessState={chessState}
                    game={chessGame}
                    onMove={moveChess}
                    onTheme={(boardTheme) => setChessState((current) => ({ ...current, boardTheme }))}
                    onUndo={undoChess}
                    onNew={newChess}
                    onClear={clearChess}
                  />
                )}
                {view === "patterns" && (
                  <PatternsView
                    notes={visitNotes}
                    onClear={() => setVisitNotes([])}
                    onResetAll={clearAllSavedData}
                  />
                )}
                {view === "understand" && (
                  <UnderstandView
                    avatar={avatar}
                    activeMove={activeLesson}
                    activeView={guide.state.view}
                    onSelectMove={selectLesson}
                    onView={guide.setView}
                    onStop={stopLesson}
                    onOpenAccess={() => setOpenPanel("guide")}
                  />
                )}
              </>
            )}
          </main>
          {!activeFlow && guideVisible && (
            <GuidePresence
              avatar={avatar}
              guideState={guide.state}
              daypart={daypart}
              activeMove={view === "understand" ? activeLesson : null}
              onMovementView={guide.setView}
              onPause={guide.pause}
              onResume={guide.resume}
              onPreviousPose={guide.previousPose}
              onNextPose={guide.nextPose}
              onNextMovement={nextLesson}
              onStopMovement={stopLesson}
              onCustomize={() => setOpenPanel("guide")}
              onAvatarInteract={guide.react}
            />
          )}
          </div>

          {!activeFlow && (
            <footer className="quiet-footer">
              <p>
                Evenward is an educational practice tool, not medical or
                mental-health care. You choose the direction and may stop at
                any time.
              </p>
            </footer>
          )}
        </div>
      </div>

      {openPanel === "theme" && (
        <ThemePanel
          theme={theme}
          mode={mode}
          scene={scene}
          onTheme={setTheme}
          onMode={setMode}
          onScene={setScene}
          onReset={resetAppearance}
          onClose={() => setOpenPanel(null)}
        />
      )}
      {openPanel === "guide" && (
        <GuidePanel
          avatar={avatar}
          reaction={guide.state.reaction}
          guideVisible={guideVisible}
          onAvatarInteract={guide.react}
          onChange={setAvatar}
          onReset={() => setAvatar(defaultAvatar)}
          onClose={() => setOpenPanel(null)}
        />
      )}
    </div>
  );
}
