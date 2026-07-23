import { vec2 } from "gl-matrix";
import { MazeAddress } from "../maze";


type Point = { x: number; y: number };

type FromMazeAddress = {
  (address: MazeAddress, x?: number, y?: number): vec2;
  (address: MazeAddress, point: Point): vec2;
};

export const fromMazeAddress: FromMazeAddress = (
  address: MazeAddress,
  x: number | Point = 0.5,
  y: number = 0.5,
): vec2 => {
  if (typeof x === "object") {
    return vec2.fromValues(address.col + x.x, address.row + x.y);
  }
  return vec2.fromValues(address.col + x, address.row + y);
};

const toOrientation = (vec: vec2): number => {
  return Math.atan2(vec[1], vec[0]);
}

const fromOrientation = (angle: number): vec2 => {
  return vec2.fromValues(Math.cos(angle), Math.sin(angle));
}

export const vector = {
  fromMazeAddress,
  toOrientation,
  fromOrientation
}
