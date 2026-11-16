// Main entry point and game loop for STARWAKE — Comet Courier.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_DELIVER, EVENT_DASH, EVENT_HIT, EVENT_OVER, EVENT_SHARD, EVENT_WAVE_CLEAR } from './world.js';
import { ACTION_CONFIRM, ACTION_DASH, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WAVE_INTRO } from './render.js';
import { stageShot } from './shots.js';
import { playDash, playDeliver, playHit, playShard, playUi, setThrust, toggleMute, unlockAudio } from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {}
}

function runShot(name) {
  const scene = stageShot(name, world);
  // Paint synchronously (twice, like two frames) so a headless capture of a fixed
  // seed always sees the finished frame, even when requestAnimationFrame is throttled.
  renderer.draw(world.state, scene.screen, scene.best);
  renderer.draw(world.state, scene.screen, scene.best);
  window.__shotReady = true;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(msg) {
    status.textContent = msg;
  }

  function startGame() {
    unlockAudio();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    playUi();
    announce('Game started. Pilot your courier ship, collect stardust near gravity wells, and deliver to the beacon.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    playHit();
    if (world.state.player.score > best) {
      best = world.state.player.score;
      saveBest(best);
    }
    announce(`Game over. Final score ${world.state.player.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions) unlockAudio();

    if (actions & ACTION_MUTE) {
      toggleMute();
    }
    if (actions & ACTION_RESTART) {
      startGame();
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      setThrust(false);
      playUi();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      playUi();
      announce('Resumed.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { thrust: false, brake: false, turnLeft: false, turnRight: false, dash: false, mouse: { x: 0, y: 0 } }, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;

    const controls = input.getControls();
    setThrust(controls.thrust);

    const events = world.step(STEP, controls, false);
    if (events & EVENT_OVER) {
      setThrust(false);
      endGame();
    } else {
      if (events & EVENT_SHARD) { playShard(); announce('Stardust shard collected.'); }
      if (events & EVENT_DELIVER) { playDeliver(); announce('Stardust delivered to beacon! Wave cleared.'); }
      if (events & EVENT_HIT) { playHit(); announce('Shield impact detected!'); }
      if (events & EVENT_DASH) { playDash(); }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = (now - last) / 1000;
    last = now;

    accumulator += Math.min(dt, MAX_FRAME);
    if (accumulator > 1.0) accumulator = 0; // Spiral guard

    handleActions();

    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      setThrust(false);
      announce('Paused due to tab visibility.');
    } else if (!document.hidden) {
      last = performance.now();
      accumulator = 0;
    }
  });

  announce('STARWAKE — Comet Courier. Press Space or Click to Start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
