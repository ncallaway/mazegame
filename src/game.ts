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

// Capture non-null references after the guards so the deferred closures below
// (resize/frame) don't see them as possibly-null.
const canvas: HTMLCanvasElement = el;
const ctx: CanvasRenderingContext2D = context;

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
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

loop();
