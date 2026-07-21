import { generateMaze, Maze, MazeAddress, MazeParameters} from './maze';
import { render } from './render';
import { MazeState } from './state';


const LEVELS: MazeParameters[] = [
  { size: { width: 8, height: 8 }, goalDistanceMin: 6, goalDistanceMax: 10 }
]

console.log("level 1");
const maze = generateMaze(LEVELS[0]);


const state: MazeState = {
  maze,
  playerPosition: maze.start
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

const loop = () => {
  let last = performance.now();
  function frame(now: number) {
    const dt = (now - last) / 1000;  // seconds
    last = now;
    // update(state, getIntent(), dt);
    // render(ctx, state);
    render(context, maze);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

loop();
