// 2.5D Beat-'Em-Up Physics & Isometric Depth Engine

export class PhysicsEngine {
  constructor() {
    this.gravity = 0.85;
    this.walkable = null; // active stage's walkable polygon (world coords, [[x,y],...])
  }

  // Set the active stage's walkable polygon. Called once per frame from the
  // game loop so stage transitions are handled automatically.
  setWalkable(polygon) {
    this.walkable = (polygon && polygon.length >= 3) ? polygon : null;
  }

  // Ray-casting point-in-polygon test.
  static pointInPoly(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Vertical extent [minY, maxY] of the walkable polygon at world column x
  // (null if x is outside the polygon).
  walkableColumn(x) {
    const poly = this.walkable;
    if (!poly) return null;
    const ys = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      if ((xi > x) !== (xj > x)) {
        const t = (x - xi) / (xj - xi);
        ys.push(yi + t * (yj - yi));
      }
    }
    if (ys.length < 2) return null;
    ys.sort((a, b) => a - b);
    return [ys[0], ys[ys.length - 1]];
  }

  // Clamp a spawn point into the walkable area: keep x within the polygon's
  // horizontal extent, then fit y into the floor's depth at that column.
  clampSpawn(x, y, marginX = 30, marginY = 12) {
    const poly = this.walkable;
    if (!poly) return { x, y };
    let minX = Infinity, maxX = -Infinity;
    for (const p of poly) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
    }
    x = Math.max(minX + marginX, Math.min(x, maxX - marginX));
    const col = this.walkableColumn(x);
    if (col) y = Math.max(col[0] + marginY, Math.min(y, col[1] - marginY));
    return { x, y };
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

    // Keep the entity's feet inside the walkable floor path.
    this.clampToWalkable(entity);
  }

  // Constrain an entity to the walkable polygon. When a move would leave the
  // floor, try the x-only and y-only sub-moves so the entity slides along the
  // boundary instead of sticking; otherwise revert to the last valid spot.
  clampToWalkable(entity) {
    const poly = this.walkable;
    if (!poly) return;

    // Lazily seed the last-known-good position (spawn point assumed valid).
    if (entity._lastWalkX === undefined) {
      entity._lastWalkX = entity.x;
      entity._lastWalkY = entity.y;
      return;
    }

    if (PhysicsEngine.pointInPoly(entity.x, entity.y, poly)) {
      entity._lastWalkX = entity.x;
      entity._lastWalkY = entity.y;
      return;
    }
    if (PhysicsEngine.pointInPoly(entity.x, entity._lastWalkY, poly)) {
      entity.y = entity._lastWalkY;          // slide horizontally
    } else if (PhysicsEngine.pointInPoly(entity._lastWalkX, entity.y, poly)) {
      entity.x = entity._lastWalkX;          // slide vertically
    } else {
      entity.x = entity._lastWalkX;          // fully blocked → revert
      entity.y = entity._lastWalkY;
    }
    entity._lastWalkX = entity.x;
    entity._lastWalkY = entity.y;
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
