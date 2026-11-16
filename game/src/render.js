// Drawing module for STARWAKE — Comet Courier: starfield, gravity wells, ship, asteroids, shards, beacon, HUD, and panels.

import { FIELD, FONT, PALETTE, PLAYER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WAVE_INTRO = 'wave_intro';
export const SCREEN_WAVE_CLEAR = 'wave_clear';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 120, line: 36, bottom: 60 };

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  // Pre-generate background stars for determinism/performance
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: (i * 137.5) % FIELD.width,
      y: (i * 241.3) % FIELD.height,
      size: (i % 3) * 0.6 + 0.8,
      brightness: (i % 5 === 0) ? 0.9 : 0.4,
    });
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawBackground(state) {
    context.fillStyle = '#06070a';
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    // Stars
    for (const star of stars) {
      context.fillStyle = star.brightness > 0.5 ? 'rgba(200, 230, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
      context.fillRect(star.x, star.y, star.size, star.size);
    }

    // Gravity wells
    for (const well of state.wells) {
      const grad = context.createRadialGradient(well.x, well.y, well.radius * 0.2, well.x, well.y, 320);
      grad.addColorStop(0, 'rgba(255, 0, 170, 0.35)');
      grad.addColorStop(0.5, 'rgba(100, 0, 100, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = grad;
      context.beginPath();
      context.arc(well.x, well.y, 320, 0, Math.PI * 2);
      context.fill();

      // Well core
      context.fillStyle = '#ff00aa';
      context.beginPath();
      context.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
      context.fill();

      // Swirling rings
      context.strokeStyle = '#ff55cc';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(well.x, well.y, well.radius + 12, 0, Math.PI * 2);
      context.stroke();
    }

    // Beacon / gate
    const beacon = state.beacon;
    const bGrad = context.createRadialGradient(beacon.x, beacon.y, 5, beacon.x, beacon.y, beacon.radius * 2);
    bGrad.addColorStop(0, 'rgba(0, 255, 170, 0.6)');
    bGrad.addColorStop(1, 'rgba(0, 255, 170, 0)');
    context.fillStyle = bGrad;
    context.beginPath();
    context.arc(beacon.x, beacon.y, beacon.radius * 2, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = '#00ffaa';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(beacon.x, beacon.y, beacon.radius + Math.sin(beacon.pulse) * 6, 0, Math.PI * 2);
    context.stroke();
  }

  function drawEntities(state) {
    const items = state.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;
      if (item.kind === 'shard') {
        context.fillStyle = '#ffd700';
        context.shadowColor = '#ffd700';
        context.shadowBlur = 12;
        context.beginPath();
        context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      } else if (item.kind === 'asteroid') {
        context.fillStyle = '#ff3355';
        context.strokeStyle = '#ff8899';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    }

    // Player ship
    const player = state.player;
    if (player.invulnerable === 0 || Math.floor(player.invulnerable * 15) % 2 === 1) {
      context.save();
      context.translate(player.x, player.y);
      context.rotate(player.angle);

      // Engine trail / flame
      if (player.dashTimer > 0) {
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.moveTo(-24, 0);
        context.lineTo(-45, -8);
        context.lineTo(-45, 8);
        context.closePath();
        context.fill();
      }

      // Ship body
      context.fillStyle = '#00f0ff';
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(18, 0);
      context.lineTo(-14, -12);
      context.lineTo(-8, 0);
      context.lineTo(-14, 12);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    text(`Score: ${state.player.score}`, 24, 20, 24, '#eef2f7', 'left');
    text(`Wave: ${state.wave}`, FIELD.width / 2, 20, 24, '#00f0ff', 'center');
    text(`Shards: ${state.collected} / ${state.quota}`, FIELD.width - 24, 20, 24, '#ffd700', 'right');

    // Shields (lives)
    const shieldX = 24;
    const shieldY = 60;
    text('Shields:', shieldX, shieldY, 18, '#8a99b5', 'left');
    for (let i = 0; i < PLAYER.maxShields; i++) {
      context.fillStyle = i < state.player.shields ? '#00f0ff' : '#28324c';
      context.fillRect(shieldX + 80 + i * 28, shieldY + 2, 22, 14);
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = '#10131d';
    context.strokeStyle = '#28324c';
    context.lineWidth = 2;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeRect(x, y, PANEL.width, height);

    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 65, 40, '#00f0ff', 'center');
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 20, '#8a99b5', 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 30, 22, '#ffd700', 'center');
  }

  const TITLE_LINES = [
    'Pilot your courier ship through gravitational fields.',
    'Collect stardust shards near wells & deliver to beacon.',
    'Controls: W/Up Thrust, A/D Turn, Space/Shift Dash, R Restart, M Mute.',
  ];
  const PAUSED_LINES = ['System paused. Take your breath.'];
  const OVER_LINES = ['', ''];

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#06070a';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    if (state.screenShake > 0) {
      const shake = state.screenShake * 12;
      context.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    drawBackground(state);
    drawEntities(state);

    if (screen === SCREEN_TITLE) {
      TITLE_LINES[2] = `Best Score: ${best}`;
      drawPanel('STARWAKE — COMET COURIER', TITLE_LINES, 'Press Enter, Space, or Click to Launch');
      return;
    }

    drawHud(state);

    if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', PAUSED_LINES, 'Press P or Escape to Resume');
    } else if (screen === SCREEN_WAVE_INTRO) {
      drawPanel(`WAVE ${state.wave}`, ['Prepare for incoming stardust quota & asteroid traffic.'], 'Incoming...');
    } else if (screen === SCREEN_WAVE_CLEAR) {
      drawPanel(`WAVE ${state.wave - 1} CLEARED`, ['Stardust delivered successfully!'], 'Warping to next wave...');
    } else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = `Final Score: ${state.player.score}`;
      OVER_LINES[1] = `Best Score: ${best}`;
      drawPanel('MISSION FAILED — SHIP DESTROYED', OVER_LINES, 'Press Space or Click to Retry');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
