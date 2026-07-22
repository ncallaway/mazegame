// Desired rotational velocity during the 'cruise' phase of a turn
export const SHIP_TARGET_ROTATIONAL_VELOCITY = 16.0; // rad/s

// Maximum rotational acceleration for the rocketship
export const SHIP_MAX_ROTATIONAL_ACCELERATION = 60.0; // rad/s^2

// Braking safety margin (0..1). We plan the brake as if we only had this
// fraction of the real max acceleration
export const SHIP_BRAKE_SAFETY = 0.9; // unitless

// Rotational Snap-and-settle dead zone.
export const SHIP_ORIENTATION_SNAP_EPSILON = 0.03; // rad
export const SHIP_ROTATIONAL_VELOCITY_SNAP_EPSILON = 0.5; // rad/s

// Cruise speed the ship targets along open stretches of path
export const SHIP_TARGET_LINEAR_VELOCITY = 4.0; // cells/s

// Maximum linear acceleration for the rocketship
export const SHIP_MAX_LINEAR_ACCELERATION = 12.0; // cells/s^2

// Linear braking safety margin (0..1), same idea as SHIP_BRAKE_SAFETY.
export const SHIP_LINEAR_BRAKE_SAFETY = 0.9; // unitless

// Positional Snap-and-settle dead zone (applied at the final target).
export const SHIP_POSITION_SNAP_EPSILON = 0.02; // cells
export const SHIP_LINEAR_VELOCITY_SNAP_EPSILON = 0.3; // cells/s

// How aligned the nose must be with the desired heading before the ship starts
// accelerating: thrust ramps 0 -> full as the heading error shrinks from this
// angle to 0. Larger = start thrusting earlier / more overlap with the turn.
export const SHIP_THRUST_ALIGNMENT = Math.PI / 2; // rad (start within 90 deg)


