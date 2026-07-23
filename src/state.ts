import { Maze, MazeAddress } from "./maze";

export type GameState = {
  level: number;
  maze: MazeState
}

export type MazeState = {
  maze: Maze;
  started: number; // time the level started
  targetMoved: number | undefined; // time the cursor moved
  playerCaughtTarget: boolean;
  targetSafe: boolean;
  targetPosition: MazeAddress | undefined;
  playerPosition: MazeAddress;
  playerOrientation: number; // radians
  playerRotationalVelocity: number; // radians per second
  physicalPosition: { x: number, y: number }; // 0..1 within a cell
  physicalVelocity: { x: number, y: number }; // in "cells per second"
  path: MazeAddress[] | undefined; // player cell -> target cell (inclusive); undefined when no target
  won: number | undefined; // the time when the player won the maze
}
