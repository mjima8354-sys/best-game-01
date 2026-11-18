"use strict";
// deterministic effects module
// rng is a seeded PRNG providing next() → [0,1)
export function createEffects(rng) {
  const stars = [];
const particles = [];
let lastScore = 0;
  const nebula = [];
  const pickups = [];
  let shake = 0;
  let shakeTimer = 0;
  const maxStars = 200;
  const maxNebula = 50;
  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: rng() * 1e3,
      y: rng() * 1e3,
      z: rng(),
      c: 0.1 + rng() * 0.7
    });
  }
  for (let i = 0; i < maxNebula; i++) {
    nebula.push({
      x: rng() * 1e3,
      y: rng() * 1e3,
      r: 50 + rng() * 150,
      c1: 0.15 + rng() * 0.6,
      c2: 0.05 + rng() * 0.4
    });
  }
  function update(dt, state) {
  const { player } = state;
  // generate exhaust particles behind player
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: player.x - player.vx * rng() * 5,
      y: player.y - player.vy * rng() * 5,
      life: 0.5
    });
  }
  // update exhaust particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x -= player.vx * dt * 0.5;
    p.y -= player.vy * dt * 0.5;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  pickups.forEach(p => {
    p.y -= 30 * dt;
    p.alpha -= dt * 0.5;
  });
  for (let i = pickups.length - 1; i >= 0; i--) {
    if (pickups[i].alpha <= 0) pickups.splice(i, 1);
  }
  if (shake > 0) {
    shake -= dt * 8;
    if (shake < 0) shake = 0;
  }
  if (player.score > lastScore) {
    const delta = player.score - lastScore;
    addPop(player.x, player.y, delta);
    lastScore = player.score;
  }
  }
  function drawBackground(ctx, state) {
    const { width, height } = ctx.canvas;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    stars.forEach(s => {
      const size = (1 - s.z) * 2;
      ctx.fillStyle = `rgba(255,255,255,${Math.min(s.c + 0.15,1)})`;
      ctx.fillRect(s.x - size, s.y - size, size * 2, size * 2);
    });
    nebula.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, `rgba(255,200,150,${n.c1 * 0.45})`);
      grad.addColorStop(1, `rgba(0,0,0,${n.c2 * 0.45})`);
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    });
    ctx.restore();
  }
  function drawShipTrail(ctx, state) {
    const { player } = state;
    const exhaust = particles;
    ctx.save();
    ctx.globalAlpha = 0.4;
    exhaust.forEach(p => {
      ctx.fillStyle = "rgba(255,255,0,0.6)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
  function drawPickupPops(ctx) {
    pickups.forEach(p => {
      ctx.fillStyle = `rgba(255,255,0,${p.alpha})`;
      if (ctx.fillText) ctx.fillText(`+${p.score}`, p.x, p.y);
    });
  }
  function addPop(x, y, score) {
    pickups.push({ x, y: y, score, alpha: 1 });
  }
function addShake(amount) {
  shake = Math.max(shake, amount);
}
  function shakeOffset() {
    if (!shake) return { x: 0, y: 0 };
    const angle = rng() * Math.PI * 2;
    const mag = shake * rng();
    return { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag };
  }
  return { update, drawBackground, drawShipTrail, drawPickupPops, addPop, addShake, shakeOffset };
}
