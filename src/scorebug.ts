import { GameState } from "./state";

const el = {
  level:      document.querySelector<HTMLElement>(".score-bug .level")!,
  elapsed:    document.querySelector<HTMLElement>(".score-bug .elapsed")!,
  firstMove:  document.querySelector<HTMLElement>(".score-bug .first-move")!,
  target:    document.querySelector<HTMLElement>(".score-bug .target")!,
};

const last = { level: "", elapsed: "", firstMove: "", target: "" };

const set = (node: HTMLElement, key: keyof typeof last, value: string) => {
  if (last[key] === value) { return; }   // dirty-check: no write, no reflow
  last[key] = value;
  node.textContent = value;
};

const fmt = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

export const syncScorebug = (game: GameState, now: number) => {
  const m = game.maze;
  const end = m.won ?? now;                // freeze the clock once the level is won
  set(el.level, "level", `Level ${game.level}`);
  set(el.elapsed, "elapsed", fmt(end - m.started));
  set(el.firstMove, "firstMove", m.targetMoved ? fmt(m.targetMoved - m.started) : fmt(now - m.started));

  let targetMsg = "";
  if (m.targetSafe && !m.playerCaughtTarget) {
    targetMsg = "Target got away!";
  } else if (!m.playerCaughtTarget && m.targetMoved) {
    targetMsg = "Target is running!";
  } else if (m.playerCaughtTarget && m.targetMoved) {
    targetMsg = "Target got caught :/";
  }
  set(el.target, "target", targetMsg);
};
