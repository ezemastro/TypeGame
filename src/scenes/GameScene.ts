import Phaser from 'phaser';
import type { GameState } from '../entities/types';
import { createInitialGameState } from '../entities/types';
import { createPlayer } from '../entities/Player';
import { spawnSystem } from '../systems/SpawnSystem';
import { movementSystem } from '../systems/MovementSystem';
import { targetSystem } from '../systems/TargetSystem';
import { combatSystem } from '../systems/CombatSystem';
import { heatBarSystem } from '../systems/HeatBarSystem';
import { difficultySystem } from '../systems/DifficultySystem';
import { scoreSystem } from '../systems/ScoreSystem';
import { xpSystem } from '../systems/XPSystem';
import { collisionSystem } from '../systems/CollisionSystem';
import { createHUD, type HUD } from '../ui/HUD';
import { showGameOver, type GameOverScreen } from '../ui/GameOverScreen';
import { showLevelUp, type LevelUpScreen } from '../ui/LevelUpScreen';
import { GameConfig } from '../config';
import { getRicochetBounces, getPiercingCount, calculatePierceDistance, findNearestEnemyToPosition } from '../systems/ProjectileHelpers';

interface EnemyRender {
  image: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
  textBg: Phaser.GameObjects.Rectangle;
}

interface ProjectileRender {
  image: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  targetId: number;
  bouncesLeft: number;
  bounceTimer: number;
  pierceDistanceLeft: number;
  isPiercing: boolean;
  pierceDirX: number;
  pierceDirY: number;
  hasHitPrimary: boolean;
}

type ParallaxType = 'nebula' | 'ground';

interface ParallaxItem {
  image: Phaser.GameObjects.Image;
  speed: number;
  type: ParallaxType;
}

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private playerImage!: Phaser.GameObjects.Image;
  private shipPiercing!: Phaser.GameObjects.Image;
  private shipRicochet!: Phaser.GameObjects.Image;
  private shipExplosive!: Phaser.GameObjects.Image;
  private shipDual!: Phaser.GameObjects.Image;
  private shipCooling!: Phaser.GameObjects.Image;
  private shipSight!: Phaser.GameObjects.Image;
  private enemyRenderMap: Map<number, EnemyRender> = new Map();
  private projectiles: ProjectileRender[] = [];
  private hud!: HUD;
  private gameOverScreen: GameOverScreen | null = null;
  private levelUpScreen: LevelUpScreen | null = null;
  private keyHandler?: (event: KeyboardEvent) => void;
  private auraCircle: Phaser.GameObjects.Arc | null = null;
  private tileSprite!: Phaser.GameObjects.TileSprite;
  private parallaxItems: ParallaxItem[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Assets loaded in BootScene
  }

  create(): void {
    // Reset time scales (may have been frozen by game over / pause)
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    this.gameState = createInitialGameState();
    this.gameState.player = createPlayer();
    this.enemyRenderMap = new Map();
    this.projectiles = [];
    this.parallaxItems = [];
    this.gameOverScreen = null;
    this.levelUpScreen = null;
    this.auraCircle = null;

    // Background tile (scrolling floor)
    this.tileSprite = this.add.tileSprite(
      GameConfig.canvas.width / 2,
      GameConfig.canvas.height / 2,
      GameConfig.canvas.width,
      GameConfig.canvas.height,
      'starfield',
    );
    this.tileSprite.setDepth(0);

    // Parallax environment (trees, rocks, bushes)
    this.spawnParallaxItems();

    // Player image
    const p = this.gameState.player;
    this.playerImage = this.add.image(p.x, p.y, 'player-ship');
    const playerScale = p.width / this.playerImage.width;
    this.playerImage.setScale(playerScale);
    this.playerImage.setDepth(10);

    // Ship power-up overlays (hidden until power-up active, follow player position)
    this.shipPiercing = this.add.image(p.x, p.y, 'ship-piercing');
    this.shipPiercing.setScale(playerScale).setDepth(11).setVisible(false);

    this.shipRicochet = this.add.image(p.x, p.y, 'ship-ricochet');
    this.shipRicochet.setScale(playerScale * 0.8).setDepth(11).setVisible(false);

    this.shipExplosive = this.add.image(p.x, p.y, 'ship-explosive');
    this.shipExplosive.setScale(playerScale).setDepth(11).setVisible(false);

    this.shipDual = this.add.image(p.x, p.y, 'ship-dual');
    this.shipDual.setScale(playerScale).setDepth(11).setVisible(false);

    this.shipCooling = this.add.image(p.x, p.y, 'ship-cooling');
    this.shipCooling.setScale(playerScale).setDepth(9).setVisible(false);

    this.shipSight = this.add.image(p.x, p.y, 'ship-sight');
    this.shipSight.setScale(playerScale).setDepth(11).setVisible(false);

    // Player continuous bounce tween (CSS animations lost in Canvas2D)
    this.tweens.add({
      targets: this.playerImage,
      y: p.y - 2,       // bounce up 2px
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // HUD
    this.hud = createHUD(this);

    // Keyboard input
    if (this.keyHandler) {
      this.input.keyboard!.off('keydown', this.keyHandler);
    }
    this.keyHandler = (event: KeyboardEvent) => {
      if (this.gameState.gameOver) {
        if (event.key === 'r' || event.key === 'R') {
          this.restartGame();
        }
        return;
      }
      // Debug: instant level-up (K — no aparece en palabras españolas del juego)
      if ((event.key === 'k' || event.key === 'K') && !this.gameState.isPaused) {
        this.gameState.xp = this.gameState.xpToNextLevel;
        return;
      }
      if (this.gameState.isPaused) return;
      if (event.key.length === 1 && /^[A-Za-z]$/.test(event.key)) {
        this.gameState.pendingKeys.push(event.key.toUpperCase());
      }
    };
    this.input.keyboard!.on('keydown', this.keyHandler);
  }

  /**
   * Compute depth from screen Y so that closer-to-player items render above
   * further-away ones. Clouds stay in [1.0, ~1.5], ground decor in [2.0, 4.0].
   */
  private depthFromY(y: number, type: ParallaxType): number {
    if (type === 'nebula') {
      // y range roughly -40..340; map to 1.0..1.5
      return 1.0 + ((y + 40) / 380) * 0.5;
    }
    // Ground: y range -120..600; map to 2.0..4.0
    return 2.0 + ((y + 120) / 720) * 2.0;
  }

  private spawnParallaxItems(): void {
    // Ground elements — trees, rocks, bushes
    // Place them in left/right thirds only, never in the center lane (player path)
    const textures: Array<'planet' | 'planet-ice' | 'planet-gas' | 'planet-rocky' | 'planet-ocean' | 'planet-desert' | 'meteorite' | 'asteroid' | 'comet'> = [
      'planet', 'planet-ice', 'planet-gas', 'planet-rocky', 'planet-ocean', 'planet-desert',
      'meteorite', 'asteroid', 'comet',
    ];
    const groundCount = 10;
    const laneMargin = 140; // keep this far from center on each side
    const centerX = GameConfig.canvas.width / 2;
    const leftMax = centerX - laneMargin;
    const rightMin = centerX + laneMargin;

    for (let i = 0; i < groundCount; i++) {
      const texture = Phaser.Utils.Array.GetRandom(textures);
      // Randomly pick left-side or right-side placement
      const x = Math.random() > 0.5
        ? Phaser.Math.Between(20, leftMax)
        : Phaser.Math.Between(rightMin, GameConfig.canvas.width - 20);
      const y = Phaser.Math.Between(-120, GameConfig.canvas.height);
      const item = this.add.image(x, y, texture);
      item.setDepth(this.depthFromY(y, 'ground'));
      item.setScale(Phaser.Math.FloatBetween(0.8, 1.2));

      const speed = 1.0;
      this.parallaxItems.push({ image: item, speed, type: 'ground' });
    }
  }

  update(_time: number, delta: number): void {
    if (this.gameState.gameOver) return;

    const gs = this.gameState;

    // If paused (level-up screen), freeze all systems and animations
    if (gs.isPaused) {
      if (!this.levelUpScreen && gs.levelUpChoices.length > 0) {
        this.tweens.timeScale = 0;
        this.levelUpScreen = showLevelUp(this, gs.levelUpChoices, (powerUpId: string) => {
          gs.activePowerUps.push(powerUpId);
          gs.levelUpChoices = [];
          gs.isPaused = false;
          if (this.levelUpScreen) {
            this.levelUpScreen.destroy();
          }
          this.levelUpScreen = null;
          this.tweens.timeScale = 1;
          // Force immediate visual sync for the new power-up
          this.syncShipRendering();
        });
      }
      this.syncAuraRendering();
      this.syncShipRendering();
      this.syncRendering();
      this.hud.update(gs);
      return;
    }

    // Background scroll — scroll toward the player (world moves toward camera)
    const scrollSpeed = GameConfig.world.scrollSpeed;
    this.tileSprite.tilePositionY -= scrollSpeed * (delta / 1000);

    // Parallax movement — planets, meteorites, asteroids move toward player, nebulas drift slowly
    const groundLaneMargin = 140;
    const groundCenterX = GameConfig.canvas.width / 2;
    const groundLeftMax = groundCenterX - groundLaneMargin;
    const groundRightMin = groundCenterX + groundLaneMargin;

    for (const item of this.parallaxItems) {
      item.image.y += scrollSpeed * item.speed * (delta / 1000);
      if (item.image.y > GameConfig.canvas.height + 80) {
        item.image.y = item.type === 'nebula' ? -40 : -80;
        // Keep ground items off the center lane on wrap-around too
        if (item.type === 'ground') {
          item.image.x = Math.random() > 0.5
            ? Phaser.Math.Between(20, groundLeftMax)
            : Phaser.Math.Between(groundRightMin, GameConfig.canvas.width - 20);
        } else {
          item.image.x = Phaser.Math.Between(20, GameConfig.canvas.width - 20);
        }
      }
      // Update depth dynamically: items closer to the player render on top
      item.image.setDepth(this.depthFromY(item.image.y, item.type));
    }

    // Run systems
    spawnSystem(gs, delta);
    movementSystem(gs, delta);
    combatSystem(gs, delta);

    // Process pending keys
    while (gs.pendingKeys.length > 0) {
      const key = gs.pendingKeys[0];
      gs.lastKeyPressed = key;
      targetSystem(gs);

      if (gs.targetedEnemyId === null) {
        const fi = gs.forgivenKeys.findIndex((f) => f.key === key);
        if (fi !== -1) {
          gs.forgivenKeys.splice(fi, 1);
          gs.pendingKeys.shift();
          continue;
        }
      }

      const hadTarget = gs.targetedEnemyId !== null;
      combatSystem(gs, delta);

      if (gs.justFired || !hadTarget || gs.overheated) {
        gs.pendingKeys.shift();
      } else {
        break;
      }
    }

    heatBarSystem(gs, delta);
    difficultySystem(gs, delta);
    gs.forgivenKeys = gs.forgivenKeys.filter((f) => f.expiresAt > gs.elapsedTime);
    xpSystem(gs);
    scoreSystem(gs);
    collisionSystem(gs);

    gs.enemies = gs.enemies.filter((e) => e.alive);

    if (gs.gameOver) {
      this.tweens.timeScale = 0;
      this.gameOverScreen = showGameOver(this, gs.score);
      return;
    }

    // Projectile handling
    if (gs.justFired) {
      if (gs.targetedEnemyId !== null) {
        this.spawnProjectile();
      }
      if (gs.secondaryTargetId !== null) {
        this.spawnSecondaryProjectile();
      }
      gs.justFired = false;
    }

    this.updateProjectiles(delta);
    this.syncAuraRendering();
    this.syncShipRendering();
    this.syncRendering();
    this.hud.update(gs);

    gs.lastKeyPressed = null;
    gs.targetedEnemyId = null;
    gs.secondaryTargetId = null;
  }

  private spawnProjectile(): void {
    const p = this.gameState.player;
    const texW = GameConfig.shooting.projectileWidth;
    const texH = GameConfig.shooting.projectileHeight;
    const originX = p.x;
    const originY = p.y - p.height / 2;

    // Fallback: if laser texture fails, create a cyan energy bolt
    if (!this.textures.exists('laser')) {
      const glow = this.add.circle(originX, originY, texW * 1.2, 0x00E5FF, 0.3);
      glow.setDepth(14);
      const rect = this.add.circle(originX, originY, texW * 0.6, 0xffffff);
      rect.setDisplaySize(texW, texH);
      rect.setDepth(15);
      this.projectiles.push({
        image: rect as unknown as Phaser.GameObjects.Image,
        glow: glow as unknown as Phaser.GameObjects.Image,
        targetId: this.gameState.targetedEnemyId!,
        bouncesLeft: getRicochetBounces(this.gameState.activePowerUps),
        bounceTimer: 0,
        pierceDistanceLeft: 0,
        isPiercing: false,
        pierceDirX: 0,
        pierceDirY: 0,
        hasHitPrimary: false,
      });
      return;
    }

    // Glow: larger, semi-transparent copy behind the laser
    const glow = this.add.image(originX, originY, 'laser');
    glow.setDisplaySize(texW * 1.6, texH * 1.3);
    glow.setAlpha(0.25);
    glow.setTint(0x00E5FF);
    glow.setDepth(14);

    const img = this.add.image(originX, originY, 'laser');
    img.setDisplaySize(texW, texH);
    img.setScale(0.8);
    img.setDepth(15);
    this.projectiles.push({
      image: img,
      glow,
      targetId: this.gameState.targetedEnemyId!,
      bouncesLeft: getRicochetBounces(this.gameState.activePowerUps),
      bounceTimer: 0,
      pierceDistanceLeft: 0,
      isPiercing: false,
      pierceDirX: 0,
      pierceDirY: 0,
      hasHitPrimary: false,
    });
  }

  private spawnSecondaryProjectile(): void {
    const p = this.gameState.player;
    const texW = GameConfig.shooting.projectileWidth;
    const texH = GameConfig.shooting.projectileHeight;
    const originX = p.x + 8;
    const originY = p.y - p.height / 2;

    // Fallback: if laser texture fails, create a cyan energy bolt
    if (!this.textures.exists('laser')) {
      const glow = this.add.circle(originX, originY, texW * 1.2, 0x00E5FF, 0.3);
      glow.setDepth(14);
      const rect = this.add.circle(originX, originY, texW * 0.6, 0xffffff);
      rect.setDisplaySize(texW, texH);
      rect.setDepth(15);
      this.projectiles.push({
        image: rect as unknown as Phaser.GameObjects.Image,
        glow: glow as unknown as Phaser.GameObjects.Image,
        targetId: this.gameState.secondaryTargetId!,
        bouncesLeft: 0,
        bounceTimer: 0,
        pierceDistanceLeft: 0,
        isPiercing: false,
        pierceDirX: 0,
        pierceDirY: 0,
        hasHitPrimary: false,
      });
      return;
    }

    // Glow: larger, semi-transparent copy behind the laser
    const glow = this.add.image(originX, originY, 'laser');
    glow.setDisplaySize(texW * 1.6, texH * 1.3);
    glow.setAlpha(0.25);
    glow.setTint(0x00E5FF);
    glow.setDepth(14);

    const img = this.add.image(originX, originY, 'laser');
    img.setDisplaySize(texW, texH);
    img.setScale(0.8);
    img.setDepth(15);
    this.projectiles.push({
      image: img,
      glow,
      targetId: this.gameState.secondaryTargetId!,
      bouncesLeft: 0,
      bounceTimer: 0,
      pierceDistanceLeft: 0,
      isPiercing: false,
      pierceDirX: 0,
      pierceDirY: 0,
      hasHitPrimary: false,
    });
  }

  private updateProjectiles(delta: number): void {
    const deltaSec = delta / 1000;
    const speed = GameConfig.shooting.projectileSpeed;
    const gs = this.gameState;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // ── Pierce mode: straight-line flight ──────────────────────
      if (proj.isPiercing) {
        const moveX = proj.pierceDirX * speed * deltaSec;
        const moveY = proj.pierceDirY * speed * deltaSec;
        proj.image.x += moveX;
        proj.image.y += moveY;
        proj.glow.x = proj.image.x;
        proj.glow.y = proj.image.y;
        proj.pierceDistanceLeft -= Math.sqrt(moveX * moveX + moveY * moveY);

        // Check collision with all enemies during pierce flight
        let hitEnemy = false;
        for (const enemy of gs.enemies) {
          if (!enemy.alive) continue;
          const ex = enemy.x + enemy.width / 2;
          const ey = enemy.y + enemy.height / 2;
          const dx = ex - proj.image.x;
          const dy = ey - proj.image.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 25) {
            // Hit! Strip letter
            const letter = enemy.word[0];
            enemy.word = enemy.word.slice(1);
            gs.forgivenKeys.push({ key: letter, expiresAt: gs.elapsedTime + 1000 });
            if (enemy.word.length === 0) {
              enemy.pendingDestruction = true;
            }
            // Reset pierce distance
            const pierceCount = getPiercingCount(gs.activePowerUps);
            const cfg = GameConfig.powerUps.piercingShot;
            proj.pierceDistanceLeft = calculatePierceDistance(
              cfg.basePierceDistance,
              cfg.pierceStackMultiplier,
              pierceCount,
            );
            hitEnemy = true;
            break;
          }
        }

        if (proj.pierceDistanceLeft <= 0 || hitEnemy) {
          // If hitEnemy, we reset distance above and continue.
          // If distance exhausted → destroy
          if (!hitEnemy) {
            proj.image.destroy();
            proj.glow.destroy();
            this.projectiles.splice(i, 1);
          }
        }
        continue;
      }

      // ── Homing mode ────────────────────────────────────────────
      const target = gs.enemies.find(
        (e) => e.id === proj.targetId && e.alive,
      );

      if (!target) {
        proj.image.destroy();
        proj.glow.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const tx = target.x + target.width / 2;
      const ty = target.y + target.height / 2;
      const dx = tx - proj.image.x;
      const dy = ty - proj.image.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < speed * deltaSec) {
        // ── Hit ──────────────────────────────────────────────
        // Handle pendingDestruction for primary target
        if (target.pendingDestruction) {
          target.alive = false;
          gs.gearDropped = true;
          this.spawnStar(target.x, target.y);
          if (gs.activePowerUps.includes('EXPLOSIVE_IMPACT')) {
            this.spawnExplosion(target.x, target.y);
          }
        }

        // Strip letter if this is a secondary hit (ricochet bounce target)
        if (proj.hasHitPrimary) {
          const letter = target.word[0];
          target.word = target.word.slice(1);
          gs.forgivenKeys.push({ key: letter, expiresAt: gs.elapsedTime + 1000 });
          if (target.word.length === 0) {
            target.pendingDestruction = true;
          }
        }
        proj.hasHitPrimary = true;

        // ── Ricochet bounce check ───────────────────────────
        const ricochetCount = getRicochetBounces(gs.activePowerUps);
        if (ricochetCount > 0 && proj.bouncesLeft > 0) {
          const cfg = GameConfig.powerUps.ricochet;
          const nearest = findNearestEnemyToPosition(
            gs.enemies,
            proj.image.x,
            proj.image.y,
            cfg.bounceSearchRadius,
          );
          if (nearest && nearest.id !== target.id) {
            proj.targetId = nearest.id;
            proj.bouncesLeft -= 1;
            proj.bounceTimer = cfg.bounceTravelMs;
            continue; // don't destroy, keep flying
          }
        }

        // ── Pierce entrance (after bounces exhausted) ────────
        if (proj.bouncesLeft === 0) {
          const pierceCount = getPiercingCount(gs.activePowerUps);
          if (pierceCount > 0) {
            const cfg = GameConfig.powerUps.piercingShot;
            const pierceDist = calculatePierceDistance(
              cfg.basePierceDistance,
              cfg.pierceStackMultiplier,
              pierceCount,
            );
            // Direction from projectile at hit moment
            const normDx = dx / dist;
            const normDy = dy / dist;
            proj.pierceDirX = normDx;
            proj.pierceDirY = normDy;
            proj.pierceDistanceLeft = pierceDist;
            proj.isPiercing = true;
            continue; // don't destroy, enter pierce mode
          }
        }

        // No ricochet, no pierce → destroy projectile
        proj.image.destroy();
        proj.glow.destroy();
        this.projectiles.splice(i, 1);
      } else {
        // ── Move toward target ──────────────────────────────
        proj.image.x += (dx / dist) * speed * deltaSec;
        proj.image.y += (dy / dist) * speed * deltaSec;
        proj.image.rotation = Math.atan2(dy, dx) + Math.PI / 2;
        proj.glow.x = proj.image.x;
        proj.glow.y = proj.image.y;
        proj.glow.rotation = proj.image.rotation;

        // ── Bounce timer ────────────────────────────────────
        if (proj.bounceTimer > 0) {
          proj.bounceTimer -= delta;
          if (proj.bounceTimer <= 0) {
            // Timed out — destroy projectile
            proj.image.destroy();
            proj.glow.destroy();
            this.projectiles.splice(i, 1);
          }
        }
      }
    }
  }

  private spawnStar(x: number, y: number): void {
    const star = this.add.image(x, y, 'star');
    star.setDisplaySize(20, 20);
    star.setDepth(8);
    // Continuous rotation (CSS animations lost in Canvas2D)
    this.tweens.add({
      targets: star,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });
    // Float up and fade out
    this.tweens.add({
      targets: star,
      y: y - 25,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => star.destroy(),
    });
  }

  private syncRendering(): void {
    const gs = this.gameState;
    const currentIds = new Set<number>();

    for (const enemy of gs.enemies) {
      if (!enemy.alive) continue;
      currentIds.add(enemy.id);

      let render = this.enemyRenderMap.get(enemy.id);
      if (!render) {
        const roll = Math.random();
        let textureKey: string;
        if (roll < 0.25) {
          textureKey = 'enemy-fighter';
        } else if (roll < 0.5) {
          textureKey = 'enemy-scout';
        } else if (roll < 0.75) {
          textureKey = 'enemy-comet';
        } else {
          textureKey = 'enemy-asteroid';
        }
        const img = this.add.image(enemy.x, enemy.y, textureKey);
        const enemyScale = enemy.width / img.width;
        img.setScale(enemyScale);
        img.setDepth(5);

        // Dark background behind word text for readability
        // Created BEFORE text so text renders on top (depth: bg=6, text=7)
        const textBg = this.add.rectangle(
          enemy.x,
          enemy.y - enemy.height / 2 - 10,
          0,
          18,
          0x000000,
          0.5,
        );
        textBg.setOrigin(0.5, 1); // same origin as text — bottom-aligned
        textBg.setDepth(6);

        const text = this.add.text(
          enemy.x,
          enemy.y - enemy.height / 2 - 10,
          enemy.word,
          {
            fontFamily: GameConfig.wordDisplay.fontFamily,
            fontSize: `${GameConfig.wordDisplay.fontSize}px`,
            color: GameConfig.wordDisplay.color,
          },
        );
        text.setOrigin(0.5, 1); // center horizontally, bottom-aligned
        text.setDepth(7);

        // Size background to match the measured text
        textBg.setSize(text.width + 8, 18);

        render = { image: img, text, textBg };
        this.enemyRenderMap.set(enemy.id, render);

        // Texture-specific tween animations (CSS animations lost in Canvas2D)
        if (textureKey === 'enemy-scout') {
          // Wing flutter: quick scale oscillation on Y axis
          this.tweens.add({
            targets: img,
            scaleY: { from: 1, to: 0.85 },
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          // Bounce: vertical oscillation
          this.tweens.add({
            targets: img,
            y: enemy.y - 3,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else if (textureKey === 'enemy-fighter') {
          // Fighter: scale pulse — breathing/menacing feel
          this.tweens.add({
            targets: img,
            scaleX: { from: 1, to: 1.1 },
            scaleY: { from: 1, to: 0.9 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          // Slower sway (±3° rotation over 1.5s cycle)
          this.tweens.add({
            targets: img,
            angle: { from: -3, to: 3 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else if (textureKey === 'enemy-comet') {
          // Comet: fiery pulse (opacity flicker)
          this.tweens.add({
            targets: img,
            alpha: { from: 0.75, to: 1 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          // Float: gentle vertical drift
          this.tweens.add({
            targets: img,
            y: enemy.y - 4,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else if (textureKey === 'enemy-asteroid') {
          // Asteroid: slow wobble rotation
          this.tweens.add({
            targets: img,
            angle: { from: -5, to: 5 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          // Subtle scale pulse
          this.tweens.add({
            targets: img,
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }

      render.image.setPosition(enemy.x, enemy.y);
      render.text.setPosition(
        enemy.x,
        enemy.y - enemy.height / 2 - 10,
      );
      render.text.setText(enemy.word);
      render.textBg.setPosition(
        enemy.x,
        enemy.y - enemy.height / 2 - 10,
      );
      render.textBg.setSize(render.text.width + 8, 18);
    }

    for (const [id, render] of this.enemyRenderMap) {
      if (!currentIds.has(id)) {
        render.image.destroy();
        render.text.destroy();
        render.textBg.destroy();
        this.enemyRenderMap.delete(id);
      }
    }

    // Player position
    this.playerImage.setPosition(gs.player.x, gs.player.y);
    this.shipPiercing.setPosition(gs.player.x, gs.player.y);
    this.shipRicochet.setPosition(gs.player.x, gs.player.y);
    this.shipExplosive.setPosition(gs.player.x, gs.player.y);
    this.shipDual.setPosition(gs.player.x, gs.player.y);
    this.shipCooling.setPosition(gs.player.x, gs.player.y);
    this.shipSight.setPosition(gs.player.x, gs.player.y);
  }

  private syncAuraRendering(): void {
    const gs = this.gameState;
    const auraActive = gs.activePowerUps.includes('SLOW_AURA');

    if (auraActive) {
      if (!this.auraCircle) {
        const cfg = GameConfig.powerUps.slowingAura;
        const color = parseInt(cfg.color.slice(1), 16);
        this.auraCircle = this.add.circle(
          gs.player.x + gs.player.width / 2,
          gs.player.y + gs.player.height / 2,
          cfg.radius,
          color,
          cfg.alpha,
        );
        this.auraCircle.setDepth(3);
      } else {
        this.auraCircle.setPosition(
          gs.player.x + gs.player.width / 2,
          gs.player.y + gs.player.height / 2,
        );
      }
    } else if (this.auraCircle) {
      this.auraCircle.destroy();
      this.auraCircle = null;
    }
  }

  private syncShipRendering(): void {
    const gs = this.gameState;
    const p = gs.player;
    const playerScale = p.width / this.playerImage.width;

    const ricochetCount = getRicochetBounces(gs.activePowerUps);
    this.shipRicochet.setVisible(ricochetCount > 0);
    if (ricochetCount > 0) {
      this.shipRicochet.setScale(playerScale * (0.8 + ricochetCount * 0.15));
    }

    const pierceCount = getPiercingCount(gs.activePowerUps);
    this.shipPiercing.setVisible(pierceCount > 0);
    if (pierceCount > 0) {
      this.shipPiercing.setScale(playerScale * (1.0 + pierceCount * 0.2));
    }

    this.shipExplosive.setVisible(gs.activePowerUps.includes('EXPLOSIVE_IMPACT'));
    this.shipDual.setVisible(gs.activePowerUps.includes('DUAL_SHOT'));
    this.shipCooling.setVisible(gs.activePowerUps.includes('QUICK_COOLING'));
    this.shipSight.setVisible(gs.activePowerUps.includes('SHARP_SIGHT'));
  }

  private spawnExplosion(x: number, y: number): void {
    const circle = this.add.circle(x, y, 10, 0xFF5252, 0.6);
    circle.setDepth(20);
    this.tweens.add({
      targets: circle,
      radius: 80,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => circle.destroy(),
    });
  }

  private restartGame(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.destroy();
      this.gameOverScreen = null;
    }
    if (this.levelUpScreen) {
      this.levelUpScreen.destroy();
      this.levelUpScreen = null;
    }

    this.playerImage.destroy();
    this.shipPiercing.destroy();
    this.shipRicochet.destroy();
    this.shipExplosive.destroy();
    this.shipDual.destroy();
    this.shipCooling.destroy();
    this.shipSight.destroy();
    for (const [, render] of this.enemyRenderMap) {
      render.image.destroy();
      render.text.destroy();
      render.textBg.destroy();
    }
    this.enemyRenderMap.clear();
    for (const proj of this.projectiles) {
      proj.image.destroy();
      proj.glow.destroy();
    }
    this.projectiles = [];
    for (const item of this.parallaxItems) {
      item.image.destroy();
    }
    this.parallaxItems = [];
    this.tileSprite.destroy();
    this.children.removeAll(true);

    this.create();
  }
}
