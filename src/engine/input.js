// Dual Input System: Keyboard + HTML5 Gamepad API + Touch Controls

export class InputHandler {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
      jump: false,
      special: false,
      start: false
    };

    // Just Pressed State Triggers
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

      if (code === 'ArrowUp' || key === 'w') this.keys.up = true;
      if (code === 'ArrowDown' || key === 's') this.keys.down = true;
      if (code === 'ArrowLeft' || key === 'a') this.keys.left = true;
      if (code === 'ArrowRight' || key === 'd') this.keys.right = true;

      if (key === 'z' || key === 'j') this.keys.attack = true;
      if (key === 'x' || key === 'k' || code === 'Space') this.keys.jump = true;
      if (key === 'c' || key === 'l') this.keys.special = true;
      if (code === 'Enter') this.keys.start = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (code === 'ArrowUp' || key === 'w') this.keys.up = false;
      if (code === 'ArrowDown' || key === 's') this.keys.down = false;
      if (code === 'ArrowLeft' || key === 'a') this.keys.left = false;
      if (code === 'ArrowRight' || key === 'd') this.keys.right = false;

      if (key === 'z' || key === 'j') this.keys.attack = false;
      if (key === 'x' || key === 'k' || code === 'Space') this.keys.jump = false;
      if (key === 'c' || key === 'l') this.keys.special = false;
      if (code === 'Enter') this.keys.start = false;
    });
  }

  initGamepad() {
    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  initTouch() {
    const dpadBtns = document.querySelectorAll('.dpad-btn');
    dpadBtns.forEach(btn => {
      const dir = btn.dataset.dir;
      const startDir = (e) => { e.preventDefault(); this.keys[dir] = true; };
      const endDir = (e) => { e.preventDefault(); this.keys[dir] = false; };

      btn.addEventListener('touchstart', startDir);
      btn.addEventListener('touchend', endDir);
      btn.addEventListener('mousedown', startDir);
      btn.addEventListener('mouseup', endDir);
    });

    const actionBtns = document.querySelectorAll('.touch-btn');
    actionBtns.forEach(btn => {
      const act = btn.dataset.action;
      const startAct = (e) => { e.preventDefault(); this.keys[act] = true; };
      const endAct = (e) => { e.preventDefault(); this.keys[act] = false; };

      btn.addEventListener('touchstart', startAct);
      btn.addEventListener('touchend', endAct);
      btn.addEventListener('mousedown', startAct);
      btn.addEventListener('mouseup', endAct);
    });
  }

  pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
    if (!gp) return;

    const deadzone = 0.25;
    const pressed = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);

    // --- Movement: left stick + D-pad (OR'd with keyboard, so both work) ---
    const axisX = gp.axes[0] || 0;
    const axisY = gp.axes[1] || 0;

    this.keys.left  = this.keys.left  || axisX < -deadzone || pressed(14); // D-pad left
    this.keys.right = this.keys.right || axisX >  deadzone || pressed(15); // D-pad right
    this.keys.up    = this.keys.up    || axisY < -deadzone || pressed(12); // D-pad up
    this.keys.down  = this.keys.down  || axisY >  deadzone || pressed(13); // D-pad down

    // --- Xbox face buttons (W3C "standard" gamepad mapping) ---
    //   A (0) = Jump   B (1) = Attack (alt)   X (2) = Attack   Y (3) = Special   Menu (9) = Start
    this.keys.jump    = this.keys.jump    || pressed(0);
    this.keys.attack  = this.keys.attack  || pressed(2) || pressed(1);
    this.keys.special = this.keys.special || pressed(3);
    this.keys.start   = this.keys.start   || pressed(9);
  }

  update() {
    this.pollGamepad();

    // Compute justPressed triggers
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
