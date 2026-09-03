// 2.5D Beat-'Em-Up Physics & Isometric Depth Engine

export class PhysicsEngine {
  constructor() {
    this.gravity = 0.85;
    this.floorYMin = 310;
    this.floorYMax = 500;
  }

  // Update entity movement and vertical jump gravity
  updateEntity(entity) {
    // Apply Z-axis jump physics
    if (entity.z > 0 || entity.vz !== 0) {
      entity.z += entity.vz;
      entity.vz -= this.gravity;

      if (entity.z <= 0) {
        entity.z = 0;
        entity.vz = 0;
        entity.isJumping = false;
      }
    }

    // Clamp Y to ground floor boundaries
    if (entity.y < this.floorYMin) entity.y = this.floorYMin;
    if (entity.y > this.floorYMax) entity.y = this.floorYMax;
  }

  // Depth-aware 2.5D Isometric Hitbox Collision
  checkHit(attacker, victim, hitWidth = 50, hitDepth = 25, hitHeight = 40) {
    if (attacker.isDead || victim.isDead) return false;

    // Must be facing towards victim or within close radial proximity
    const xDiff = victim.x - attacker.x;
    const facingMatch = attacker.facingLeft ? (xDiff <= 10) : (xDiff >= -10);

    const xOverlap = Math.abs(xDiff) < hitWidth;
    const yOverlap = Math.abs(victim.y - attacker.y) < hitDepth;
    const zOverlap = Math.abs(victim.z - attacker.z) < hitHeight;

    return facingMatch && xOverlap && yOverlap && zOverlap;
  }
}

export const physics = new PhysicsEngine();
