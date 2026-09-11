// Dual Input System: Keyboard + HTML5 Gamepad API + Touch Controls
//
// State model (this is what keeps gamepad input from "sticking"):
//   rawKeys — keyboard + touch. Event-driven and self-clearing (keyup / touchend
//             set the flag back to false).
//   pad     — gamepad. Polled, so it is REBUILT FROM SCRATCH every frame; a key
//             the pad isn't currently holding is false, not left latched on.
//   keys    — the combined view the rest of the game reads: rawKeys OR pad,
//             recomputed each frame in update().

const KEY_NAMES = ['up', 'down', 'left', 'right', 'attack', 'jump', 'special', 'start'];
const blankKeys = () => KEY_NAMES.reduce((o, k) => (o[k] = false, o), {});

export class InputHandler {
  constructor() {
    this.keys = blankKeys();      // combined (read by the game)
    this.rawKeys = blankKeys();   // keyboard + touch (self-clearing)
    this.pad = blankKeys();       // gamepad (rebuilt each poll)

    // Just Pressed State Triggers (edge-detected from the combined `keys`)
    this.justPressed = {
      attack: false,
      jump: false,
      special: false,
      start: false,
      left: false,
      right: false
    };

    this.prevKeys = { ...this.keys };
    this.gamepadConnected = false;

    this.initKeyboard();
    this.initGamepad();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) e.preventDefault();

      if (code === 'ArrowUp' || key === 'w') this.rawKeys.up = true;
      if (code === 'ArrowDown' || key === 's') this.rawKeys.down = true;
      if (code === 'ArrowLeft' || key === 'a') this.rawKeys.left = true;
      if (code === 'ArrowRight' || key === 'd') this.rawKeys.right = true;

      if (key === 'z' || key === 'j') this.rawKeys.attack = true;
      if (key === 'x' || key === 'k' || code === 'Space') this.rawKeys.jump = true;
      if (key === 'c' || key === 'l') this.rawKeys.special = true;
      if (code === 'Enter') this.rawKeys.start = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (code === 'ArrowUp' || key === 'w') this.rawKeys.up = false;
      if (code === 'ArrowDown' || key === 's') this.rawKeys.down = false;
      if (code === 'ArrowLeft' || key === 'a') this.rawKeys.left = false;
      if (code === 'ArrowRight' || key === 'd') this.rawKeys.right = false;

      if (key === 'z' || key === 'j') this.rawKeys.attack = false;
      if (key === 'x' || key === 'k' || code === 'Space') this.rawKeys.jump = false;
      if (key === 'c' || key === 'l') this.rawKeys.special = false;
      if (code === 'Enter') this.rawKeys.start = false;
    });
  }

  initGamepad() {
    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.pad = blankKeys();   // drop any latched pad state on disconnect
    });
  }

  initTouch() {
    const dpadBtns = document.querySelectorAll('.dpad-btn');
    dpadBtns.forEach(btn => {
      const dir = btn.dataset.dir;
      const startDir = (e) => { e.preventDefault(); this.rawKeys[dir] = true; };
      const endDir = (e) => { e.preventDefault(); this.rawKeys[dir] = false; };

      btn.addEventListener('touchstart', startDir);
      btn.addEventListener('touchend', endDir);
      btn.addEventListener('mousedown', startDir);
      btn.addEventListener('mouseup', endDir);
    });

    const actionBtns = document.querySelectorAll('.touch-btn');
    actionBtns.forEach(btn => {
      const act = btn.dataset.action;
      const startAct = (e) => { e.preventDefault(); this.rawKeys[act] = true; };
      const endAct = (e) => { e.preventDefault(); this.rawKeys[act] = false; };

      btn.addEventListener('touchstart', startAct);
      btn.addEventListener('touchend', endAct);
      btn.addEventListener('mousedown', startAct);
      btn.addEventListener('mouseup', endAct);
    });
  }

  // Rebuild `this.pad` from the live gamepad. Every field is assigned fresh, so
  // releasing the stick/button clears it (no latching → no stuck directions).
  pollGamepad() {
    const pad = blankKeys();
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (gp) {
      const deadzone = 0.25;
      const pressed = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
      const axisX = gp.axes[0] || 0;
      const axisY = gp.axes[1] || 0;

      // Movement: left stick + D-pad
      pad.left  = axisX < -deadzone || pressed(14);
      pad.right = axisX >  deadzone || pressed(15);
      pad.up    = axisY < -deadzone || pressed(12);
      pad.down  = axisY >  deadzone || pressed(13);

      // Xbox face buttons (W3C "standard" gamepad mapping):
      //   A (0) = Jump   B (1) = Attack (alt)   X (2) = Attack   Y (3) = Special   Menu (9) = Start
      pad.jump    = pressed(0);
      pad.attack  = pressed(2) || pressed(1);
      pad.special = pressed(3);
      pad.start   = pressed(9);
    }

    this.pad = pad;
  }

  update() {
    this.pollGamepad();

    // Combined view = keyboard/touch OR gamepad, recomputed every frame.
    for (const k of KEY_NAMES) {
      this.keys[k] = this.rawKeys[k] || this.pad[k];
    }

    // Compute justPressed triggers from the combined state.
    this.justPressed.attack = this.keys.attack && !this.prevKeys.attack;
    this.justPressed.jump = this.keys.jump && !this.prevKeys.jump;
    this.justPressed.special = this.keys.special && !this.prevKeys.special;
    this.justPressed.start = this.keys.start && !this.prevKeys.start;
    this.justPressed.left = this.keys.left && !this.prevKeys.left;
    this.justPressed.right = this.keys.right && !this.prevKeys.right;

    this.prevKeys = { ...this.keys };
  }
}

export const input = new InputHandler();
