// Veeva Budapest Office Beat-'Em-Up: Master Game Engine & 60 FPS Loop

import { spriteRenderer, COLOR_PALETTE } from '../graphics/sprites.js';
import { input } from '../engine/input.js';
import { physics } from '../engine/physics.js';
import { sound } from '../audio/sound.js';
import { Player, PTOItem } from './entities.js';
import { StageManager, getWalkableLocal, setWalkableLocal } from './stages.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.container = document.getElementById('arcade-container');

    this.state = 'CHAR_SELECT';
    this.selectedChar = 'tech';

    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.ptoItem = null;
    this.stageMgr = new StageManager();

    this.gameTimeSeconds = 300;
    this.timeCounter = 0;
    this.maxCombo = 0;
    this.totalKills = 0;
    this.hitStopTimer = 0;   // frames of impact-freeze remaining

    this.debugCollision = false; // 'B' toggles the walkable-path overlay

    // --- Path editor state (press 'P' during gameplay) ---
    this.editMode = false;
    this.editStage = 1;
    this.editCamX = 0;      // camera used while editing (pan with A/D or arrows)
    this.editPoly = [];     // working polygon (stage-local [x,y] points)
    this.editKeys = new Set(); // keys held down in edit mode (for smooth panning)

    this.initDOMEvents();
    this.renderCharacterSelectPortraits();
    setTimeout(() => this.renderCharacterSelectPortraits(), 150);
    setTimeout(() => this.renderCharacterSelectPortraits(), 500);

    // Start 60 FPS Game Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  triggerScreenShake() {
    this.container.classList.add('shake');
    setTimeout(() => {
      this.container.classList.remove('shake');
    }, 250);
  }

  // Character roster in on-screen (left→right) order, for D-pad / arrow cycling.
  static CHAR_ORDER = ['tech', 'support', 'psa'];

  // Select a character by type: updates the model and highlights its card.
  setSelectedChar(charType) {
    if (!GameApp.CHAR_ORDER.includes(charType)) return;
    this.selectedChar = charType;
    document.querySelectorAll('.char-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.char === charType);
    });
  }

  // Move the character selection by ±1, wrapping around the roster.
  cycleSelectedChar(dir) {
    const order = GameApp.CHAR_ORDER;
    const idx = order.indexOf(this.selectedChar);
    this.setSelectedChar(order[(idx + dir + order.length) % order.length]);
  }

  // Show/hide the "controller connected" badge to match the gamepad state.
  updateGamepadBadge() {
    const badge = document.getElementById('gamepad-badge');
    if (badge) badge.classList.toggle('hidden', !input.gamepadConnected);
  }

  initDOMEvents() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => this.setSelectedChar(card.dataset.char));
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.resetToSelectScreen();
    });

    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const isOn = sound.toggleSound();
      soundBtn.innerText = isOn ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
    });

    // Dev keys: 'B' toggles the walkable-path overlay, 'P' opens the path editor.
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'b') {
        this.debugCollision = !this.debugCollision;
      } else if (k === 'p') {
        this.toggleEditMode();
      } else if (this.editMode) {
        this.editKeys.add(k);          // track held keys for smooth panning
        this.handleEditKey(k, e);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.editKeys.delete(e.key.toLowerCase());
    });

    // Path editor: click on the canvas to append a polygon vertex.
    this.canvas.addEventListener('click', (e) => {
      if (!this.editMode) return;
      const rect = this.canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (960 / rect.width);
      const sy = (e.clientY - rect.top) * (540 / rect.height);
      // Screen → stage-local: local x = screen x + how far we've scrolled into the stage.
      const localX = Math.round(sx + (this.editCamX - (this.editStage - 1) * 800));
      this.editPoly.push([localX, Math.round(sy)]);
    });

    const scanlineBtn = document.getElementById('btn-scanlines-toggle');
    const scanlinesDiv = document.getElementById('scanline-overlay');
    scanlineBtn.addEventListener('click', () => {
      scanlinesDiv.classList.toggle('off');
      const isOff = scanlinesDiv.classList.contains('off');
      scanlineBtn.innerText = isOff ? '📺 CRT: OFF' : '📺 CRT: ON';
    });
  }

  renderCharacterSelectPortraits() {
    const chars = ['tech', 'support', 'psa'];
    chars.forEach(cType => {
      const cvs = document.getElementById(`select-portrait-${cType}`);
      if (cvs) {
        const cctx = cvs.getContext('2d');
        cctx.imageSmoothingEnabled = false;
        cctx.fillStyle = '#0d0f18';
        cctx.fillRect(0, 0, 80, 80);

        cctx.save();
        cctx.translate(40, 72);
        cctx.scale(0.55, 0.55);
        let tempP = new Player(cType);
        tempP.x = 0; tempP.y = 0; tempP.z = 0;
        spriteRenderer.drawPlayer(cctx, tempP);
        cctx.restore();
      }
    });
  }

  // Place the player at the standard stage-start spot: screen-x ~100 on the
  // left, dropped onto the current stage's walkable floor. Used for the initial
  // spawn AND every stage transition, so all three stages spawn identically.
  spawnPlayerAtStageStart() {
    physics.setWalkable(this.stageMgr.getWalkable());
    const worldX = (this.stageMgr.currentStage - 1) * 800 + 100; // camera starts at the stage's left edge
    const spawn = physics.clampSpawn(worldX, 400);
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.player.z = 0;
    // Reseed the walkable "last good" position so the new spot isn't reverted.
    this.player._lastWalkX = spawn.x;
    this.player._lastWalkY = spawn.y;
  }

  startGame() {
    this.player = new Player(this.selectedChar);
    this.stageMgr = new StageManager();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.ptoItem = null;

    // Drop the player onto the stage's walkable path.
    this.spawnPlayerAtStageStart();

    this.gameTimeSeconds = 300;
    this.maxCombo = 0;
    this.totalKills = 0;

    document.getElementById('screen-char-select').classList.add('hidden');
    document.getElementById('screen-game-end').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    document.getElementById('player-name').innerText = this.player.name;

    this.showBanner(this.stageMgr.getStageTitle());
    this.spawnNextWave();

    sound.startBGM();
    this.state = 'GAMEPLAY';
  }

  resetToSelectScreen() {
    sound.stopBGM();
    document.getElementById('screen-game-end').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('boss-bar').classList.add('hidden');
    document.getElementById('screen-char-select').classList.remove('hidden');
    this.renderCharacterSelectPortraits();
    this.state = 'CHAR_SELECT';
  }

  showBanner(text) {
    const overlay = document.getElementById('banner-overlay');
    const txt = document.getElementById('banner-text');
    txt.innerText = text;
    overlay.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 2500);
  }

  spawnNextWave() {
    const newEnemies = this.stageMgr.spawnWave(this.player.x);

    // Keep every enemy inside the walkable path they spawn onto.
    physics.setWalkable(this.stageMgr.getWalkable());
    newEnemies.forEach(e => {
      const s = physics.clampSpawn(e.x, e.y);
      e.x = s.x;
      e.y = s.y;
    });

    this.enemies.push(...newEnemies);

    if (this.stageMgr.currentStage === 3 && this.stageMgr.bossSpawned) {
      sound.playBossWarning();
      this.showBanner('WARNING: MANAGER APPROACHING!');
    }
  }

  loop() {
    input.update();
    this.updateGamepadBadge();

    if (this.editMode) {
      this.renderEditor();
      requestAnimationFrame(() => this.loop());
      return;
    }

    if (this.state === 'CHAR_SELECT') {
      // Cycle characters with D-pad / arrows (left & right), start to confirm.
      if (input.justPressed.left) this.cycleSelectedChar(-1);
      if (input.justPressed.right) this.cycleSelectedChar(1);
      if (input.justPressed.start) {
        this.startGame();
      }
    } else if (this.state === 'GAMEPLAY') {
      this.updateGameplay();
      this.renderGameplay();
    } else if (this.state === 'VICTORY' || this.state === 'GAME_OVER') {
      if (input.justPressed.start) {
        this.resetToSelectScreen();
      }
      this.renderGameplay();
    }

    requestAnimationFrame(() => this.loop());
  }

  updateGameplay() {
    // Impact freeze (hitstop): hold the current frame for a few ticks to sell the blow.
    // renderGameplay() still runs from loop(), so the frozen frame stays on screen.
    if (this.hitStopTimer > 0) {
      this.hitStopTimer--;
      return;
    }

    this.timeCounter++;
    if (this.timeCounter % 60 === 0 && this.gameTimeSeconds > 0) {
      this.gameTimeSeconds--;
      if (this.gameTimeSeconds <= 0) {
        this.player.takeDamage(999);
      }
    }

    // Feed the active stage's walkable floor path into the physics engine so
    // player/enemy movement is clamped to it.
    physics.setWalkable(this.stageMgr.getWalkable());

    // Update Player & Camera
    const triggerShake = () => this.triggerScreenShake();
    const triggerHitstop = (frames) => { this.hitStopTimer = Math.max(this.hitStopTimer, frames); };
    this.player.update(input, this.enemies, this.projectiles, this.particles, triggerShake, triggerHitstop);
    const camX = this.stageMgr.updateCamera(this.player.x);

    // Keep the player within the visible screen band (no walking off-camera)
    this.player.x = Math.max(camX + 40, Math.min(this.player.x, camX + 920));

    if (this.player.combo > this.maxCombo) this.maxCombo = this.player.combo;

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(this.player, this.projectiles, this.particles, triggerShake, triggerHitstop);

      if (e.isDead) {
        this.totalKills++;
        this.player.score += (e.type === 'manager' ? 10000 : 500);

        if (e.type === 'manager' && !this.ptoItem) {
          this.ptoItem = new PTOItem(e.x, e.y);
          sound.playVictory();
        }

        this.enemies.splice(i, 1);
      }
    }

    // Body Separation — actors can't merge (soft mutual push); downed bodies don't block
    const living = this.enemies.filter(e => !e.dying && !e.isDead);
    for (const e of living) {
      physics.resolveBodies(this.player, e);
    }
    for (let a = 0; a < living.length; a++) {
      for (let b = a + 1; b < living.length; b++) {
        physics.resolveBodies(living[a], living[b]);
      }
    }
    // Re-clamp after pushes so nobody gets shoved off-camera or off the walkable
    // floor. Body separation can nudge actors out of the polygon, so snap them
    // back onto it (the floor band from the old physics model is gone).
    this.player.x = Math.max(camX + 40, Math.min(this.player.x, camX + 920));
    physics.clampToWalkable(this.player);
    for (const e of this.enemies) {
      physics.clampToWalkable(e);
    }

    // Wave Progression
    if (this.enemies.length === 0) {
      if (this.stageMgr.waveIndex < 1) {
        this.stageMgr.waveIndex++;
        this.spawnNextWave();
      } else if (this.stageMgr.currentStage < 3) {
        this.stageMgr.currentStage++;
        this.stageMgr.waveIndex = 0;
        this.spawnPlayerAtStageStart();   // same spawn spot as stage 1
        this.showBanner(this.stageMgr.getStageTitle());
        this.spawnNextWave();
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(this.player, this.enemies);
      if (p.isDead) this.projectiles.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.update();
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Update PTO Item
    if (this.ptoItem) {
      this.ptoItem.update(this.player);
      if (this.ptoItem.isPickedUp) {
        this.triggerEndGame(true);
      }
    }

    // Player Death
    if (this.player.isDead) {
      this.triggerEndGame(false);
    }

    this.updateHUD();
  }

  updateHUD() {
    const hpPct = Math.floor((this.player.hp / this.player.maxHp) * 100);
    const ghostPct = Math.floor((this.player.ghostHp / this.player.maxHp) * 100);

    document.getElementById('hp-bar-fill').style.width = `${hpPct}%`;
    document.getElementById('hp-bar-ghost').style.width = `${ghostPct}%`;
    document.getElementById('player-hp-text').innerText = `${hpPct}%`;

    const spPct = Math.floor(this.player.specialMeter);
    document.getElementById('sp-bar-fill').style.width = `${spPct}%`;

    const mins = Math.floor(this.gameTimeSeconds / 60).toString().padStart(2, '0');
    const secs = (this.gameTimeSeconds % 60).toString().padStart(2, '0');
    document.getElementById('hud-timer').innerText = `${mins}:${secs}`;

    document.getElementById('hud-score').innerText = this.player.score.toString().padStart(6, '0');

    // Final-boss (manager) HP bar, top-right — shown only while it lives
    const bossBar = document.getElementById('boss-bar');
    const boss = this.enemies.find(e => e.type === 'manager' && !e.dying && !e.isDead);
    if (boss) {
      bossBar.classList.remove('hidden');
      const bossPct = Math.max(0, Math.floor((boss.hp / boss.maxHp) * 100));
      document.getElementById('boss-bar-fill').style.width = `${bossPct}%`;
    } else {
      bossBar.classList.add('hidden');
    }

    const comboDiv = document.getElementById('hud-combo-box');
    if (this.player.combo >= 2) {
      comboDiv.classList.remove('hidden');
      document.getElementById('hud-combo-count').innerText = `x${this.player.combo}`;
    } else {
      comboDiv.classList.add('hidden');
    }

    const pCvs = document.getElementById('portrait-canvas');
    if (pCvs) {
      const pCtx = pCvs.getContext('2d');
      pCtx.imageSmoothingEnabled = false;
      pCtx.fillStyle = '#111';
      pCtx.fillRect(0, 0, 52, 52);
      pCtx.save();
      pCtx.translate(26, 48);
      pCtx.scale(0.38, 0.38);
      let tempP = new Player(this.player.charType);
      tempP.x = 0; tempP.y = 0; tempP.z = 0;
      spriteRenderer.drawPlayer(pCtx, tempP);
      pCtx.restore();
    }
  }

  renderGameplay() {
    const camX = this.stageMgr.cameraX;

    this.ctx.clearRect(0, 0, 960, 540);

    // Draw Office Background
    spriteRenderer.drawStageBackground(this.ctx, this.stageMgr.currentStage, camX);

    this.ctx.save();
    this.ctx.translate(-camX, 0);

    if (this.ptoItem && !this.ptoItem.isPickedUp) {
      spriteRenderer.drawPTOItem(this.ctx, this.ptoItem);
    }

    const renderList = [this.player, ...this.enemies];
    renderList.sort((a, b) => a.y - b.y);

    renderList.forEach(obj => {
      if (obj instanceof Player) {
        spriteRenderer.drawPlayer(this.ctx, obj);
      } else {
        spriteRenderer.drawEnemy(this.ctx, obj);
      }
    });

    this.projectiles.forEach(p => spriteRenderer.drawProjectile(this.ctx, p));

    if (this.debugCollision) this.drawWalkableOutline(this.stageMgr.getWalkable());

    // Floating HP bars above living mid-bosses (drawn last so they sit on top)
    this.enemies.forEach(e => {
      if (e.type === 'midboss' && !e.dying && !e.isDead) {
        spriteRenderer.drawEnemyHealthBar(this.ctx, e);
      }
    });

    this.ctx.restore();

    // Draw Particles on Top
    this.particles.forEach(pt => pt.draw(this.ctx, camX));
  }

  // Dev overlay (toggle 'B'). Runs inside the camera-translated context, so the
  // world-space polygon draws directly. `poly` = world-space [[x,y],...].
  drawWalkableOutline(poly) {
    if (!poly || poly.length < 2) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) this.ctx.lineTo(poly[i][0], poly[i][1]);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(0, 255, 180, 0.10)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(0, 255, 180, 0.9)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  // ==========================================
  // IN-GAME FLOOR PATH EDITOR (press 'P')
  // Click to add polygon vertices on the background; the path is traced in
  // stage-local coords so it stays glued to the art. Exports STAGE_WALKABLE.
  // ==========================================
  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      sound.stopBGM();
      this.editStage = (this.state === 'GAMEPLAY') ? this.stageMgr.currentStage : 1;
      this.loadEditStage(this.editStage);
    }
  }

  loadEditStage(stage) {
    this.editStage = stage;
    this.editCamX = (stage - 1) * 800;          // start at the stage's left edge
    this.editPoly = getWalkableLocal(stage);    // load existing path to refine
  }

  handleEditKey(k, e) {
    if (k === 'z') {                             // undo last point
      this.editPoly.pop();
    } else if (k === 'x') {                      // clear all points
      this.editPoly = [];
    } else if (k === '1' || k === '2' || k === '3') {
      this.saveEditStage();                      // keep current edits, switch stage
      this.loadEditStage(parseInt(k, 10));
    } else if (k === 's') {                      // apply this stage's path to live physics
      this.saveEditStage();
    } else if (k === 'enter') {                  // export all three to the console
      this.saveEditStage();
      this.exportWalkable();
    }
    // Prevent the page from scrolling while panning/using editor keys.
    if (['z', 'x', 's', 'enter', '1', '2', '3', 'a', 'd', 'arrowleft', 'arrowright'].includes(k)) {
      e.preventDefault();
    }
  }

  // Continuous camera panning while A/D or arrow keys are held (called each frame).
  updateEditPan() {
    const minCam = (this.editStage - 1) * 800;
    const maxCam = minCam + 500;
    const left = this.editKeys.has('a') || this.editKeys.has('arrowleft');
    const right = this.editKeys.has('d') || this.editKeys.has('arrowright');
    if (left) this.editCamX = Math.max(minCam, this.editCamX - 9);
    if (right) this.editCamX = Math.min(maxCam, this.editCamX + 9);
  }

  saveEditStage() {
    if (this.editPoly.length >= 3) setWalkableLocal(this.editStage, this.editPoly);
  }

  exportWalkable() {
    const fmt = (s) => '  ' + s + ': [' +
      getWalkableLocal(s).map(p => `[${p[0]}, ${p[1]}]`).join(', ') + '],';
    const out = 'const STAGE_WALKABLE = {\n' + [1, 2, 3].map(fmt).join('\n') + '\n};';
    console.log('[PATH EDITOR] Paste into src/game/stages.js:\n' + out);
  }

  renderEditor() {
    this.updateEditPan();

    const ctx = this.ctx;
    const stage = this.editStage;
    const camX = this.editCamX;
    const offset = (stage - 1) * 800;

    ctx.clearRect(0, 0, 960, 540);
    spriteRenderer.drawStageBackground(ctx, stage, camX);

    // World→screen for the editor camera: screenX = localX + offset - camX.
    const toScreen = (localX) => localX + offset - camX;

    ctx.save();
    if (this.editPoly.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toScreen(this.editPoly[0][0]), this.editPoly[0][1]);
      for (let i = 1; i < this.editPoly.length; i++) {
        ctx.lineTo(toScreen(this.editPoly[i][0]), this.editPoly[i][1]);
      }
      if (this.editPoly.length >= 3) ctx.closePath();
      ctx.fillStyle = 'rgba(0, 255, 180, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 180, 0.95)';
      ctx.lineWidth = 2;
      ctx.stroke();

      this.editPoly.forEach((p, i) => {           // vertices, first one highlighted
        ctx.fillStyle = i === 0 ? '#FFD700' : '#00FFCC';
        ctx.fillRect(toScreen(p[0]) - 4, p[1] - 4, 8, 8);
      });
    }
    ctx.restore();

    // Instruction panel
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(8, 8, 640, 100);
    ctx.fillStyle = '#00FFCC';
    ctx.font = 'bold 13px "Press Start 2P", monospace';
    ctx.fillText(`PATH EDITOR - STAGE ${stage}  (${this.editPoly.length} pts)`, 18, 30);
    ctx.fillStyle = '#DDD';
    ctx.font = '11px monospace';
    ctx.fillText('Click: add point   Z: undo   X: clear   A/D or arrows (hold): pan', 18, 54);
    ctx.fillText('1/2/3: switch stage   S: apply to game   ENTER: export to console', 18, 72);
    ctx.fillText('P: exit editor', 18, 90);
    ctx.restore();
  }

  triggerEndGame(isVictory) {
    this.state = isVictory ? 'VICTORY' : 'GAME_OVER';

    const endScreen = document.getElementById('screen-game-end');
    const title = document.getElementById('end-title');
    const subtitle = document.getElementById('end-subtitle');
    const badge = document.getElementById('end-badge');

    if (isVictory) {
      title.innerText = 'APPROVED PTO GRANTED!';
      title.style.color = '#FFD700';
      badge.style.display = 'block';
      subtitle.innerText = 'You cleared the Veeva Budapest office and defeated The Manager!';
    } else {
      title.innerText = 'PTO REQUEST DENIED!';
      title.style.color = '#FF3344';
      badge.style.display = 'none';
      subtitle.innerText = 'Overtime assigned. Try again to claim your Approved PTO!';
    }

    document.getElementById('end-stat-score').innerText = this.player.score.toString().padStart(6, '0');
    document.getElementById('end-stat-combo').innerText = `x${this.maxCombo}`;
    document.getElementById('end-stat-kills').innerText = `${this.totalKills}`;

    const mins = Math.floor(this.gameTimeSeconds / 60).toString().padStart(2, '0');
    const secs = (this.gameTimeSeconds % 60).toString().padStart(2, '0');
    document.getElementById('end-stat-time').innerText = `${mins}:${secs}`;

    endScreen.classList.remove('hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
