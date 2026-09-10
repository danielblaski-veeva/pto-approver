// Veeva Office Stage Definitions & Wave Manager

import { Enemy } from './entities.js';

// --- Walkable floor path (per stage) ---
// Each stage's floor is a polygon traced onto the background art. Points are
// STAGE-LOCAL [x, y] pairs in the background's own coordinate space
// (x: 0..~1460 across the stage, y: screen pixels). getWalkable() returns the
// polygon in WORLD coordinates (local x + the stage's camera offset). Because
// the background now scrolls 1:1 with the world (see sprites.drawStageBackground),
// a local point always maps to the same world point, so the traced path stays
// glued to the painted floor.
//
// Trace/refine these live with the in-game Path Editor (press 'P'); it exports
// updated STAGE_WALKABLE arrays to the console for pasting back here.
const STAGE_WALKABLE = {
  // All three floors traced to their background art with the path editor.
  1: [[42, 459], [364, 406], [365, 454], [541, 456], [790, 387], [790, 365], [975, 369], [1127, 369], [1131, 395], [1217, 473], [1417, 470], [1420, 512], [40, 512]],
  2: [[43, 429], [107, 436], [212, 437], [319, 387], [455, 386], [453, 441], [483, 442], [500, 425], [560, 429], [779, 425], [781, 442], [877, 441], [885, 431], [950, 428], [1162, 419], [1164, 440], [1255, 442], [1263, 433], [1322, 432], [1420, 425], [1420, 512], [40, 512]],
  3: [[46, 384], [82, 381], [81, 435], [284, 435], [376, 437], [427, 403], [515, 403], [519, 431], [652, 435], [800, 435], [844, 427], [849, 379], [1035, 377], [1041, 402], [1135, 445], [1195, 460], [1295, 500], [1417, 483], [1420, 512], [40, 512]],
};

const stageOffset = (stage) => (stage - 1) * 800; // matches minCamX in updateCamera

// Read/replace a stage's walkable polygon (stage-local coords). Used by the editor.
export function getWalkableLocal(stage) {
  return (STAGE_WALKABLE[stage] || STAGE_WALKABLE[1]).map(p => [p[0], p[1]]);
}
export function setWalkableLocal(stage, points) {
  STAGE_WALKABLE[stage] = points.map(p => [Math.round(p[0]), Math.round(p[1])]);
}

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

  // Active stage's walkable polygon in WORLD coordinates (local x + camera offset).
  getWalkable() {
    const offset = stageOffset(this.currentStage);
    return getWalkableLocal(this.currentStage).map(p => [p[0] + offset, p[1]]);
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
