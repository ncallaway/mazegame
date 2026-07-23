import { getAction, initializeKeyboard } from './input';
import { createMazeState } from './levels';
import { render } from './render';
import { syncScorebug } from './scorebug';
import { GameState } from './state';
import { update } from './update';


const gameState: GameState = {
  level: 1,
  maze: createMazeState(1, performance.now() / 1000)
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

const canvas: HTMLCanvasElement = el;
const ctx: CanvasRenderingContext2D = context;
const nextButton: HTMLButtonElement = nextLevelButton;

nextButton.addEventListener("click", () => {
  if (gameState.maze.won) {
    gameState.level += 1;
    gameState.maze = createMazeState(gameState.level, performance.now() / 1000);
  }
});

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

const loop = () => {
  let last = performance.now();
  function frame(now: number) {
    const dt = (now - last) / 1000;  // seconds
    last = now;
    const nowSeconds = now / 1000;
    update(gameState, getAction(), dt, nowSeconds);
    render(ctx, gameState.maze, nowSeconds);
    syncScorebug(gameState, nowSeconds);
    syncNextLevelButton();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

loop();
