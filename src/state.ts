import { Maze, MazeAddress } from "./maze";

export type MazeState = {
  maze: Maze;
  playerPosition: MazeAddress;
  // physicalPosition: { x: number, y: number };
  // physicalVelocity: { x: number, y: number };
}
