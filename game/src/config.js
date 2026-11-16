// Game configuration and tuning constants for STARWAKE — Comet Courier.

export const FIELD = { width: 1280, height: 720 };

export const STEP = 1 / 60;

export const PLAYER = {
  radius: 16,
  thrust: 520,
  drag: 0.982,
  maxSpeed: 600,
  dashSpeed: 1100,
  dashDuration: 0.18,
  dashCooldown: 1.2,
  invulnerableTime: 1.5,
  maxShields: 3,
};

export const WELL = {
  radius: 65,
  gravConstant: 280000,
  pullRadius: 320,
};

export const SHARD = {
  radius: 12,
  value: 100,
  quotaBase: 4,
  quotaPerWave: 2,
};

export const ASTEROID = {
  radiusMin: 18,
  radiusMax: 42,
  speedMin: 80,
  speedMax: 220,
  spawnInterval: 2.2,
  spawnIntervalScale: 0.85,
};

export const BEACON = {
  x: 640,
  y: 360,
  radius: 40,
};

export const PALETTE = {
  backdrop: '#06070a',
  starDim: 'rgba(255, 255, 255, 0.3)',
  starBright: 'rgba(200, 230, 255, 0.8)',
  player: '#00f0ff',
  playerTrail: 'rgba(0, 240, 255, 0.4)',
  dashGlow: '#ffffff',
  wellCore: '#ff00aa',
  wellGlow: 'rgba(255, 0, 170, 0.15)',
  wellRing: '#ff55cc',
  shard: '#ffd700',
  shardGlow: 'rgba(255, 215, 0, 0.6)',
  asteroid: '#ff3355',
  asteroidTrail: 'rgba(255, 51, 85, 0.25)',
  beacon: '#00ffaa',
  beaconGlow: 'rgba(0, 255, 170, 0.3)',
  panel: '#10131d',
  panelBorder: '#28324c',
  text: '#eef2f7',
  muted: '#8a99b5',
  accent: '#00f0ff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'starwake-courier.best';
