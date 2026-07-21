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


