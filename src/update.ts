import { InputAction } from "./input";
import { addrEqual, computePath, connected, MazeAddress } from "./maze";
import { GameState, MazeState } from "./state";
import {
  SHIP_MAX_ROTATIONAL_ACCELERATION,
  SHIP_TARGET_ROTATIONAL_VELOCITY,
  SHIP_BRAKE_SAFETY,
  SHIP_ORIENTATION_SNAP_EPSILON,
  SHIP_ROTATIONAL_VELOCITY_SNAP_EPSILON,
  SHIP_MAX_LINEAR_ACCELERATION,
  SHIP_TARGET_LINEAR_VELOCITY,
  SHIP_LINEAR_BRAKE_SAFETY,
  SHIP_POSITION_SNAP_EPSILON,
  SHIP_LINEAR_VELOCITY_SNAP_EPSILON,
  SHIP_THRUST_ALIGNMENT,
} from './constants/ship';

import { vec2 } from "gl-matrix";
import { vector } from "./utility/vector";
import { startCelebration, stopCelebration, updateCelebration } from "./celebration";

export const update = (s: GameState, action: InputAction, dt: number, now: number) => {
  const m = s.maze;

  // Once the level is won, freeze input: the ship keeps settling but accepts no
  // new moves.
  if (m.won === undefined) {
    inputUpdate(m, action, now);
  }
  syncPath(m);
  updateCelebration(dt, now);

  orientShip(m, dt);
  moveShip(m, dt);

  // check win condition:
  if (m.won === undefined && addrEqual(m.playerPosition, m.maze.end)) {
    startCelebration(m.maze.end, now);
    m.won = now;
  } else if (!m.won) {
    stopCelebration();
  }
}

const inputUpdate = (s: MazeState, action: InputAction, now: number) => {
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

  if (moved && !s.targetMoved) {
    s.targetMoved = now;
  }

  if (addrEqual(s.targetPosition, s.maze.end) && !s.playerCaughtTarget) {
    s.targetSafe = true;
  } else if (addrEqual(s.targetPosition, s.playerPosition) && !s.targetSafe) {
    s.playerCaughtTarget = true;
  }
}

const orientShip = (s: MazeState, dt: number) => {
  const desiredOrientation = idealFacingDirection(s);

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

  const maxDelta = SHIP_MAX_ROTATIONAL_ACCELERATION * dt;
  s.playerRotationalVelocity += clamp(targetVel - s.playerRotationalVelocity, -maxDelta, maxDelta);
  s.playerOrientation = wrapAngle(s.playerOrientation + s.playerRotationalVelocity * dt);
};

const moveShip = (s: MazeState, dt: number) => {
  if (dt < 0) { dt = 0; };
  // Snap-and-settle: once we're in the target cell, basically on its center, and
  // barely moving, lock exactly onto the center with zero velocity.
  if (s.targetPosition && addrEqual(s.playerPosition, s.targetPosition)) {
    const dx = 0.5 - s.physicalPosition.x;
    const dy = 0.5 - s.physicalPosition.y;
    const speedSq = s.physicalVelocity.x ** 2 + s.physicalVelocity.y ** 2;
    if (
      dx * dx + dy * dy < SHIP_POSITION_SNAP_EPSILON ** 2 &&
      speedSq < SHIP_LINEAR_VELOCITY_SNAP_EPSILON ** 2
    ) {
      s.physicalPosition = { x: 0.5, y: 0.5 };
      s.physicalVelocity = { x: 0, y: 0 };
      return;
    }
  }

  const worldPos = vector.fromMazeAddress(s.playerPosition, s.physicalPosition.x, s.physicalPosition.y); 
  const vel = vec2.fromValues(s.physicalVelocity.x, s.physicalVelocity.y);
  const targetVel = idealLinearVelocity(s, worldPos);

  // Slew actual velocity toward the target, capping the change *magnitude* by max accel.
  const maxDelta = SHIP_MAX_LINEAR_ACCELERATION * dt;
  const dv = vec2.sub(vec2.create(), targetVel, vel);
  const dvLen = vec2.len(dv);
  if (dvLen > maxDelta) {
    vec2.scale(dv, dv, maxDelta / dvLen);
  }
  vec2.add(vel, vel, dv);

  // Integrate position.
  vec2.scaleAndAdd(worldPos, worldPos, vel, dt);
  s.physicalVelocity = { x: vel[0], y: vel[1] };

  // Re-derive the cell + fractional position; re-sync the path if the cell changed.
  const newCol = Math.floor(worldPos[0]);
  const newRow = Math.floor(worldPos[1]);

  const newAddr: MazeAddress = { row: newRow, col: newCol };
  s.physicalPosition = { x: worldPos[0] - newCol, y: worldPos[1] - newRow };
  if (newCol !== s.playerPosition.col || newRow !== s.playerPosition.row) {
    if (connected(s.playerPosition, newAddr, s.maze)) {

      s.playerPosition = newAddr;
      if (addrEqual(s.playerPosition, s.targetPosition) && s.targetMoved && !s.targetSafe) {
        s.playerCaughtTarget = true;
      }
      syncPath(s);
    }
  }

};

const idealLinearVelocity = (s: MazeState, worldPos: vec2): vec2 => {
  const zero = vec2.fromValues(0, 0);
  if (!s.path || s.path.length === 0) {
    return zero; // no target → coast to a stop
  }

  // Steer toward the next cell (or the target cell itself once we're in it).
  const waypoint = vector.fromMazeAddress(s.path[1] ?? s.path[0]);
  const toWaypoint = vec2.sub(vec2.create(), waypoint, worldPos);
  const distToWaypoint = vec2.len(toWaypoint);
  if (distToWaypoint < 1e-6) {
    return zero;
  }

  // Remaining arc length to the FINAL target center; grid segments are unit length.
  const remaining = distToWaypoint + Math.max(0, s.path.length - 2);
  const dir = vec2.scale(vec2.create(), toWaypoint, 1 / distToWaypoint);

  // Brake-limited cruise speed, planning against SHIP_LINEAR_BRAKE_SAFETY of max accel.
  const brakeSpeed = Math.sqrt(2 * SHIP_MAX_LINEAR_ACCELERATION * SHIP_LINEAR_BRAKE_SAFETY * remaining);
  let speed = Math.min(SHIP_TARGET_LINEAR_VELOCITY, brakeSpeed);

  // Alignment gate: ramp thrust 0 -> full as the nose nears the desired heading,
  // so we start accelerating before the turn is fully complete (gas-pedal feel).
  const headingError = Math.abs(wrapAngle(vector.toOrientation(dir) - s.playerOrientation));
  const gate = clamp((SHIP_THRUST_ALIGNMENT - headingError) / SHIP_THRUST_ALIGNMENT, 0, 1);
  speed *= gate;

  return vec2.scale(vec2.create(), dir, speed);
};

const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

const clamp = (x: number, lo: number, hi: number): number => Math.min(Math.max(x, lo), hi);

const idealRotationalVelocity = (desiredOrientation: number | undefined, s: MazeState): number => {
  if (desiredOrientation === undefined) {
    return 0; // no target heading → aim to stop spinninvector.toOrientation
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
      return vector.toOrientation(velocity);
    }
    return undefined;
  }
  
  const next = vector.fromMazeAddress(s.path[1]);
  const current = vector.fromMazeAddress(s.playerPosition, s.physicalPosition);

  const delta = vec2.sub(vec2.create(), next, current);

  return vector.toOrientation(delta);

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
