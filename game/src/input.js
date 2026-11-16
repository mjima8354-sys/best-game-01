// Keyboard and mouse input handling for STARWAKE.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_DASH = 8;
export const ACTION_RESTART = 16;

const THRUST_KEYS = new Set(['ArrowUp', 'KeyW']);
const BRAKE_KEYS = new Set(['ArrowDown', 'KeyS']);
const TURN_LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const TURN_RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const DASH_KEYS = new Set(['Space', 'ShiftLeft', 'ShiftRight']);
const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const MUTE_KEYS = new Set(['KeyM']);
const RESTART_KEYS = new Set(['KeyR']);

export function createInput(target) {
  let thrust = false;
  let brake = false;
  let turnLeft = false;
  let turnRight = false;
  let dash = false;
  let actions = 0;
  const mouse = { x: target.width / 2, y: target.height / 2, down: false };

  window.addEventListener('keydown', (event) => {
    if (THRUST_KEYS.has(event.code)) thrust = true;
    else if (BRAKE_KEYS.has(event.code)) brake = true;
    else if (TURN_LEFT_KEYS.has(event.code)) turnLeft = true;
    else if (TURN_RIGHT_KEYS.has(event.code)) turnRight = true;
    else if (DASH_KEYS.has(event.code)) {
      dash = true;
      if (!event.repeat) actions |= ACTION_DASH;
    } else if (CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (THRUST_KEYS.has(event.code)) thrust = false;
    else if (BRAKE_KEYS.has(event.code)) brake = false;
    else if (TURN_LEFT_KEYS.has(event.code)) turnLeft = false;
    else if (TURN_RIGHT_KEYS.has(event.code)) turnRight = false;
    else if (DASH_KEYS.has(event.code)) dash = false;
  });

  window.addEventListener('blur', () => {
    thrust = false;
    brake = false;
    turnLeft = false;
    turnRight = false;
    dash = false;
  });

  target.addEventListener('pointermove', (event) => {
    const rect = target.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });

  target.addEventListener('pointerdown', (event) => {
    mouse.down = true;
    if (event.button === 2) {
      actions |= ACTION_DASH;
    } else {
      actions |= ACTION_CONFIRM;
    }
  });

  target.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  target.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  return {
    getControls() {
      return { thrust, brake, turnLeft, turnRight, dash, mouse };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
