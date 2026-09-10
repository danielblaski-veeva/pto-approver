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

  // Soft body separation on the ground plane so actors can't merge together.
  // Elliptical footprints (bodyRX wider than bodyRY for the 2.5D feel); resolves the
  // overlap along the axis of least penetration, split 50/50 between the two bodies.
  resolveBodies(a, b) {
    // Only collide at similar heights — lets a jumping actor pass over the other
    if (Math.abs((a.z || 0) - (b.z || 0)) > 32) return;

    const minX = a.bodyRX + b.bodyRX;
    const minY = a.bodyRY + b.bodyRY;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const ox = minX - Math.abs(dx);   // x-axis penetration
    const oy = minY - Math.abs(dy);   // y-axis penetration
    if (ox <= 0 || oy <= 0) return;   // not overlapping

    if (ox < oy) {
      const push = ox / 2;
      const s = dx < 0 ? -1 : 1;
      a.x += push * s;
      b.x -= push * s;
    } else {
      const push = oy / 2;
      const s = dy < 0 ? -1 : 1;
      a.y += push * s;
      b.y -= push * s;
    }
  }

  // Depth-aware 2.5D Isometric Hitbox Collision
  checkHit(attacker, victim, hitWidth = 50, hitDepth = 25, hitHeight = 40) {
    if (attacker.isDead || victim.isDead || victim.dying) return false;

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
