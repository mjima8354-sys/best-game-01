import { createRandom } from './random.js';
const rng = createRandom(42);
// Procedural WebAudio sound effects and master mute.

let audioCtx = null;
let masterGain = null;
let muted = false;
let thrustNode = null;
let thrustGain = null;

function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  } catch {
    // Audio context failed or blocked
  }
}

export function unlockAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function toggleMute() {
  muted = !muted;
  if (masterGain && audioCtx) {
    masterGain.gain.value = muted ? 0 : 0.3;
  }
  return muted;
}

export function isMuted() {
  return muted;
}

export function playUi() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.08);
}

export function playShard() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.05);
    gain.gain.setValueAtTime(0.12, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.1);
  });
}

export function playDeliver() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.08);
    gain.gain.setValueAtTime(0.18, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.25);
  });
}

export function playHit() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (rng() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.08));
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.linearRampToValueAtTime(80, now + 0.3);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(now);
}

export function playDash() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.2);
}

export function playComboUp() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.1);
}

export function playWaveClear() {
  unlockAudio();
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  [440, 554, 659].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.07);
    gain.gain.setValueAtTime(0.12, now + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.2);
  });
}

export function setThrust(active) {
  unlockAudio();
  if (!audioCtx || muted) {
    if (thrustGain) thrustGain.gain.value = 0;
    return;
  }
  if (!thrustNode) {
    thrustNode = audioCtx.createOscillator();
    thrustNode.type = 'sawtooth';
    thrustNode.frequency.setValueAtTime(65, 0);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    thrustGain = audioCtx.createGain();
    thrustGain.gain.value = 0;
    thrustNode.connect(filter);
    filter.connect(thrustGain);
    thrustGain.connect(masterGain);
    thrustNode.start();
  }
  thrustGain.gain.setTargetAtTime(active ? 0.08 : 0, audioCtx.currentTime, 0.05);
}
