// Veeva Budapest Office Beat-'Em-Up: Master Game Engine & 60 FPS Loop

import { spriteRenderer, COLOR_PALETTE } from '../graphics/sprites.js';
import { input } from '../engine/input.js';
import { sound } from '../audio/sound.js';
import { Player, PTOItem } from './entities.js';
import { StageManager } from './stages.js';

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

  initDOMEvents() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedChar = card.dataset.char;
      });
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

  startGame() {
    this.player = new Player(this.selectedChar);
    this.stageMgr = new StageManager();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.ptoItem = null;

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
    this.enemies.push(...newEnemies);

    if (this.stageMgr.currentStage === 3 && this.stageMgr.bossSpawned) {
      sound.playBossWarning();
      this.showBanner('WARNING: MANAGER APPROACHING!');
    }
  }

  loop() {
    input.update();

    if (this.state === 'CHAR_SELECT') {
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
    this.timeCounter++;
    if (this.timeCounter % 60 === 0 && this.gameTimeSeconds > 0) {
      this.gameTimeSeconds--;
      if (this.gameTimeSeconds <= 0) {
        this.player.takeDamage(999);
      }
    }

    // Update Player & Camera
    const triggerShake = () => this.triggerScreenShake();
    this.player.update(input, this.enemies, this.projectiles, this.particles, triggerShake);
    const camX = this.stageMgr.updateCamera(this.player.x);

    if (this.player.combo > this.maxCombo) this.maxCombo = this.player.combo;

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(this.player, this.projectiles, this.particles, triggerShake);

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

    // Wave Progression
    if (this.enemies.length === 0) {
      if (this.stageMgr.waveIndex < 1) {
        this.stageMgr.waveIndex++;
        this.spawnNextWave();
      } else if (this.stageMgr.currentStage < 3) {
        this.stageMgr.currentStage++;
        this.stageMgr.waveIndex = 0;
        this.player.x += 200;
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

    this.ctx.restore();

    // Draw Particles on Top
    this.particles.forEach(pt => pt.draw(this.ctx, camX));
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
