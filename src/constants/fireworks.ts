export const FIREWORKS = {
  // the radius from the planet that a firework appears from
  LaunchRadius: 0.4,  // cell units
  Gravity: 1,
  ParticleCount: 100,   // number of expected particles for a density 1 explosion
  ParticleVelocity: 1,  // the maximum velocity of a particle at power 1
  ParticleSize: .1,
  ParticleDuration: 2, // the default lifetime for a duration 1 firework
  LifetimeSpeedBias: 0.6, // how much a particle's speed impacts its velocity

  // ambient fireworks are fired after the scheduled show ends
  AmbientMin: 3, // seconds
  AmbientMax: 5, // seconds

  Colors: [
    "#ff2d2d", // vivid red
    "#ff7a1a", // orange
    "#ffd21a", // golden yellow
    "#4dff4d", // bright green
    "#1affd5", // aqua / cyan
    "#3b82ff", // electric blue
    "#c04dff", // violet
    "#ff4dd2", // magenta / hot pink
  ]
}
