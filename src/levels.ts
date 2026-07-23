import { generateMaze, MazeParameters } from "./maze";
import { MazeState } from "./state";

const LEVELS: MazeParameters[] = [
  { size: { width: 8, height: 8 }, goalDistanceMin: 6, goalDistanceMax: 10 },
  { size: { width: 8, height: 8 }, goalDistanceMin: 10, goalDistanceMax: 20},
  { size: { width: 8, height: 8 }, goalDistanceMin: 20, goalDistanceMax: 30},
  { size: { width: 9, height: 9 }, goalDistanceMin: 20, goalDistanceMax: 30},
  { size: { width: 10, height: 10 }, goalDistanceMin: 20, goalDistanceMax: 40},
  { size: { width: 12, height: 10 }, goalDistanceMin: 20, goalDistanceMax: 50},
  { size: { width: 14, height: 10 }, goalDistanceMin: 30, goalDistanceMax: 60},
  { size: { width: 14, height: 12 }, goalDistanceMin: 30, goalDistanceMax: 70},
  { size: { width: 16, height: 12 }, goalDistanceMin: 30, goalDistanceMax: 80},
  { size: { width: 18, height: 14 }, goalDistanceMin: 40, goalDistanceMax: 90},
  { size: { width: 20, height: 15 }, goalDistanceMin: 80, goalDistanceMax: 100},
]

export const createMazeState = (level: number, now: number): MazeState => {
  console.log(`creating maze for level ${level}`);
  const lvlIdx = level - 1;
  const lvlParams = LEVELS[lvlIdx] ?? LEVELS[LEVELS.length - 1];
  const maze = generateMaze(lvlParams);
  return {
    maze,
    targetPosition: undefined,
    playerPosition: maze.start,
    playerOrientation: 0,
    playerRotationalVelocity: 0,
    physicalPosition: { x: 0.5, y: 0.5 },
    physicalVelocity: { x: 0, y: 0 },
    path: undefined,
    won: undefined,
    started: now,
    targetMoved: undefined,
    playerCaughtTarget: false,
    targetSafe: false,
  }
}
