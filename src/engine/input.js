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
      start: false
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

      if (code === 'ArrowUp' || key === 'w') this.keys.up = true;
      if (code === 'ArrowDown' || key === 's') this.keys.down = true;
      if (code === 'ArrowLeft' || key === 'a') this.keys.left = true;
      if (code === 'ArrowRight' || key === 'd') this.keys.right = true;

      if (key === 'z') this.keys.attack = true;
      if (key === 'x') this.keys.jump = true;
      if (key === 'c') this.keys.special = true;
      if (code === 'Enter' || code === 'Space') this.keys.start = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (code === 'ArrowUp' || key === 'w') this.keys.up = false;
      if (code === 'ArrowDown' || key === 's') this.keys.down = false;
      if (code === 'ArrowLeft' || key === 'a') this.keys.left = false;
      if (code === 'ArrowRight' || key === 'd') this.keys.right = false;

      if (key === 'z') this.keys.attack = false;
      if (key === 'x') this.keys.jump = false;
      if (key === 'c') this.keys.special = false;
      if (code === 'Enter' || code === 'Space') this.keys.start = false;
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
    const gp = gamepads[0] || gamepads[1];
    if (!gp) return;

    const deadzone = 0.25;

    // Left Stick / D-Pad
    const axisX = gp.axes[0] || 0;
    const axisY = gp.axes[1] || 0;

    this.keys.left = this.keys.left || (axisX < -deadzone || (gp.buttons[14] && gp.buttons[14].pressed));
    this.keys.right = this.keys.right || (axisX > deadzone || (gp.buttons[15] && gp.buttons[15].pressed));
    this.keys.up = this.keys.up || (axisY < -deadzone || (gp.buttons[12] && gp.buttons[12].pressed));
    this.keys.down = this.keys.down || (axisY > deadzone || (gp.buttons[13] && gp.buttons[13].pressed));

    // Controller Buttons:
    // Attack: X / Square (Button 2 or 0)
    // Jump: A / Cross (Button 0 or 1)
    // Special: Y / Triangle (Button 3 or 2)
    // Start: Button 9
    this.keys.attack = this.keys.attack || (gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[0] && gp.buttons[0].pressed && !gp.buttons[1]?.pressed);
    this.keys.jump = this.keys.jump || (gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[0] && gp.buttons[0].pressed);
    this.keys.special = this.keys.special || (gp.buttons[3] && gp.buttons[3].pressed);
    this.keys.start = this.keys.start || (gp.buttons[9] && gp.buttons[9].pressed);
  }

  update() {
    this.pollGamepad();

    // Compute justPressed triggers
    this.justPressed.attack = this.keys.attack && !this.prevKeys.attack;
    this.justPressed.jump = this.keys.jump && !this.prevKeys.jump;
    this.justPressed.special = this.keys.special && !this.prevKeys.special;
    this.justPressed.start = this.keys.start && !this.prevKeys.start;

    this.prevKeys = { ...this.keys };
  }
}

export const input = new InputHandler();
