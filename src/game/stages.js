// Veeva Office Stage Definitions & Wave Manager

import { Enemy } from './entities.js';

export class StageManager {
  constructor() {
    this.currentStage = 1;
    this.waveIndex = 0;
    this.stageCleared = false;
    this.bossSpawned = false;
    this.cameraX = 0;
  }

  getStageTitle() {
    if (this.currentStage === 1) return 'STAGE 1: LOBBY & RECEPTION';
    if (this.currentStage === 2) return 'STAGE 2: WORKSPACE & CUBICLES';
    return 'STAGE 3: BREAKROOM (BOSS ARENA)';
  }

  // Get enemies for current wave in stage
  spawnWave(playerX) {
    let newEnemies = [];

    if (this.currentStage === 1) {
      if (this.waveIndex === 0) {
        newEnemies.push(new Enemy(playerX + 400, 360, 'grunt'));
        newEnemies.push(new Enemy(playerX + 500, 420, 'grunt'));
      } else if (this.waveIndex === 1) {
        newEnemies.push(new Enemy(playerX + 450, 340, 'grunt'));
        newEnemies.push(new Enemy(playerX + 520, 460, 'grunt'));
        newEnemies.push(new Enemy(playerX + 600, 400, 'midboss'));
      }
    } else if (this.currentStage === 2) {
      if (this.waveIndex === 0) {
        newEnemies.push(new Enemy(playerX + 400, 350, 'grunt'));
        newEnemies.push(new Enemy(playerX + 480, 450, 'midboss'));
      } else if (this.waveIndex === 1) {
        newEnemies.push(new Enemy(playerX + 450, 330, 'midboss'));
        newEnemies.push(new Enemy(playerX + 550, 420, 'grunt'));
        newEnemies.push(new Enemy(playerX + 600, 480, 'grunt'));
      }
    } else if (this.currentStage === 3) {
      if (!this.bossSpawned) {
        this.bossSpawned = true;
        newEnemies.push(new Enemy(playerX + 450, 400, 'manager'));
      }
    }

    return newEnemies;
  }

  updateCamera(playerX) {
    // Smooth camera scrolling following player
    const targetCamX = playerX - 300;
    const minCamX = (this.currentStage - 1) * 800;
    const maxCamX = minCamX + 500;

    this.cameraX = Math.max(minCamX, Math.min(targetCamX, maxCamX));
    return this.cameraX;
  }
}
