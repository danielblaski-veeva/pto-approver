// Game Entities: Player, Enemies, Projectiles, PTO Item, Particle FX & Damage Popups

import { physics } from '../engine/physics.js';
import { sound } from '../audio/sound.js';
import { spriteRenderer } from '../graphics/sprites.js';

// --- Knockdown death tuning (classic arcade "drop to the floor") ---
const KD_LAUNCH_VZ = 9;        // upward pop of the launch arc
const KD_LAUNCH_VX = 10;       // backward fly-back speed
const KD_GROUND_FRAMES = 70;   // frames the body lies on the floor before it vanishes
const KD_BLINK_WINDOW = 40;    // last N grounded frames are spent blinking out (renderer)

// --- Particle System ---
export class Particle {
  constructor(x, y, z, vx, vy, vz, color, size, life, text = null) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.text = text;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vz -= 0.2; // gravity on particles
    if (this.z < 0) this.z = 0;
    this.life--;
  }

  draw(ctx, camX) {
    ctx.save();
    ctx.translate(Math.floor(this.x - camX), Math.floor(this.y - this.z));

    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;

    if (this.text) {
      ctx.fillStyle = this.color;
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(this.text, 0, 0);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    }

    ctx.restore();
  }
}

// --- Player Class ---
export class Player {
  constructor(charType = 'tech') {
    this.charType = charType;
    this.x = 100;
    this.y = 400;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;

    this.facingLeft = false;
    this.state = 'idle';
    this.frame = 0;
    this.animTimer = 0;

    if (charType === 'tech') {
      this.name = 'TECH ASSOCIATE';
      this.role = 'THE BRUISER';
      this.maxHp = 140;
      this.hp = 140;
      this.ghostHp = 140;
      this.speed = 4.4;
      this.damage = 25;
      this.specialName = 'Code Freeze';
    } else if (charType === 'support') {
      this.name = 'SUPPORT ASSOCIATE';
      this.role = 'THE SPEEDSTER';
      this.maxHp = 100;
      this.hp = 100;
      this.ghostHp = 100;
      this.speed = 6.4;
      this.damage = 16;
      this.specialName = 'Ticket Escalation';
    } else {
      this.name = 'PS ASSOCIATE';
      this.role = 'THE ALL-ROUNDER';
      this.maxHp = 120;
      this.hp = 120;
      this.ghostHp = 120;
      this.speed = 5.2;
      this.damage = 21;
      this.specialName = 'Scope Creep';
    }

    this.specialMeter = 0;
    this.attackCombo = 0;
    this.attackTimer = 0;
    this.attackDuration = 0;      // total frames of the current attack (for lunge progress)
    this.attackIsFinisher = false;
    this.invincibleTimer = 0;
    this.combo = 0;
    this.score = 0;
    this.isDead = false;

    this.bodyRX = 20;   // ground footprint half-width (body collision)
    this.bodyRY = 11;   // ground footprint half-depth
  }

  update(input, enemies, projectiles, particles, triggerShake, triggerHitstop) {
    if (this.isDead) return;

    // Ghost Bar catch up
    if (this.ghostHp > this.hp) this.ghostHp -= 0.5;

    this.animTimer++;
    if (this.animTimer % 4 === 0) this.frame++;

    if (this.invincibleTimer > 0) this.invincibleTimer--;

    if (this.specialMeter < 100) this.specialMeter += 0.2;

    if (this.state === 'attack' || this.state === 'special') {
      this.attackTimer--;
      if (this.attackTimer <= 0) this.state = 'idle';
      physics.updateEntity(this);
      return;
    }

    this.vx = 0;
    this.vy = 0;

    if (input.keys.left) { this.vx = -this.speed; this.facingLeft = true; }
    if (input.keys.right) { this.vx = this.speed; this.facingLeft = false; }
    if (input.keys.up) { this.vy = -this.speed * 0.7; }
    if (input.keys.down) { this.vy = this.speed * 0.7; }

    this.x += this.vx;
    this.y += this.vy;

    if (this.vx !== 0 || this.vy !== 0) {
      if (this.z === 0) this.state = 'walk';
    } else if (this.z === 0) {
      this.state = 'idle';
    }

    if (input.justPressed.jump && this.z === 0) {
      this.vz = 14;
      this.state = 'jump';
      sound.playJump();
    }

    if (input.justPressed.attack) {
      this.executeAttack(enemies, particles, triggerShake, triggerHitstop);
    }

    if (input.justPressed.special && this.specialMeter >= 100) {
      this.executeSpecial(enemies, projectiles, particles, triggerShake, triggerHitstop);
    }

    physics.updateEntity(this);
  }

  executeAttack(enemies, particles, triggerShake, triggerHitstop) {
    this.attackCombo = (this.attackCombo || 0) + 1;
    const isFinisher = this.attackCombo % 3 === 0; // every 3rd hit is a finisher

    this.state = 'attack';
    this.attackTimer = isFinisher ? 26 : 18;
    this.attackDuration = this.attackTimer;   // renderer reads this for the lunge curve
    this.attackIsFinisher = isFinisher;
    const atkDamage = isFinisher ? this.damage * 2 : this.damage;
    const knockback = isFinisher ? 18 : 8;
    sound.playSwing();

    let hitAny = false;
    enemies.forEach(e => {
      if (physics.checkHit(this, e, isFinisher ? 85 : 70, 30, 45)) {
        e.takeDamage(atkDamage, this.facingLeft ? -knockback : knockback);
        hitAny = true;
        this.combo++;
        this.score += isFinisher ? 400 : 150;

        // Hitstop — the signature "weight" of the blow. Fatal blows are cut SHORT so the
        // corpse releases and flies free (the classic Capcom-brawler "kill release").
        const killed = e.dying || e.isDead;
        triggerHitstop?.(killed ? 2 : (isFinisher ? 7 : 4));

        // Hit Spark Particles & Popup Text
        const sparkCount = isFinisher ? 12 : 6;
        for (let i = 0; i < sparkCount; i++) {
          particles.push(new Particle(e.x, e.y, 25, (Math.random()-0.5)*8, (Math.random()-0.5)*4, Math.random()*6, isFinisher ? '#FF8800' : '#FFD700', 4, 18));
        }

        if (e.type === 'grunt') {
          // Coffee Splash droplets flying out
          for (let c = 0; c < 4; c++) {
            particles.push(new Particle(e.x, e.y, 35, (Math.random()-0.5)*6, (Math.random()-0.5)*4, Math.random()*5, '#5A3215', 3, 16));
          }
        }

        particles.push(new Particle(e.x, e.y, 40, 0, -0.5, 2, isFinisher ? '#FF5522' : '#FFFF00', 12, 30, isFinisher ? 'FIRED!' : 'SMASH!'));
        triggerShake();
        spriteRenderer.triggerLampImpulse(isFinisher ? 1.4 : 0.7);
      }
    });

    if (!hitAny && this.combo > 0) {
      setTimeout(() => { this.combo = 0; }, 1200);
    }
  }

  executeSpecial(enemies, projectiles, particles, triggerShake, triggerHitstop) {
    this.state = 'special';
    this.attackTimer = 35;
    this.specialMeter = 0;
    sound.playSpecial();
    triggerShake();
    triggerHitstop?.(6);
    spriteRenderer.triggerLampImpulse(2.0);

    if (this.charType === 'tech') {
      sound.playFreeze();
      enemies.forEach(e => {
        if (!e.isDead) {
          e.freezeTimer = 220;
          e.takeDamage(20, 0);
          particles.push(new Particle(e.x, e.y, 50, 0, 0, 1, '#00FFCC', 12, 40, 'CODE FREEZE!'));
        }
      });
    } else if (this.charType === 'support') {
      enemies.forEach(e => {
        if (physics.checkHit(this, e, 130, 60, 60)) {
          e.takeDamage(this.damage * 2.2, this.x < e.x ? 12 : -12);
          this.combo += 2;
          this.score += 300;
          particles.push(new Particle(e.x, e.y, 45, 0, 0, 2, '#00A3E0', 12, 35, 'ESCALATED!'));
        }
      });
    } else {
      for (let i = 0; i < 4; i++) {
        projectiles.push(new Projectile(this.x, this.y, 20, 'document', this.facingLeft ? -10 : 10, (i - 1.5) * 2));
      }
      particles.push(new Particle(this.x, this.y, 50, 0, 0, 2, '#F26522', 12, 35, 'SCOPE CREEP!'));
    }
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0 || this.isDead) return;
    this.hp -= amount;
    this.invincibleTimer = 40;
    this.combo = 0;
    this.attackCombo = 0;
    sound.playHit();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      sound.playGameOver();
    }
  }
}

// --- Enemy Class ---
export class Enemy {
  constructor(x, y, type = 'grunt') {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.type = type;

    this.facingLeft = true;
    this.state = 'walk';
    this.frame = 0;
    this.attackAnimTimer = 0;      // counts down while the attack swing plays
    this.attackAnimDuration = 36;  // total frames of the wind-up -> strike -> recover
    this.attackStruck = false;     // has this throw already been released
    this.walkBlend = 0;            // 0=idle .. 1=walking, eased for seamless crossfade
    this.walkPhase = 0;            // continuous gait phase (drives the walk sway/bob)
    this.isHit = false;
    this.hitTimer = 0;
    this.isDead = false;
    this.freezeTimer = 0;
    this.knockbackVx = 0;   // decaying horizontal knockback velocity
    this.dying = false;     // in the knockdown death animation (not yet removed)
    this.deathRot = 0;      // current lie-flat rotation, eased 0 -> PI/2
    this.landSquash = 0;    // 1 on floor impact, decays to 0 (impact squash)
    this.grounded = false;  // has the launched body hit the floor yet
    this.groundTimer = 0;   // frames remaining lying on the floor before removal
    this.launchBurst = false; // one-shot: spawn launch sparks on the first dying frame
    this.deathDir = 1;      // fixed side the body falls toward (stable once launched)

    if (type === 'grunt') {
      this.hp = 55;      // ~3 hits to down (Tech/PS on 3rd; Support 3-4)
      this.maxHp = 55;
      this.speed = 2.0;
      this.attackDamage = 10;
      this.attackCooldown = 0;
      this.bodyRX = 18; this.bodyRY = 10;   // ground footprint (body collision)
    } else if (type === 'midboss') {
      this.hp = 110;
      this.maxHp = 110;
      this.speed = 2.4;  // slower, more menacing advance
      this.attackDamage = 18;
      this.attackCooldown = 0;
      this.bodyRX = 26; this.bodyRY = 14;
    } else {
      this.hp = 320;
      this.maxHp = 320;
      this.speed = 2.5;
      this.attackDamage = 26;
      this.attackCooldown = 0;
      this.bodyRX = 34; this.bodyRY = 18;
    }
  }

  update(player, projectiles, particles, triggerShake, triggerHitstop) {
    if (this.isDead) return;

    // Knockdown death — launch, arc, land flat on the floor, lie, then blink out
    if (this.dying) {
      if (this.launchBurst) { this.spawnDeathBurst(particles); this.launchBurst = false; }

      this.applyKnockback();
      physics.updateEntity(this);   // z-arc + gravity from the launch

      // Rotate toward lying flat as the body falls
      this.deathRot += (Math.PI / 2 - this.deathRot) * 0.18;

      if (!this.grounded) {
        // Floor impact: physics has just zeroed z & vz
        if (this.z <= 0 && this.vz <= 0) {
          this.grounded = true;
          this.landSquash = 1;
          this.knockbackVx *= 0.3;          // scrub most horizontal energy on landing
          this.spawnLandDust(particles);
          if (triggerShake) triggerShake();
          sound.playThud();
        }
      } else {
        this.landSquash *= 0.8;             // impact squash relaxes over a few frames
        this.groundTimer--;
        if (this.groundTimer <= 0) this.isDead = true;
      }
      return;
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer--;
      if (Math.random() < 0.2) {
        particles.push(new Particle(this.x + (Math.random()-0.5)*20, this.y, 20 + Math.random()*30, 0, 0, 1, '#00FFCC', 3, 15));
      }
      return;
    }

    // Knockback slide (runs during hitstun too, so a hit visibly shoves the enemy)
    this.applyKnockback();

    if (this.isHit) {
      this.hitTimer--;
      if (this.hitTimer <= 0) this.isHit = false;
    }

    this.frame++;
    if (this.attackAnimTimer > 0) this.attackAnimTimer--;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Facing has a small deadzone so near-alignment doesn't jitter-flip; locked mid-swing
    if (this.attackAnimTimer <= 0) {
      if (dx < -12) this.facingLeft = true;
      else if (dx > 12) this.facingLeft = false;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    // Attack range must clear the body-separation distance, otherwise body collision
    // holds the enemy just outside a fixed range and it can never trigger an attack.
    // The mid-boss stops further back so its long laptop-smash lands on the player's
    // head and stops there, instead of overshooting through the body.
    const reachBonus = this.type === 'midboss' ? 40 : 10;
    const attackRange = this.bodyRX + (player.bodyRX || 20) + reachBonus;

    let moving = false;
    if (this.attackAnimTimer > 0) {
      // Committed to the attack: stay planted while wind-up -> release -> recover plays.
      // Resolve the hit/throw once, on the strike frame (just after the wind-up).
      if (!this.attackStruck && this.attackAnimTimer <= this.attackAnimDuration * 0.42) {
        this.attackStruck = true;
        this.resolveMidbossStrike(player, projectiles, particles, triggerShake);
      }
      this.vx *= 0.8;
      this.vy *= 0.8;
    } else if (this.isHit) {
      this.vx *= 0.8;
      this.vy *= 0.8;
    } else if (dist > attackRange) {
      moving = this.stepToward(dx, dy, dist, 1);
    } else if (this.attackCooldown <= 0) {
      this.attackPlayer(player, projectiles, particles, triggerShake, triggerHitstop);
      this.vx *= 0.8;
      this.vy *= 0.8;
    } else {
      // Coast to a stop instead of freezing dead
      this.vx *= 0.8;
      this.vy *= 0.8;
    }

    // Seamless idle<->walk crossfade driver: blend eases with actual movement,
    // gait phase runs continuously (amplitude is gated by blend in the renderer)
    const movingSpeed = Math.hypot(this.vx, this.vy);
    const targetBlend = (moving && movingSpeed > 0.4) ? 1 : 0;
    this.walkBlend += (targetBlend - this.walkBlend) * 0.10;   // slower idle<->walk crossfade
    this.walkPhase += 0.16;                                    // slower, heavier gait cadence

    physics.updateEntity(this);
  }

  // Ease velocity toward (sign +1) or away from (sign -1) the player and step. Returns true.
  stepToward(dx, dy, dist, sign) {
    this.state = 'walk';
    const tvx = (dx / dist) * this.speed * sign;
    const tvy = (dy / dist) * this.speed * 0.7 * sign;
    this.vx += (tvx - this.vx) * 0.12;   // gentle heading changes
    this.vy += (tvy - this.vy) * 0.12;
    this.x += this.vx;
    this.y += this.vy;
    return true;
  }

  // Land the overhead hammer-fist on the strike frame (melee, in front of the boss)
  resolveMidbossStrike(player, projectiles, particles, triggerShake) {
    const front = this.facingLeft ? -48 : 48;   // smash point in front
    // Generous proximity check (he already faces the player)
    if (Math.abs(player.x - this.x) < 95 && Math.abs(player.y - this.y) < 46 &&
        Math.abs((player.z || 0) - (this.z || 0)) < 60) {
      player.takeDamage(this.attackDamage);
      sound.playHeavyHit();
      if (triggerShake) triggerShake();
      particles.push(new Particle(player.x, player.y, 40, 0, 0, 2, '#FF6644', 12, 30, 'CRUNCH!'));
      for (let i = 0; i < 6; i++) {
        particles.push(new Particle(player.x, player.y, 30, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4, Math.random() * 5, '#FFD24A', 4, 16));
      }
    } else {
      sound.playHeavyHit();
      if (triggerShake) triggerShake();
    }
    // Ground dust kicked up by the fist smash, in front of him
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle(this.x + front + (Math.random() - 0.5) * 22, this.y, 2,
        (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, Math.random() * 2,
        i % 2 === 0 ? '#9A8C7A' : '#6B4A2A', 4, 18));
    }
  }

  // Decaying horizontal knockback shove
  applyKnockback() {
    if (this.knockbackVx !== 0) {
      this.x += this.knockbackVx;
      this.knockbackVx *= 0.78;
      if (Math.abs(this.knockbackVx) < 0.4) this.knockbackVx = 0;
    }
  }

  // Sparks flying off as the enemy is launched off its feet
  spawnDeathBurst(particles) {
    for (let i = 0; i < 14; i++) {
      particles.push(new Particle(
        this.x, this.y, 30,
        (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, Math.random() * 7,
        i % 2 === 0 ? '#FFD700' : '#AA3322', 4, 24
      ));
    }
  }

  // Dust kicked up when the body slams into the floor, plus the "K.O." callout
  spawnLandDust(particles) {
    for (let i = 0; i < 12; i++) {
      particles.push(new Particle(
        this.x + (Math.random() - 0.5) * 34, this.y, 4,
        (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 3, Math.random() * 2,
        '#9A8C7A', 5, 20
      ));
    }
    particles.push(new Particle(this.x, this.y, 50, 0, -0.4, 1.5, '#FF3344', 14, 36, 'K.O.'));
  }

  attackPlayer(player, projectiles, particles, triggerShake, triggerHitstop) {
    this.state = 'attack';
    this.attackCooldown = this.type === 'manager' ? 60 : (this.type === 'midboss' ? 70 : 80);

    if (this.type === 'grunt') {
      if (Math.random() < 0.5) {
        projectiles.push(new Projectile(this.x, this.y, 25, 'stapler', this.facingLeft ? -7 : 7, 0));
      } else if (physics.checkHit(this, player, 55, 25, 40)) {
        player.takeDamage(this.attackDamage);
      }
    } else if (this.type === 'midboss') {
      // Rear back to hurl the URGENT papers — the throw releases on the strike frame
      // (resolveMidbossStrike, called from update).
      this.attackAnimTimer = this.attackAnimDuration;
      this.attackStruck = false;
      sound.playSwing();
    } else if (this.type === 'manager') {
      if (Math.random() < 0.5) {
        if (physics.checkHit(this, player, 75, 35, 50)) {
          player.takeDamage(this.attackDamage * 1.3);
          sound.playHeavyHit();
          particles.push(new Particle(player.x, player.y, 40, 0, 0, 2, '#FF3344', 12, 30, 'MICROMANAGED!'));
          triggerShake();
          triggerHitstop?.(5);
          spriteRenderer.triggerLampImpulse(1.5);
        }
      } else {
        sound.playHeavyHit();
        triggerShake();
        triggerHitstop?.(5);
        spriteRenderer.triggerLampImpulse(2.5);
        if (Math.abs(player.x - this.x) < 150 && Math.abs(player.y - this.y) < 70) {
          player.takeDamage(this.attackDamage * 1.5);
          particles.push(new Particle(player.x, player.y, 40, 0, 0, 2, '#FF1122', 12, 30, 'MEETING CANCELED!'));
        }
      }
    }
  }

  takeDamage(amount, knockback = 0) {
    if (this.dying || this.isDead) return;

    this.hp -= amount;
    this.isHit = true;
    this.hitTimer = 14;
    this.knockbackVx = knockback;   // decaying velocity shove (see applyKnockback)
    sound.playHit();

    if (this.hp <= 0) {
      this.hp = 0;

      if (this.type === 'manager') {
        // Boss keeps the instant-death path (preserves victory / PTO-drop flow)
        this.isDead = true;
        return;
      }

      // Low-level enemies are launched off their feet — the knockdown plays out in update()
      this.dying = true;
      this.isHit = false;
      this.grounded = false;
      this.groundTimer = KD_GROUND_FRAMES;
      this.deathRot = 0;
      this.launchBurst = true;
      const dir = knockback !== 0 ? Math.sign(knockback) : (this.facingLeft ? 1 : -1);
      this.deathDir = dir;
      this.knockbackVx = dir * KD_LAUNCH_VX;   // fly back
      this.vz = KD_LAUNCH_VZ;                  // arc up; gravity brings it down to land flat
      sound.playEnemyDeath();
    }
  }
}

// --- Projectile Class ---
export class Projectile {
  constructor(x, y, z, type, vx, vy = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type;
    this.vx = vx;
    this.vy = vy;
    this.isDead = false;
    this.spin = 0;   // visual rotation for thrown papers
  }

  update(player, enemies) {
    this.x += this.vx;
    this.y += this.vy;
    this.spin += 0.3;

    if (this.x < -100 || this.x > 1200) this.isDead = true;

    if (this.type === 'document') {
      enemies.forEach(e => {
        if (!e.isDead && !e.dying && Math.abs(e.x - this.x) < 30 && Math.abs(e.y - this.y) < 25) {
          e.takeDamage(30, this.vx > 0 ? 6 : -6);
          this.isDead = true;
        }
      });
    } else {
      if (!player.isDead && Math.abs(player.x - this.x) < 25 && Math.abs(player.y - this.y) < 20) {
        player.takeDamage(this.damage != null ? this.damage : (this.type === 'urgent' ? 22 : 12));
        this.isDead = true;
      }
    }
  }
}

// --- Approved PTO Item Pickup ---
export class PTOItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 20;
    this.isPickedUp = false;
  }

  update(player) {
    if (this.isPickedUp) return;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 40) {
      this.isPickedUp = true;
      sound.playPtoPickup();
    }
  }
}
