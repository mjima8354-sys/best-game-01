// Screenshot staging for ?shot=start|play|end with autopilot.

import { FIELD, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 18;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

function autopilot(state) {
  const player = state.player;
  // Find nearest shard or beacon if quota met
  let target = null;
  if (state.collected >= state.quota) {
    target = state.beacon;
  } else {
    for (const item of state.items) {
      if (item.active && item.kind === 'shard') {
        if (!target || Math.hypot(item.x - player.x, item.y - player.y) < Math.hypot(target.x - player.x, target.y - player.y)) {
          target = item;
        }
      }
    }
    if (!target) target = state.beacon;
  }

  const angleToTarget = Math.atan2(target.y - player.y, target.x - player.x);
  const angleDiff = angleToTarget - player.angle;
  // normalize angle diff
  const normDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

  let turnLeft = normDiff < -0.1;
  let turnRight = normDiff > 0.1;
  let thrust = Math.abs(normDiff) < 0.8;
  let brake = false;
  let dash = false;

  // Avoid gravity wells if too close
  for (const well of state.wells) {
    const dist = Math.hypot(well.x - player.x, well.y - player.y);
    if (dist < well.radius + 60) {
      thrust = false;
      brake = true;
      if (dist < well.radius + 20) dash = true;
    }
  }

  return { thrust, brake, turnLeft, turnRight, dash, mouse: { x: target.x, y: target.y, down: false } };
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i++) world.step(STEP, { thrust: false, brake: false, turnLeft: false, turnRight: false, dash: false, mouse: { x: 0, y: 0, down: false } }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let i = 0; i < limit / STEP; i++) {
    const controls = autopilot(world.state);
    const events = world.step(STEP, controls, false);
    if (events & EVENT_OVER) break;
  }
  const over = world.state.player.shields <= 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.player.score };
}
