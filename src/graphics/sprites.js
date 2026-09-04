// High-Fidelity 16-Bit Animated Pixel Sprite & Dynamic Background Engine
// Matching Veeva Budapest Office & Arcade Beat-'Em-Up Visuals

export const COLOR_PALETTE = {
  veevaOrange: '#F26522',
  veevaOrangeGlow: '#FF8533',
  veevaOrangeDark: '#C4470F',
  veevaBlue: '#00A3E0',
  veevaBlueDark: '#0055A5',
  skinTone: '#E8B496',
  skinHighlight: '#FCE0D4',
  skinShadow: '#B87B68',
  zombieSkin: '#78A870',
  zombieHighlight: '#9AC693',
  zombieShadow: '#4F7847',
  hairBrown: '#3E2410',
  hairDark: '#201206',
  hairHighlight: '#744723',
  shirtWhite: '#F0F2F8',
  shirtWhiteShadow: '#C4CADB',
  tieBlue: '#184E96',
  tieBlueLight: '#2D71C4',
  tieRed: '#B3202E',
  pantsDark: '#222838',
  pantsDarkShadow: '#151924',
  pantsHighlight: '#363E54',
  shoesBrown: '#3B2210',
  shoesBrownDark: '#1E1108',
  managerSuit: '#18243C',
  managerSuitLight: '#2A3C64',
  managerSuitShadow: '#101726',
  gold: '#FFD700',
  redHit: '#FF2244',
  techGlow: '#00FFCC',
  techGlowAlt: '#FF0077'
};

export class SpriteRenderer {
  constructor() {
    this.animTime = 0;
    this.images = {};
    this.lampSway = 0;
    this.preloadAssets();
  }

  preloadAssets() {
    const assetList = [
      { key: 'stage1', src: '/assets/stage1_lobby.png' },
      { key: 'stage2', src: '/assets/stage2_workspace.png' },
      { key: 'stage3', src: '/assets/stage3_breakroom.png' },
      { key: 'player_idle', src: '/assets/sprites/player_idle.png' },
      { key: 'player_walk', src: '/assets/sprites/player_walk.png' },
      { key: 'player_attack', src: '/assets/sprites/player_attack.png' },
      { key: 'player_support', src: '/assets/sprites/player_support.png' },
      { key: 'player_ps', src: '/assets/sprites/player_ps.png' },
      { key: 'zombie_walk', src: '/assets/sprites/zombie_walk.png' },
      { key: 'zombie_attack', src: '/assets/sprites/zombie_attack.png' },
      { key: 'customer_midboss', src: '/assets/sprites/customer_midboss.png' },
      { key: 'manager_stand', src: '/assets/sprites/manager_stand.png' },
      { key: 'manager_slam', src: '/assets/sprites/manager_slam.png' }
    ];

    assetList.forEach(item => {
      const img = new Image();
      img.src = item.src;
      this.images[item.key] = img;
    });
  }

  triggerLampImpulse(intensity = 1.0) {
    this.lampSway = Math.min(this.lampSway + intensity, 2.5);
  }

  // ==========================================
  // DYNAMIC MULTI-LAYER BACKGROUND ENGINE
  // ==========================================
  drawStageBackground(ctx, stageNum, cameraX) {
    this.animTime++;
    if (this.lampSway > 0) {
      this.lampSway *= 0.96; // damped harmonic decay
    }

    ctx.save();

    let bgImg = null;
    if (stageNum === 1) bgImg = this.images.stage1;
    else if (stageNum === 2) bgImg = this.images.stage2;
    else if (stageNum === 3) bgImg = this.images.stage3;

    // 1. Draw Parallax Background — one non-repeating image, drawn slightly wider
    //    than the screen so it always covers it across the stage without tiling.
    const stageScroll = cameraX - (stageNum - 1) * 800; // 0..~500 within a stage
    const BG_W = 1320;                                  // parallax room beyond the 960 screen
    const SCALE = BG_W / 960;                            // re-anchors old 960-based overlay offsets
    const px = -(stageScroll * 0.7);                    // stage-relative parallax offset (no wrap)

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, px, 0, BG_W, 540);
    } else {
      ctx.fillStyle = '#151926';
      ctx.fillRect(0, 0, 960, 540);
    }

    // 2. Dynamic Environmental Effects per Stage
    if (stageNum === 1) {
      // --- STAGE 1: VEEVA LOBBY DYNAMICS ---
      // A. Organic Pulsing Glow on Veeva Backlit Logo
      const logoScreenX = px + 215 * SCALE;
      const pulse = 0.55 + 0.25 * Math.sin(this.animTime * 0.07);

      if (logoScreenX > -160 && logoScreenX < 1120) {
        const grad = ctx.createRadialGradient(logoScreenX, 260, 20, logoScreenX, 260, 160);
        grad.addColorStop(0, `rgba(242, 101, 34, ${0.45 * pulse})`);
        grad.addColorStop(0.5, `rgba(255, 133, 51, ${0.2 * pulse})`);
        grad.addColorStop(1, 'rgba(242, 101, 34, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(logoScreenX - 160, 100, 320, 300);

        // Specular orange reflection on the polished floor
        ctx.fillStyle = `rgba(242, 101, 34, ${0.12 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(logoScreenX, 470, 110, 25, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Volumetric Ceiling Spotlights with Drifting Dust Motes
      const spotlightPositions = [178, 312, 410, 485, 642, 678, 840, 905];
      spotlightPositions.forEach(sx => {
        const normalizedX = px + sx * SCALE;
        if (normalizedX < -80 || normalizedX > 1040) return;

        const lightGrad = ctx.createLinearGradient(normalizedX, 60, normalizedX, 480);
        lightGrad.addColorStop(0, 'rgba(255, 235, 190, 0.14)');
        lightGrad.addColorStop(0.7, 'rgba(255, 220, 160, 0.05)');
        lightGrad.addColorStop(1, 'rgba(255, 200, 130, 0)');
        
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(normalizedX - 12, 60);
        ctx.lineTo(normalizedX + 12, 60);
        ctx.lineTo(normalizedX + 50, 480);
        ctx.lineTo(normalizedX - 50, 480);
        ctx.closePath();
        ctx.fill();

        // Drifting dust particles in the beam
        const dustY = (this.animTime * 0.4 + sx * 3) % 400 + 70;
        const dustX = normalizedX + Math.sin(this.animTime * 0.04 + sx) * 14;
        ctx.fillStyle = 'rgba(255, 255, 220, 0.55)';
        ctx.fillRect(Math.floor(dustX), Math.floor(dustY), 2, 2);
      });

    } else if (stageNum === 2) {
      // --- STAGE 2: WORKSPACE & CUBICLES DYNAMICS ---
      // A. Animated Computer Screens (Scrolling cyan/green code lines & blinking terminal cursor)
      const monitorXCoords = [218, 486, 742, 986];
      monitorXCoords.forEach((mx, idx) => {
        const screenX = px + mx * SCALE;
        if (screenX < -60 || screenX > 1020) return;
        const screenY = 296;

        // Screen bezel interior
        ctx.fillStyle = '#061018';
        ctx.fillRect(screenX, screenY, 44, 30);

        // Animated terminal scanline code
        const isGreen = idx % 2 === 0;
        ctx.fillStyle = isGreen ? 'rgba(0, 255, 150, 0.75)' : 'rgba(0, 200, 255, 0.75)';
        for (let row = 0; row < 4; row++) {
          const lineW = (Math.sin(this.animTime * 0.1 + row * 1.5 + idx) * 0.5 + 0.5) * 26 + 8;
          ctx.fillRect(screenX + 4, screenY + 4 + row * 6, Math.floor(lineW), 2);
        }

        // Blinking terminal cursor
        if ((this.animTime + idx * 8) % 30 < 15) {
          ctx.fillStyle = '#00FFCC';
          ctx.fillRect(screenX + 32, screenY + 22, 4, 4);
        }

        // Screen monitor ambient cast glow
        ctx.fillStyle = isGreen ? 'rgba(0, 255, 150, 0.08)' : 'rgba(0, 200, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(screenX + 22, screenY + 15, 35, 0, Math.PI * 2);
        ctx.fill();
      });

      // B. Drifting Skylight Clouds
      const cloudX = (this.animTime * 0.15) % 960;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(cloudX, 90, 80, 18, 0, 0, Math.PI * 2);
      ctx.ellipse((cloudX + 480) % 960, 110, 60, 14, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (stageNum === 3) {
      // --- STAGE 3: BREAKROOM BOSS ARENA DYNAMICS ---
      // A. Espresso Coffee Machine Billowing Steam
      const espressoXCoords = [602, 694];
      espressoXCoords.forEach((ex, idx) => {
        const screenX = px + ex * SCALE;
        if (screenX < -40 || screenX > 1000) return;

        for (let s = 0; s < 3; s++) {
          const steamLife = (this.animTime * 0.6 + s * 14 + idx * 8) % 45;
          const steamY = 278 - steamLife * 1.1;
          const steamWobble = Math.sin(steamLife * 0.2 + idx) * 5;
          const steamAlpha = Math.max(0, (1 - steamLife / 45) * 0.35);

          ctx.fillStyle = `rgba(240, 240, 255, ${steamAlpha})`;
          ctx.beginPath();
          ctx.arc(screenX + 16 + steamWobble, steamY, 3 + steamLife * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 3. Dynamic Reactive Hanging Pendant Lamps (Physics Sway on Impacts & Slams)
    if (stageNum === 3 || stageNum === 1) {
      const lampPositions = stageNum === 3 ? [52, 138, 496, 864, 946] : [110, 278, 620, 880];
      const swayAngle = Math.sin(this.animTime * 0.12) * (this.lampSway * 0.14);

      lampPositions.forEach(lx => {
        const actualX = px + lx * SCALE;
        if (actualX < -60 || actualX > 1020) return;
        const pivotY = 50;
        const cordLength = 80;

        ctx.save();
        ctx.translate(actualX, pivotY);
        ctx.rotate(swayAngle);

        // Cord
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, cordLength);
        ctx.stroke();

        // Dome shade
        ctx.fillStyle = '#1c1f26';
        ctx.beginPath();
        ctx.arc(0, cordLength, 20, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        // Warm interior bulb
        ctx.fillStyle = '#FFE088';
        ctx.fillRect(-8, cordLength - 1, 16, 4);

        // Downward light radial gradient cone
        const coneGrad = ctx.createRadialGradient(0, cordLength + 6, 4, 0, cordLength + 60, 110);
        coneGrad.addColorStop(0, 'rgba(255, 230, 150, 0.25)');
        coneGrad.addColorStop(1, 'rgba(255, 230, 150, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(-18, cordLength + 2);
        ctx.lineTo(18, cordLength + 2);
        ctx.lineTo(55, cordLength + 140);
        ctx.lineTo(-55, cordLength + 140);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });
    }

    ctx.restore();
  }

  // ==========================================
  // 16-BIT RETRO ARCADE CHARACTER RENDERER
  // Authentic Pixel Art Matching Design Plan Mockup
  // ==========================================
  drawPlayer(ctx, player) {
    const { x, y, z, charType, state, frame, facingLeft } = player;
    const drawX = Math.floor(x);
    const drawY = Math.floor(y - z);

    ctx.save();
    ctx.translate(drawX, drawY);
    if (facingLeft) ctx.scale(-1, 1);

    // Dynamic Isometric Ground Shadow
    const shadowScale = Math.max(0.35, 1 - z / 220);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, z, 34 * shadowScale, 11 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Invulnerability Blink Effect
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Special Skill Glowing Matrix Cybernetic Aura
    if (state === 'special') {
      ctx.save();
      ctx.shadowColor = '#00FFCC';
      ctx.shadowBlur = 24;
    }

    let img = null;
    let targetW = 113;
    let targetH = 120;
    let offsetX = -56;
    let offsetY = -120;

    const cType = (charType || 'tech').toLowerCase();

    if (cType === 'tech') {
      if (state === 'attack') {
        img = this.images.player_attack;
        targetW = 156;
        targetH = 120;
        offsetX = -65;
        offsetY = -120;
      } else if (state === 'jump') {
        img = this.images.player_walk;
        targetW = 106;
        targetH = 120;
        offsetX = -53;
        offsetY = -120;
      } else if (state === 'walk') {
        // Dynamic alternating stride
        const step = (Math.floor(frame / 6) % 2 === 0);
        img = step ? this.images.player_walk : this.images.player_idle;
        targetW = step ? 106 : 113;
        targetH = 120;
        offsetX = step ? -53 : -56;
        const bobY = Math.abs(Math.sin(frame * 0.4)) * 3;
        offsetY = -120 + bobY;
      } else {
        // Idle breathing
        img = this.images.player_idle;
        targetW = 113;
        targetH = 120;
        offsetX = -56;
        const breatheY = Math.sin(this.animTime * 0.08) * 2;
        offsetY = -120 + breatheY;
      }
    } else if (cType === 'support') {
      img = this.images.player_support;
      targetW = 99;
      targetH = 120;
      offsetX = -49;
      const bobY = state === 'walk' ? Math.abs(Math.sin(frame * 0.4)) * 3 : Math.sin(this.animTime * 0.08) * 2;
      offsetY = -120 + bobY;
    } else if (cType === 'ps' || cType === 'psa') {
      img = this.images.player_ps;
      targetW = 83;
      targetH = 120;
      offsetX = -41;
      const bobY = state === 'walk' ? Math.abs(Math.sin(frame * 0.4)) * 3 : Math.sin(this.animTime * 0.08) * 2;
      offsetY = -120 + bobY;
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, offsetX, offsetY, targetW, targetH);
    }

    // Special Skill Code Cascade FX
    if (state === 'special') {
      ctx.restore();
      ctx.fillStyle = '#00FFCC';
      ctx.font = 'bold 11px monospace';
      for (let i = 0; i < 6; i++) {
        const glyphX = offsetX - 25 + Math.sin(this.animTime * 0.2 + i * 1.2) * 70;
        const glyphY = offsetY - 15 + (this.animTime * 4.5 + i * 28) % 140;
        ctx.fillText(String.fromCharCode(0x30A0 + (i * 11 + this.animTime) % 96), glyphX, glyphY);
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 16-BIT RETRO ARCADE ENEMY RENDERER
  // Zombie Colleague, Customer Mid-Boss, & The Manager
  // ==========================================
  drawEnemy(ctx, enemy) {
    const { x, y, z, type, frame, facingLeft, isHit, state, freezeTimer } = enemy;
    const drawX = Math.floor(x);
    const drawY = Math.floor(y - z);

    ctx.save();
    ctx.translate(drawX, drawY);
    if (facingLeft) ctx.scale(-1, 1);

    // Hit Flash or Freeze Overlay
    if (isHit) {
      ctx.filter = 'brightness(2.4) contrast(1.5)';
    } else if (freezeTimer > 0) {
      ctx.filter = 'hue-rotate(140deg) brightness(1.2) saturate(1.4)';
    }

    // Ground Shadow
    const shadowW = type === 'manager' ? 54 : ((type === 'boss' || type === 'midboss') ? 44 : 26);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowW, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;

    if (type === 'grunt') {
      // ------------------------------------------
      // 1. ZOMBIE COLLEAGUE GRUNT (16-Bit)
      // ------------------------------------------
      let img = null;
      let targetW = 63;
      let targetH = 120;
      let offsetX = -31;
      let offsetY = -120;

      if (state === 'attack' || enemy.attackCooldown > 45) {
        img = this.images.zombie_attack;
        targetW = 126;
        targetH = 120;
        offsetX = -50;
        offsetY = -120;
      } else {
        img = this.images.zombie_walk;
        targetW = 63;
        targetH = 120;
        offsetX = -31;
        const wobble = Math.sin(frame * 0.25) * 3;
        offsetY = -120 + wobble;
      }

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, offsetX, offsetY, targetW, targetH);
      }

    } else if (type === 'boss' || type === 'midboss') {
      // ------------------------------------------
      // 2. CUSTOMER MID-BOSS (Purple Tailored Suit)
      // ------------------------------------------
      const img = this.images.customer_midboss;
      const targetW = 136;
      const targetH = 150;
      const offsetX = -68;
      const bobY = Math.abs(Math.sin(frame * 0.2)) * 4;
      const offsetY = -150 + bobY;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, offsetX, offsetY, targetW, targetH);
      }

      // Urgent Requirement Alert Icon Above Head
      if (enemy.attackCooldown > 30) {
        ctx.fillStyle = '#FF2244';
        ctx.beginPath();
        ctx.arc(0, offsetY - 16, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('!', -4, offsetY - 11);
      }

    } else if (type === 'manager') {
      // ------------------------------------------
      // 3. THE MANAGER (Final Boss)
      // ------------------------------------------
      if (state === 'attack' || enemy.attackCooldown > 40) {
        // Ground slam pose
        const img = this.images.manager_slam;
        const targetW = 192;
        const targetH = 150;
        const offsetX = -96;
        const offsetY = -150;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, offsetX, offsetY, targetW, targetH);
        }

        // Cancel Meeting Ground Slam Shockwaves
        ctx.strokeStyle = COLOR_PALETTE.veevaOrange;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 115, 34, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FF2244';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 145, 42, 0, 0, Math.PI * 2);
        ctx.stroke();

      } else {
        // Heavy Stomping Standing Walk Pose
        const img = this.images.manager_stand;
        const targetW = 162;
        const targetH = 170;
        const offsetX = -81;
        const stomp = Math.abs(Math.sin(frame * 0.18)) * 3;
        const offsetY = -170 + stomp;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, offsetX, offsetY, targetW, targetH);
        }

        // Glowing Red Rectangular Glasses Glare Pulse
        const glareGlow = 0.6 + 0.4 * Math.sin(this.animTime * 0.15);
        ctx.fillStyle = `rgba(255, 30, 50, ${glareGlow})`;
        ctx.fillRect(-15, offsetY + 38, 14, 8);
        ctx.fillRect(8, offsetY + 38, 14, 8);
      }
    }

    ctx.restore();
  }

  // Draw Projectiles
  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y - p.z);

    if (p.type === 'stapler') {
      ctx.fillStyle = '#333';
      ctx.fillRect(-8, -5, 16, 8);
      ctx.fillStyle = '#AAA';
      ctx.fillRect(-6, -7, 12, 4);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-2, -6, 4, 2);
    } else if (p.type === 'urgent') {
      ctx.fillStyle = '#FF2244';
      ctx.fillRect(-12, -8, 24, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-10, -6, 20, 12);
      ctx.strokeStyle = '#FF2244';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(0, 0);
      ctx.lineTo(10, -6);
      ctx.stroke();
    } else if (p.type === 'document') {
      ctx.fillStyle = COLOR_PALETTE.veevaBlue;
      ctx.fillRect(-10, -12, 20, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-8, -10, 16, 20);
      ctx.fillStyle = '#222';
      for (let i = 0; i < 4; i++) ctx.fillRect(-5, -6 + i * 4, 10, 2);
    }

    ctx.restore();
  }

  // Draw Glowing Approved PTO Card
  drawPTOItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y - item.z);

    const glow = Math.sin(Date.now() * 0.008) * 6 + 14;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(0, -10, glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-14, -24, 28, 32);
    ctx.strokeStyle = COLOR_PALETTE.veevaOrange;
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -24, 28, 32);

    ctx.fillStyle = '#22CC55';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('APPROVED', -12, -12);
    ctx.fillStyle = COLOR_PALETTE.veevaOrange;
    ctx.fillText('PTO 100%', -10, -3);

    ctx.restore();
  }
}

export const spriteRenderer = new SpriteRenderer();
