import { vec2 } from "gl-matrix";
import { MazeAddress } from "./maze";
import { vector } from "./utility/vector";
import { FIREWORKS } from "./constants/fireworks";

type CelebrationState = {
  // when was the celebration started. undefined means the celebration is not running
  started: number | undefined;
  at: MazeAddress | undefined;

  scheduled: Firework[];
  fireworks: FireworkState[];
  particles: ParticleState[];
}

type FireworkState = {
  firework: Firework;
  position: vec2;
  velocity: vec2;
}

type Firework = {
  at: number; // when should the firework be launched
  direction: number; // angle in radians
  height: number; // explosion height
  color: number; // index into color arary
  
  power: number; // how "powerful" the explosion is
  density: number; // how "dense" the explosion is, how many particles should be created
  duration: number; // how quickly the particles fade
}

type ParticleState = {
  position: vec2;
  velocity: vec2;

  color: number; // index into color array
  size: number; // how "big" the particle should be
  at: number; // when was the particle created
  lifetime: number; // how long should the particle live before being culled
}

const state: CelebrationState = {
  started: undefined,
  at: undefined,

  fireworks: [],
  particles: [],
  scheduled: [],
}

const COLORS = [
  "#ff2d2d", // vivid red
  "#ff7a1a", // orange
  "#ffd21a", // golden yellow
  "#4dff4d", // bright green
  "#1affd5", // aqua / cyan
  "#3b82ff", // electric blue
  "#c04dff", // violet
  "#ff4dd2", // magenta / hot pink
];

export const startCelebration = (at: MazeAddress, now: number) => {
  state.started = now;
  state.at = at;

  scheduleShow(now);
}

const scheduleShow = (now: number, duration = 15) => {
  const times: number[] = [];

  // opening burst: a few shells crammed into the first ~0.3s
  const opening = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < opening; i++) {
    times.push(Math.random() * 0.3);
  }

  // damped-sinusodal launch rate (launches/sec)
  const peakRate = 6;
  const tau = duration / 3;        
  const wavelength = 2 + Math.random() * 4; 
  const omega = (2 * Math.PI) / wavelength;
  const rate = (t: number) =>
    peakRate * Math.exp(-t / tau) * (0.55 + 0.45 * Math.cos(omega * t));

  // poisson w/ thinning usnig the above rate
  let t = 0.4; // pick up after the opening burst
  while (t < duration) {
    t += -Math.log(1 - Math.random()) / peakRate;
    if (t < duration && Math.random() < rate(t) / peakRate) {
      times.push(t);
    }
  }

  for (const dt of times) {
    state.scheduled.push(randomFirework(now + dt));
  }
}

const scheduleAmbient = (now: number) => {
  if (state.scheduled.length > 0) { return; }
  const delay = FIREWORKS.AmbientMin + Math.random() * (FIREWORKS.AmbientMax - FIREWORKS.AmbientMin);
  state.scheduled.push(randomFirework(now + delay));
}

const randomFirework = (at: number): Firework => {
  const powden = Math.random() * .4 + .8;
  return {
    at,
    direction: Math.random() * Math.PI * 2,
    height: .25 + Math.random() * 0.5,
    color: Math.floor(Math.random() * COLORS.length),
    power: powden,
    density: powden,
    duration: 1
  }

}

export const updateCelebration = (dt: number, now: number) => {
  if (!state.started || !state.at) { return; }

  launchFireworks(now);
  scheduleAmbient(now);
  explodeFireworks(now);
  updateFireworks(dt);
  updateParticles(dt);
  removeStale(now);
}

const launchFireworks = (now: number) => {
  for (let idx = 0; idx < state.scheduled.length; idx++) {
    const f = state.scheduled[idx];
    if (now > f.at) {
      // launch it!
      state.fireworks.push({
        position: launchPosition(f),
        velocity: launchVelocity(f),
        firework: f
      });
      state.scheduled.splice(idx, 1);
      idx -= 1;
    }
  }
}

const explodeFireworks = (now: number) => {
  const c = earth();
  for (let idx = 0; idx < state.fireworks.length; idx++) {
    const f = state.fireworks[idx];
    const g = vec2.sub(vec2.create(), c, f.position);

    if (vec2.dot(g, f.velocity) >= 0) {
      // explode!
      const count = Math.pow(Math.random(), 0.35) * FIREWORKS.ParticleCount * f.firework.density;
      for (let i = 0; i < count; i++) {
        launchParticle(f, now);
      }
 
      state.fireworks.splice(idx, 1);
      idx--;
    }
  }
}

// Empirically-measured mean of the normalized particle speed (Monte Carlo over
// the velocity distribution below). Used to center the lifetime speed-bias so it
// doesn't shift the average lifetime. Re-measure if the velocity model changes.
const SPEED_FRAC_MEAN = 0.454;

const launchParticle = (f: FireworkState, now: number) => {
  // chose a random direction
  const angle = Math.random() * 2 * Math.PI;
  const dir = vector.fromOrientation(angle);

  const up = vector.fromOrientation(f.firework.direction); 
  const speed = Math.pow(Math.random(), 0.75) * FIREWORKS.ParticleVelocity * f.firework.power
  const velocity = vec2.scale(vec2.create(), dir, speed);
  vec2.scale(up, up, Math.pow(Math.random(), 0.35) * FIREWORKS.ParticleVelocity);
  vec2.add(velocity, velocity, up);

  const size = Math.pow(Math.random(), 0.5) * FIREWORKS.ParticleSize;

  // Bias lifetime by speed: faster particles tend to live longer. Normalize the
  // speed to ~[0,1] and build a factor centered on the mean normalized speed so
  // E[factor] = 1 and the average lifetime is unchanged.
  const maxSpeed = FIREWORKS.ParticleVelocity * (f.firework.power + 1);
  const speedFrac = Math.min(1, vec2.len(velocity) / maxSpeed);
  const speedFactor = Math.max(0.2, 1 + FIREWORKS.LifetimeSpeedBias * (speedFrac - SPEED_FRAC_MEAN));
  const lifetime = Math.pow(Math.random(), 0.5) * FIREWORKS.ParticleDuration * f.firework.duration * speedFactor;

  state.particles.push({
    position: vec2.clone(f.position),
    velocity: vec2.add(velocity, velocity, f.velocity),
    color: f.firework.color,
    at: now,
    lifetime,
    size
  });
}

const updateFireworks = (dt: number) => {
  const c = earth();
  for (let idx = 0; idx < state.fireworks.length; idx++) {
    const f = state.fireworks[idx];

    // integrate velocity
    const g = vec2.sub(vec2.create(), c, f.position);
    vec2.normalize(g, g);
    const dv = vec2.scale(vec2.create(), g, FIREWORKS.Gravity * dt);
    vec2.add(f.velocity, f.velocity, dv);

    // integrate position
    const delta = vec2.scale(vec2.create(), f.velocity, dt);
    vec2.add(f.position, f.position, delta);
  }
}

const updateParticles = (dt: number) => {
  const c = earth();
  for (let idx = 0; idx < state.particles.length; idx++) {
    const p = state.particles[idx];

    // integrate velocity
    const g = vec2.sub(vec2.create(), c, p.position);
    vec2.normalize(g, g);
    const dv = vec2.scale(vec2.create(), g, FIREWORKS.Gravity * dt);
    vec2.add(p.velocity, p.velocity, dv);

    // integrate position
    const delta = vec2.scale(vec2.create(), p.velocity, dt);
    vec2.add(p.position, p.position, delta);
  }
}

const removeStale = (now: number) => {
  for (let idx = 0; idx < state.particles.length; idx++) {
    const p = state.particles[idx];

    if (now > p.at + p.lifetime) {
      state.particles.splice(idx, 1);
      idx--;
    }
  }
}

const launchPosition = (f: Firework): vec2 => {
  const c = earth();
  const dir = vector.fromOrientation(f.direction);
  const delta = vec2.scale(vec2.create(), dir, FIREWORKS.LaunchRadius);
  return vec2.add(vec2.create(), c, delta);
}

const launchVelocity = (f: Firework): vec2 => {
  const dir = vec2.fromValues(Math.cos(f.direction), Math.sin(f.direction));
  const speed = Math.sqrt(2 * FIREWORKS.Gravity * f.height);
  return vec2.scale(vec2.create(), dir, speed);
}

const earth = (): vec2 => vector.fromMazeAddress(state.at!);

export const stopCelebration = () => {
  state.started = undefined;
  state.at = undefined;
  state.scheduled = [];
  state.fireworks = [];
  state.particles = [];
}

export const renderCelebration = (
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  cellSize: number,
  now: number,
) => {
  if (state.fireworks.length === 0 && state.particles.length === 0) { return; }

  const pixelX = (worldX: number) => originX + worldX * cellSize;
  const pixelY = (worldY: number) => originY + worldY * cellSize;

  ctx.save();

  // mortar shells
  const shellSize = 0.06 * cellSize;
  ctx.fillStyle = "#888888";
  for (const f of state.fireworks) {
    const px = pixelX(f.position[0]);
    const py = pixelY(f.position[1]);
    ctx.fillRect(px - shellSize / 2, py - shellSize / 2, shellSize, shellSize);
  }

  // particles
  for (const p of state.particles) {
    let t = (now - p.at) / p.lifetime;
    t = Math.pow(t, .8);
    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - t));
    ctx.fillStyle = COLORS[p.color] ?? "#ffffff";
    const s = p.size * cellSize;
    const px = pixelX(p.position[0]);
    const py = pixelY(p.position[1]);
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
  }

  ctx.restore();
}

