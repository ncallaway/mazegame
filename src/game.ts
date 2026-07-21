import { getAction, initializeKeyboard } from './input';
import { generateMaze, MazeParameters} from './maze';
import { render } from './render';
import { MazeState } from './state';
import { update } from './update';


const LEVELS: MazeParameters[] = [
  { size: { width: 8, height: 8 }, goalDistanceMin: 6, goalDistanceMax: 10 },
  { size: { width: 9, height: 9 }, goalDistanceMin: 8, goalDistanceMax: 14 }
]

type GameState = {
  level: number;
}

console.log("level 1");
const maze = generateMaze(LEVELS[0]);

const gameState: GameState = {
  level: 1
}

const mazeState: MazeState = {
  maze,
  targetPosition: undefined,
  playerPosition: maze.start,
  playerOrientation: 0,
  playerRotationalVelocity: 0,
  physicalPosition: { x: 0.5, y: 0.5 },
  physicalVelocity: { x: 0, y: 0 },
  path: undefined,
}

const el = document.querySelector<HTMLCanvasElement>("#game-output");
if (!el) {
  throw new Error("canvas #game-output not found");
}
const context = el.getContext("2d");
if (!context) {
  throw new Error("canvas 2d context not found");
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  el.width  = el.clientWidth  * dpr;
  el.height = el.clientHeight * dpr;
  context.scale(dpr, dpr);   // so you can draw in CSS pixels
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
    update(mazeState, getAction(), dt);
    render(context, mazeState);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

loop();
