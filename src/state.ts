import { Maze, MazeAddress } from "./maze";

export type MazeState = {
  maze: Maze;
  targetPosition: MazeAddress | undefined;
  playerPosition: MazeAddress;
  playerOrientation: number; // radians
  playerRotationalVelocity: number; // radians per second
  physicalPosition: { x: number, y: number }; // 0..1 within a cell
  physicalVelocity: { x: number, y: number }; // in "cells per second"
  path: MazeAddress[] | undefined; // player cell -> target cell (inclusive); undefined when no target
}
