// The world simulation for STARWAKE — Comet Courier: physics, gravity wells, ship, shards, asteroids, beacon, wave progression.

import { ASTEROID, BEACON, FIELD, PLAYER, SHARD, WELL } from './config.js';

export const EVENT_SHARD = 1;
export const EVENT_DELIVER = 2;
export const EVENT_HIT = 4;
export const EVENT_WAVE_CLEAR = 8;
export const EVENT_OVER = 16;
export const EVENT_DASH = 32;

const POOL_SIZE = 48;

export function createWorld(random) {
  const wells = [
    { x: 320, y: 220, radius: WELL.radius, mass: WELL.gravConstant },
    { x: 960, y: 220, radius: WELL.radius, mass: WELL.gravConstant },
    { x: 640, y: 560, radius: WELL.radius, mass: WELL.gravConstant * 1.2 },
  ];

  const player = {
    x: BEACON.x,
    y: BEACON.y + 120,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    shields: PLAYER.maxShields,
    dashCooldown: 0,
    dashTimer: 0,
    invulnerable: 0,
    score: 0,
  };

  const items = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    items.push({ active: false, kind: 'shard', x: 0, y: 0, vx: 0, vy: 0, radius: 0, value: 0 });
  }

  const state = {
    player,
    wells,
    items,
    beacon: { x: BEACON.x, y: BEACON.y, radius: BEACON.radius, pulse: 0 },
    wave: 1,
    quota: SHARD.quotaBase,
    collected: 0,
    asteroidTimer: 0,
    waveTimer: 0,
    screenShake: 0,
  };

  function reset() {
    player.x = BEACON.x;
    player.y = BEACON.y + 120;
    player.vx = 0;
    player.vy = 0;
    player.angle = -Math.PI / 2;
    player.shields = PLAYER.maxShields;
    player.dashCooldown = 0;
    player.dashTimer = 0;
    player.invulnerable = 0;
    player.score = 0;
    state.wave = 1;
    state.quota = SHARD.quotaBase;
    state.collected = 0;
    state.asteroidTimer = 1.0;
    state.waveTimer = 0;
    state.screenShake = 0;
    for (const item of items) item.active = false;
    spawnInitialShards();
  }

  function freeItem() {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].active) return items[i];
    }
    return null;
  }

  function spawnShard(well) {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = 'shard';
    const angle = random() * Math.PI * 2;
    const dist = well.radius + 30 + random() * 50;
    item.x = well.x + Math.cos(angle) * dist;
    item.y = well.y + Math.sin(angle) * dist;
    item.vx = (random() - 0.5) * 40;
    item.vy = (random() - 0.5) * 40;
    item.radius = SHARD.radius;
    item.value = SHARD.value;
  }

  function spawnInitialShards() {
    for (let i = 0; i < state.quota; i++) {
      const well = wells[Math.floor(random() * wells.length)];
      spawnShard(well);
    }
  }

  function spawnAsteroid() {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = 'asteroid';
    item.radius = ASTEROID.radiusMin + random() * (ASTEROID.radiusMax - ASTEROID.radiusMin);
    
    // Spawn from edge
    const side = Math.floor(random() * 4);
    if (side === 0) { item.x = -item.radius; item.y = random() * FIELD.height; }
    else if (side === 1) { item.x = FIELD.width + item.radius; item.y = random() * FIELD.height; }
    else if (side === 2) { item.x = random() * FIELD.width; item.y = -item.radius; }
    else { item.x = random() * FIELD.width; item.y = FIELD.height + item.radius; }

    const targetX = FIELD.width / 2 + (random() - 0.5) * 400;
    const targetY = FIELD.height / 2 + (random() - 0.5) * 400;
    const angle = Math.atan2(targetY - item.y, targetX - item.x);
    const speed = (ASTEROID.speedMin + random() * (ASTEROID.speedMax - ASTEROID.speedMin)) * (1 + (state.wave - 1) * 0.1);
    item.vx = Math.cos(angle) * speed;
    item.vy = Math.sin(angle) * speed;
  }

  function nextWave() {
    state.wave += 1;
    state.quota = SHARD.quotaBase + (state.wave - 1) * SHARD.quotaPerWave;
    state.collected = 0;
    for (const item of items) {
      if (item.active && item.kind === 'shard') item.active = false;
    }
    for (let i = 0; i < state.quota; i++) {
      const well = wells[Math.floor(random() * wells.length)];
      spawnShard(well);
    }
  }

  function step(dt, controls, harmless) {
    let events = 0;
    state.waveTimer += dt;
    if (state.screenShake > 0) {
      state.screenShake = Math.max(0, state.screenShake - dt * 4);
    }

    // Timers
    if (player.dashCooldown > 0) player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    if (player.dashTimer > 0) player.dashTimer = Math.max(0, player.dashTimer - dt);
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);

    state.beacon.pulse = (state.beacon.pulse + dt * 3) % (Math.PI * 2);

    // Player steering & movement
    if (!harmless) {
      // Aiming towards mouse or keyboard turn
      const dx = controls.mouse.x - (FIELD.width / 2); // simplified or direct world coords if needed
      const dy = controls.mouse.y - (FIELD.height / 2);
      if (controls.turnLeft) player.angle -= 3.5 * dt;
      if (controls.turnRight) player.angle += 3.5 * dt;
      else if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        // Can also smoothly look towards mouse if desired, but keyboard rotation / mouse heading works well together
      }

      if (controls.dash && player.dashCooldown === 0 && player.dashTimer === 0) {
        player.dashTimer = PLAYER.dashDuration;
        player.dashCooldown = PLAYER.dashCooldown;
        player.vx = Math.cos(player.angle) * PLAYER.dashSpeed;
        player.vy = Math.sin(player.angle) * PLAYER.dashSpeed;
        player.invulnerable = Math.max(player.invulnerable, PLAYER.dashDuration + 0.2);
        events |= EVENT_DASH;
      }

      if (player.dashTimer === 0) {
        if (controls.thrust) {
          player.vx += Math.cos(player.angle) * PLAYER.thrust * dt;
          player.vy += Math.sin(player.angle) * PLAYER.thrust * dt;
        }
        if (controls.brake) {
          player.vx *= Math.max(0, 1 - 4 * dt);
          player.vy *= Math.max(0, 1 - 4 * dt);
        }
        player.vx *= PLAYER.drag;
        player.vy *= PLAYER.drag;

        // Speed limit
        const speed = Math.hypot(player.vx, player.vy);
        if (speed > PLAYER.maxSpeed) {
          player.vx = (player.vx / speed) * PLAYER.maxSpeed;
          player.vy = (player.vy / speed) * PLAYER.maxSpeed;
        }
      }
    }

    // Gravity well forces on player
    for (const well of wells) {
      const wx = well.x - player.x;
      const wy = well.y - player.y;
      const distSq = wx * wx + wy * wy;
      const dist = Math.sqrt(distSq);

      if (dist < well.radius) {
        // Fell into gravity well!
        if (!harmless && player.invulnerable === 0) {
          player.shields -= 1;
          player.invulnerable = PLAYER.invulnerableTime;
          state.screenShake = 0.5;
          events |= EVENT_HIT;
          // Bounce away
          player.vx = -player.vx * 0.8 + (player.x - well.x) * 5;
          player.vy = -player.vy * 0.8 + (player.y - well.y) * 5;
          if (player.shields <= 0) {
            events |= EVENT_OVER;
          }
        }
      } else if (dist < WELL.pullRadius) {
        const force = well.mass / (distSq + 10000);
        player.vx += (wx / dist) * force * dt;
        player.vy += (wy / dist) * force * dt;
      }
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Screen bounds bounce / wrap
    if (player.x < PLAYER.radius) { player.x = PLAYER.radius; player.vx *= -0.5; }
    if (player.x > FIELD.width - PLAYER.radius) { player.x = FIELD.width - PLAYER.radius; player.vx *= -0.5; }
    if (player.y < PLAYER.radius) { player.y = PLAYER.radius; player.vy *= -0.5; }
    if (player.y > FIELD.height - PLAYER.radius) { player.y = FIELD.height - PLAYER.radius; player.vy *= -0.5; }

    // Spawn asteroids
    if (!harmless) {
      state.asteroidTimer -= dt;
      if (state.asteroidTimer <= 0) {
        spawnAsteroid();
        state.asteroidTimer = Math.max(0.6, ASTEROID.spawnInterval * (ASTEROID.spawnIntervalScale ** (state.wave - 1)));
      }
    }

    // Update items (shards and asteroids)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;

      // Gravity on items too
      for (const well of wells) {
        const wx = well.x - item.x;
        const wy = well.y - item.y;
        const distSq = wx * wx + wy * wy;
        const dist = Math.sqrt(distSq);
        if (dist < well.radius) {
          item.active = false; // destroyed in well
          break;
        } else if (dist < WELL.pullRadius) {
          const force = (well.mass * 0.5) / (distSq + 10000);
          item.vx += (wx / dist) * force * dt;
          item.vy += (wy / dist) * force * dt;
        }
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      // Out of bounds cleanup
      if (item.x < -100 || item.x > FIELD.width + 100 || item.y < -100 || item.y > FIELD.height + 100) {
        item.active = false;
        continue;
      }

      if (harmless) continue;

      // Collision with player
      const pDist = Math.hypot(item.x - player.x, item.y - player.y);
      if (pDist < item.radius + PLAYER.radius) {
        if (item.kind === 'shard') {
          item.active = false;
          state.collected += 1;
          player.score += SHARD.value;
          events |= EVENT_SHARD;
        } else if (item.kind === 'asteroid' && player.invulnerable === 0) {
          item.active = false;
          player.shields -= 1;
          player.invulnerable = PLAYER.invulnerableTime;
          state.screenShake = 0.6;
          events |= EVENT_HIT;
          if (player.shields <= 0) {
            events |= EVENT_OVER;
          }
        }
      }
    }

    // Check beacon delivery
    if (!harmless && state.collected >= state.quota) {
      const bDist = Math.hypot(player.x - state.beacon.x, player.y - state.beacon.y);
      if (bDist < state.beacon.radius + PLAYER.radius) {
        events |= EVENT_DELIVER;
        events |= EVENT_WAVE_CLEAR;
        player.score += state.wave * 500;
        nextWave();
      }
    }

    return events;
  }

  reset();
  return { state, reset, step };
}
