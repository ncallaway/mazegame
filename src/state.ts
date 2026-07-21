import { Maze, MazeAddress } from "./maze";

export type MazeState = {
  maze: Maze;
  targetPosition: MazeAddress | undefined;
  playerPosition: MazeAddress;
  physicalPosition: { x: number, y: number }; // 0..1 within a cell
  physicalVelocity: { x: number, y: number }; // in "cells per second"
}
