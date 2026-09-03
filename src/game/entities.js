// Game Entities: Player, Enemies, Projectiles, PTO Item, Particle FX & Damage Popups

import { physics } from '../engine/physics.js';
import { sound } from '../audio/sound.js';
import { spriteRenderer } from '../graphics/sprites.js';

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

    this.specialMeter = 100;
    this.attackCount = 0;
    this.attackTimer = 0;
    this.invincibleTimer = 0;
    this.combo = 0;
    this.score = 0;
    this.isDead = false;
  }

  update(input, enemies, projectiles, particles, triggerShake) {
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
      this.executeAttack(enemies, particles, triggerShake);
    }

    if (input.justPressed.special && this.specialMeter >= 100) {
      this.executeSpecial(enemies, projectiles, particles, triggerShake);
    }

    physics.updateEntity(this);
  }

  executeAttack(enemies, particles, triggerShake) {
    this.state = 'attack';
    this.attackTimer = 18;
    this.attackCombo = ((this.attackCombo || 0) + 1) % 3;
    sound.playSwing();

    let hitAny = false;
    enemies.forEach(e => {
      if (physics.checkHit(this, e, 70, 30, 45)) {
        e.takeDamage(this.damage, this.facingLeft ? -8 : 8);
        hitAny = true;
        this.combo++;
        this.score += 150;

        // Hit Spark Particles & Popup Text
        for (let i = 0; i < 6; i++) {
          particles.push(new Particle(e.x, e.y, 25, (Math.random()-0.5)*8, (Math.random()-0.5)*4, Math.random()*6, '#FFD700', 4, 18));
        }

        if (e.type === 'grunt') {
          // Coffee Splash droplets flying out
          for (let c = 0; c < 4; c++) {
            particles.push(new Particle(e.x, e.y, 35, (Math.random()-0.5)*6, (Math.random()-0.5)*4, Math.random()*5, '#5A3215', 3, 16));
          }
        }

        particles.push(new Particle(e.x, e.y, 40, 0, -0.5, 2, '#FFFF00', 12, 30, 'SMASH!'));
        triggerShake();
        spriteRenderer.triggerLampImpulse(0.7);
      }
    });

    if (!hitAny && this.combo > 0) {
      setTimeout(() => { this.combo = 0; }, 1200);
    }
  }

  executeSpecial(enemies, projectiles, particles, triggerShake) {
    this.state = 'special';
    this.attackTimer = 35;
    this.specialMeter = 0;
    sound.playSpecial();
    triggerShake();
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
    this.isHit = false;
    this.hitTimer = 0;
    this.isDead = false;
    this.freezeTimer = 0;

    if (type === 'grunt') {
      this.hp = 45;
      this.maxHp = 45;
      this.speed = 2.0;
      this.attackDamage = 10;
      this.attackCooldown = 0;
    } else if (type === 'midboss') {
      this.hp = 110;
      this.maxHp = 110;
      this.speed = 3.2;
      this.attackDamage = 18;
      this.attackCooldown = 0;
    } else {
      this.hp = 320;
      this.maxHp = 320;
      this.speed = 2.5;
      this.attackDamage = 26;
      this.attackCooldown = 0;
    }
  }

  update(player, projectiles, particles, triggerShake) {
    if (this.isDead) return;

    if (this.freezeTimer > 0) {
      this.freezeTimer--;
      if (Math.random() < 0.2) {
        particles.push(new Particle(this.x + (Math.random()-0.5)*20, this.y, 20 + Math.random()*30, 0, 0, 1, '#00FFCC', 3, 15));
      }
      return;
    }

    if (this.isHit) {
      this.hitTimer--;
      if (this.hitTimer <= 0) this.isHit = false;
    }

    this.frame++;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.facingLeft = dx < 0;

    if (this.attackCooldown > 0) this.attackCooldown--;

    if (dist > 50 && !this.isHit) {
      this.state = 'walk';
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed * 0.7;
      this.x += this.vx;
      this.y += this.vy;
    } else if (this.attackCooldown <= 0 && !this.isHit) {
      this.attackPlayer(player, projectiles, particles, triggerShake);
    }

    physics.updateEntity(this);
  }

  attackPlayer(player, projectiles, particles, triggerShake) {
    this.state = 'attack';
    this.attackCooldown = this.type === 'manager' ? 60 : 80;

    if (this.type === 'grunt') {
      if (Math.random() < 0.5) {
        projectiles.push(new Projectile(this.x, this.y, 25, 'stapler', this.facingLeft ? -7 : 7, 0));
      } else if (physics.checkHit(this, player, 55, 25, 40)) {
        player.takeDamage(this.attackDamage);
      }
    } else if (this.type === 'midboss') {
      projectiles.push(new Projectile(this.x, this.y, 30, 'urgent', this.facingLeft ? -9 : 9, 0));
    } else if (this.type === 'manager') {
      if (Math.random() < 0.5) {
        if (physics.checkHit(this, player, 75, 35, 50)) {
          player.takeDamage(this.attackDamage * 1.3);
          sound.playHeavyHit();
          particles.push(new Particle(player.x, player.y, 40, 0, 0, 2, '#FF3344', 12, 30, 'MICROMANAGED!'));
          triggerShake();
          spriteRenderer.triggerLampImpulse(1.5);
        }
      } else {
        sound.playHeavyHit();
        triggerShake();
        spriteRenderer.triggerLampImpulse(2.5);
        if (Math.abs(player.x - this.x) < 150 && Math.abs(player.y - this.y) < 70) {
          player.takeDamage(this.attackDamage * 1.5);
          particles.push(new Particle(player.x, player.y, 40, 0, 0, 2, '#FF1122', 12, 30, 'MEETING CANCELED!'));
        }
      }
    }
  }

  takeDamage(amount, knockback = 0) {
    this.hp -= amount;
    this.isHit = true;
    this.hitTimer = 12;
    this.x += knockback;
    sound.playHit();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
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
  }

  update(player, enemies) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -100 || this.x > 1200) this.isDead = true;

    if (this.type === 'document') {
      enemies.forEach(e => {
        if (!e.isDead && Math.abs(e.x - this.x) < 30 && Math.abs(e.y - this.y) < 25) {
          e.takeDamage(30, this.vx > 0 ? 6 : -6);
          this.isDead = true;
        }
      });
    } else {
      if (!player.isDead && Math.abs(player.x - this.x) < 25 && Math.abs(player.y - this.y) < 20) {
        player.takeDamage(this.type === 'urgent' ? 22 : 12);
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
