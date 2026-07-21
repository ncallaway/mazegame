import { InputAction } from "./input";
import { addrEqual, computePath, connected, MazeAddress } from "./maze";
import { MazeState } from "./state";
import {
  SHIP_MAX_ROTATIONAL_ACCELERATION,
  SHIP_TARGET_ROTATIONAL_VELOCITY,
  SHIP_BRAKE_SAFETY,
  SHIP_ORIENTATION_SNAP_EPSILON,
  SHIP_ROTATIONAL_VELOCITY_SNAP_EPSILON,
} from './constants/ship';

import { vec2 } from "gl-matrix";

export const update = (s: MazeState, action: InputAction, dt: number) => {
  inputUpdate(s, action);
  syncPath(s);

  orientShip(s, dt);
}

const inputUpdate = (s: MazeState, action: InputAction) => {
  let moved = false;

  if (!moved && action.discrete.x !== undefined && action.discrete.x != 0) {
    const current = s.targetPosition ?? s.playerPosition;
    const next = { row: current.row, col: current.col + action.discrete.x };
    if (connected(current, next, s.maze)) {
      s.targetPosition = next;
      moved = true;
    }
  }

  if (!moved && action.discrete.y !== undefined && action.discrete.y != 0) {
    const current = s.targetPosition ?? s.playerPosition;
    const next = { row: current.row + action.discrete.y, col: current.col};
    if (connected(current, next, s.maze)) {
      s.targetPosition = next;
      moved = true;
    }
  }
}

const orientShip = (s: MazeState, dt: number) => {
  const desiredOrientation = idealFacingDirection(s);

  // Snap-and-settle: once we're basically on the target heading and barely
  // spinning, lock exactly onto it with zero velocity. Kills the last-frame
  // overshoot/jitter that gets worse as the turn speed increases.
  if (desiredOrientation !== undefined) {
    const error = wrapAngle(desiredOrientation - s.playerOrientation);
    if (
      Math.abs(error) < SHIP_ORIENTATION_SNAP_EPSILON &&
      Math.abs(s.playerRotationalVelocity) < SHIP_ROTATIONAL_VELOCITY_SNAP_EPSILON
    ) {
      s.playerOrientation = desiredOrientation;
      s.playerRotationalVelocity = 0;
      return;
    }
  }

  const targetVel = idealRotationalVelocity(desiredOrientation, s);

  // Stage 2: slew actual angular velocity toward the target, capped by max accel.
  const maxDelta = SHIP_MAX_ROTATIONAL_ACCELERATION * dt;
  s.playerRotationalVelocity += clamp(targetVel - s.playerRotationalVelocity, -maxDelta, maxDelta);

  // Integrate orientation.
  s.playerOrientation = wrapAngle(s.playerOrientation + s.playerRotationalVelocity * dt);
};

const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

const clamp = (x: number, lo: number, hi: number): number => Math.min(Math.max(x, lo), hi);

const idealRotationalVelocity = (desiredOrientation: number | undefined, s: MazeState): number => {
  if (desiredOrientation === undefined) {
    return 0; // no target heading → aim to stop spinning
  }

  const error = wrapAngle(desiredOrientation - s.playerOrientation);

  // Fastest we can spin and still brake to 0 within `error`, planning as if we
  // had only SHIP_BRAKE_SAFETY of the real max accel so we brake slightly early.
  const brakeSpeed = Math.sqrt(2 * SHIP_MAX_ROTATIONAL_ACCELERATION * SHIP_BRAKE_SAFETY * Math.abs(error));
  const speed = Math.min(SHIP_TARGET_ROTATIONAL_VELOCITY, brakeSpeed);

  return Math.sign(error) * speed;
};

const idealFacingDirection = (s: MazeState): number | undefined => {
  if (!s.path || !s.path[1]) {
    const velocity = vec2.fromValues(s.physicalVelocity.x, s.physicalVelocity.y);
    if (vec2.sqrLen(velocity) > 0.1) {
      return orientationFromVec2(velocity);
    }
    return undefined;
  }
  
  const next = mazeAddressVec2(s.path[1]);
  const current = mazeAddressVec2(s.playerPosition, s.physicalPosition.x, s.physicalPosition.y);

  const delta = vec2.sub(vec2.create(), next, current);

  return orientationFromVec2(delta);

}

const orientationFromVec2 = (vec: vec2): number => {
  return Math.atan2(vec[1], vec[0]);
}

const mazeAddressVec2 = (address: MazeAddress, x: number = 0.5, y: number = 0.5): vec2 => {
  return vec2.fromValues(address.col + x, address.row + y);
}

const syncPath = (s: MazeState) => {
  if (s.targetPosition === undefined) {
    s.path = undefined;
    return;
  }

  const p = s.path;
  const fresh =
    p !== undefined &&
    p.length > 0 &&
    addrEqual(p[0], s.playerPosition) &&
    addrEqual(p[p.length - 1], s.targetPosition);
  if (fresh) { return; }

  s.path = computePath(s.maze, s.playerPosition, s.targetPosition);
};
