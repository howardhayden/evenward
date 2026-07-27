"use client";

import { useState } from "react";
import type { Color, PieceSymbol, Square } from "chess.js";
import { Chess } from "chess.js";
import { boardThemes } from "../../domain/content";
import type { BoardTheme, SavedChess } from "../../domain/types";

function PieceIcon({
  type,
  color,
}: {
  type: PieceSymbol;
  color: Color;
}) {
  return (
    <span className="stone-piece" data-color={color} aria-hidden="true">
      <svg viewBox="0 0 48 48">
        {type === "p" && <path d="M24 8a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm-8 17h16l5 13H11Z" />}
        {type === "r" && <path d="M12 9h7v6h10V9h7v29H12Zm5 12h14" />}
        {type === "n" && <path d="M13 37c1-14 6-22 19-28l5 7-7 5 6 16Zm10-17 5 2" />}
        {type === "b" && <path d="m24 7 10 14-10 11-10-11Zm-10 30h20M24 12l5 7-5 5" />}
        {type === "q" && <path d="m10 14 8 7 6-12 6 12 8-7-5 23H15Zm8 13h12" />}
        {type === "k" && <path d="M24 6v11m-6-6h12m-12 7h12l6 19H12Z" />}
      </svg>
    </span>
  );
}

function ChessBoard({
  game,
  boardTheme,
  onMove,
}: {
  game: Chess;
  boardTheme: BoardTheme;
  onMove: (from: Square, to: Square) => void;
}) {
  const [selected, setSelected] = useState<Square | null>(null);
  const legalTargets = selected
    ? game.moves({ square: selected, verbose: true }).map((move) => move.to)
    : [];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const names: Record<PieceSymbol, string> = {
    p: "pawn",
    r: "rook",
    n: "knight",
    b: "bishop",
    q: "queen",
    k: "king",
  };

  const chooseSquare = (square: Square) => {
    if (game.isGameOver() || game.turn() !== "w") return;
    const piece = game.get(square);
    if (selected && legalTargets.includes(square)) {
      onMove(selected, square);
      setSelected(null);
      return;
    }
    if (piece?.color === "w") {
      setSelected(square);
      return;
    }
    setSelected(null);
  };
  return (
    <div className="chess-board-wrap" data-board-theme={boardTheme}>
      <div
        className="chess-board"
        role="grid"
        aria-label={`${boardThemes.find((item) => item.id === boardTheme)?.name} stone chess board`}
      >
        {ranks.flatMap((rank) =>
          files.map((file) => {
            const square = `${file}${rank}` as Square;
            const piece = game.get(square);
            const active = selected === square;
            const legal = legalTargets.includes(square);
            const fileIndex = "abcdefgh".indexOf(file);
            const darkSquare = (fileIndex + rank) % 2 === 1;
            const label = piece
              ? `${piece.color === "w" ? "Light" : "Dark"} ${names[piece.type]} on ${square}`
              : `Empty ${square}`;
            return (
              <button
                key={square}
                className="chess-square"
                data-tone={darkSquare ? "dark" : "light"}
                data-selected={active}
                data-legal={legal}
                role="gridcell"
                aria-label={label}
                aria-selected={active}
                onClick={() => chooseSquare(square)}
              >
                {piece && <PieceIcon type={piece.type} color={piece.color} />}
                {file === files[0] && <small className="rank-label">{rank}</small>}
                {rank === ranks[ranks.length - 1] && <small className="file-label">{file}</small>}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function ChessStudio({
  chessState,
  game,
  compact = false,
  onMove,
  onTheme,
  onUndo,
  onNew,
  onClear,
}: {
  chessState: SavedChess;
  game: Chess;
  compact?: boolean;
  onMove: (from: Square, to: Square) => void;
  onTheme: (theme: BoardTheme) => void;
  onUndo: () => void;
  onNew: () => void;
  onClear: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const status = game.isCheckmate()
    ? game.turn() === "b"
      ? "You win · dark is checkmated"
      : "Evenward wins · light is checkmated"
    : game.isDraw()
      ? "Drawn position"
      : game.inCheck()
        ? game.turn() === "w"
          ? "Your turn · light is in check"
          : "Evenward is choosing dark"
        : game.turn() === "w"
          ? "Your turn · light"
          : "Evenward is choosing dark";
  const moveCount = game.history().length;

  return (
    <section className={`chess-studio ${compact ? "chess-studio--compact" : ""}`}>
      {!compact && (
        <>
          <p className="eyebrow">Calm chess</p>
          <h1>Stay with the position.</h1>
          <p className="lede">
            You play the light pieces, untimed. Evenward answers with dark
            automatically. The current game saves in this browser.
          </p>
        </>
      )}

      <div className="board-theme-picker" aria-label="Chess board theme">
        {boardThemes.map((item) => (
          <button
            key={item.id}
            data-swatch={item.id}
            aria-pressed={chessState.boardTheme === item.id}
            onClick={() => onTheme(item.id)}
          >
            <i aria-hidden="true" />
            <span>{item.name}<small>{item.note}</small></span>
          </button>
        ))}
      </div>

      <div className="chess-layout">
        <div>
          <ChessBoard
            game={game}
            boardTheme={chessState.boardTheme}
            onMove={onMove}
          />
          <p className="chess-caption">
            Select one of your light stone pieces, then a marked square. Evenward
            moves dark after you. Pawns promote to queen automatically.
          </p>
        </div>
        <aside className="chess-console">
          <div className="chess-status" aria-live="polite" aria-atomic="true">
            <span>Position</span>
            <strong>{status}</strong>
          </div>
          <dl>
            <div><dt>Moves</dt><dd>{moveCount}</dd></div>
            <div><dt>Completed</dt><dd>{chessState.completed}</dd></div>
            <div><dt>Clock</dt><dd>Off</dd></div>
          </dl>
          <div className="chess-actions">
            <button onClick={onUndo} disabled={!moveCount}>Undo move</button>
            <button onClick={onNew}>New game</button>
          </div>
          {!confirmClear ? (
            <button className="clear-chess" onClick={() => setConfirmClear(true)}>
              Clear saved chess
            </button>
          ) : (
            <div className="confirm-clear" role="alert">
              <p>Clear the current board and completed-game count?</p>
              <button onClick={() => { onClear(); setConfirmClear(false); }}>Yes, clear</button>
              <button onClick={() => setConfirmClear(false)}>Keep it</button>
            </div>
          )}
          <p className="save-note">Only chess progress and its board setting persist.</p>
        </aside>
      </div>
    </section>
  );
}

