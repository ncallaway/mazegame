import { getAction, initializeKeyboard } from './input';
import { createMazeState } from './levels';
import { render } from './render';
import { GameState } from './state';
import { update } from './update';


const gameState: GameState = {
  level: 1,
  maze: createMazeState(1)
}

const el = document.querySelector<HTMLCanvasElement>("#game-output");
if (!el) {
  throw new Error("canvas #game-output not found");
}
const context = el.getContext("2d");
if (!context) {
  throw new Error("canvas 2d context not found");
}
const nextLevelButton = document.querySelector<HTMLButtonElement>("#next-level");
if (!nextLevelButton) {
  throw new Error("button #next-level not found");
}

// Capture non-null references after the guards so the deferred closures below
// (resize/frame) don't see them as possibly-null.
const canvas: HTMLCanvasElement = el;
const ctx: CanvasRenderingContext2D = context;
const nextButton: HTMLButtonElement = nextLevelButton;

// Advance to the next level only when the player clicks the button. Building a
// fresh maze clears `won`, which hides the button again on the next frame.
nextButton.addEventListener("click", () => {
  if (gameState.maze.won) {
    gameState.level += 1;
    gameState.maze = createMazeState(gameState.level);
  }
});

// Show/hide the DOM button as the level is won/reset. Toggle only on change so
// we're not thrashing the DOM every frame.
let buttonShown = false;
const syncNextLevelButton = () => {
  const won = gameState.maze.won !== undefined;
  if (won === buttonShown) { return; }
  buttonShown = won;
  nextButton.style.display = won ? "block" : "none";
  if (won) { nextButton.focus(); }
};

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = canvas.clientWidth  * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);   // so you can draw in CSS pixels
}
resize();
window.addEventListener("resize", resize);
initializeKeyboard();

// Recompute the player -> target path only when an endpoint cell actually
// changed. `undefined` target => `undefined` path.

const loop = () => {
  let last = performance.now();
  function frame(now: number) {
    const dt = (now - last) / 1000;  // seconds
    last = now;
    const nowSeconds = now / 1000;
    update(gameState, getAction(), dt, nowSeconds);
    render(ctx, gameState.maze);
    syncNextLevelButton();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

loop();
