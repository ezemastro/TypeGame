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
import { powerUpSystem } from '../systems/PowerUpSystem';
import {
  getEnemiesInRadius,
  calculateBurstAngles,
  findNthClosestEnemy,
  getShieldCircleRadii,
  mapDevKeyToPowerUp,
} from '../systems/PowerUpHelpers';
import { findNearestEnemy } from '../systems/ProjectileHelpers';
import { createHUD, type HUD } from '../ui/HUD';
import { showGameOver, type GameOverScreen } from '../ui/GameOverScreen';
import { showLevelUp, type LevelUpScreen } from '../ui/LevelUpScreen';
import { GameConfig } from '../config';

interface EnemyRender {
  image: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
  textBg: Phaser.GameObjects.Rectangle;
}

interface ProjectileRender {
  image: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  targetId: number;
  hasPierced: boolean;
  bouncesLeft: number;
  bounceTimer: number;
  pierceDistanceLeft: number;
  isPiercing: boolean;
  pierceDirX: number;
  pierceDirY: number;
  hasHitPrimary: boolean;
  lastDirX: number;
  lastDirY: number;
  pierceHitsLeft: number;
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
  // PowerUp rendering state
  private shieldCircles: Phaser.GameObjects.Arc[] = [];
  private allyDrones: Phaser.GameObjects.Container[] = [];
  private allyTimers: Phaser.Time.TimerEvent[] = [];
  private magneticFieldRing: Phaser.GameObjects.Arc | null = null;
  private freezeOverlay: Phaser.GameObjects.Rectangle | null = null;
  private freezeVfxTriggered: boolean = false;

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
    this.shieldCircles = [];
    this.allyDrones = [];
    this.allyTimers = [];
    this.magneticFieldRing = null;
    this.freezeOverlay = null;
    this.freezeVfxTriggered = false;
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
    this.shipPiercing.setScale(playerScale * 1.3).setDepth(11).setVisible(false);

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
      // Dev mode: number keys activate powerups without level-up
      if (import.meta.env.DEV && !this.gameState.isPaused) {
        const powerUpId = mapDevKeyToPowerUp(event.key);
        if (powerUpId) {
          // Shield and ally stack: add charge/ally every keypress
          if (powerUpId === 'SHIELD') {
            if (!this.gameState.activePowerUps.includes(powerUpId)) {
              this.gameState.activePowerUps.push(powerUpId);
            }
            this.gameState.powerUpState.shieldCharges += 1;
            return;
          }
          if (powerUpId === 'ALLY') {
            if (!this.gameState.activePowerUps.includes(powerUpId)) {
              this.gameState.activePowerUps.push(powerUpId);
            }
            this.gameState.powerUpState.allyCount += 1;
            return;
          }
          // All other powerups: push multiple times for stacking
          this.gameState.activePowerUps.push(powerUpId);
          return;
        }
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
      this.syncShieldRendering();
      this.syncAllyRendering();
      this.syncMagneticFieldRing();
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
    powerUpSystem(gs, delta);
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

    // Clean up zombie enemies with no projectiles heading to them
    // Also skip if justFired is true (bullet spawning next frame)
    const targetedIds = new Set(this.projectiles.map(p => p.targetId));
    for (const enemy of gs.enemies) {
      if (enemy.alive && enemy.word.length === 0 && enemy.pendingDestruction && !targetedIds.has(enemy.id)) {
        // Skip if a bullet was just ordered for this enemy (spawns next frame)
        if (gs.justFired && gs.targetedEnemyId === enemy.id) continue;
        enemy.alive = false;
        gs.gearDropped = true;
        this.spawnStar(enemy.x, enemy.y);
      }
    }

    gs.enemies = gs.enemies.filter((e) => e.alive);

    // Freeze time-scale management (3.4)
    this.handleFreezeTimeScale(gs);

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

    // Life steal: reduce heat on kill (3.7)
    this.handleLifeSteal(gs);

    this.syncAuraRendering();
    this.syncShipRendering();
    this.syncShieldRendering();
    this.syncAllyRendering();
    this.syncMagneticFieldRing();
    this.syncRendering();
    this.hud.update(gs);

    gs.lastKeyPressed = null;
    gs.targetedEnemyId = null;
    gs.secondaryTargetId = null;
  }

  private spawnProjectile(): void {
    const gs = this.gameState;
    const originX = gs.player.x;
    const originY = gs.player.y - gs.player.height / 2;

    // Look up target to determine canKill from pendingDestruction
    const target = gs.enemies.find((e) => e.id === gs.targetedEnemyId && e.alive);
    const canKill = target?.pendingDestruction ?? false;

    // Burst fire: spawn two projectiles at slight angle offset (3.3)
    if (gs.activePowerUps.includes('BURST_FIRE') && gs.targetedEnemyId !== null) {
      const spreadDeg = GameConfig.powerUps.burstFire.spreadDegrees;
      // Compute base angle from player to target for direction offset
      if (target) {
        const baseAngle = Math.atan2(
          (target.y) - gs.player.y,
          (target.x) - gs.player.x,
        );
        const [angleA, angleB] = calculateBurstAngles(baseAngle, spreadDeg);
        this.createProjectileAt(originX, originY, gs.targetedEnemyId, canKill, angleA);
        this.createProjectileAt(originX + 4, originY, gs.targetedEnemyId, canKill, angleB);
        return;
      }
    }

    this.createProjectileAt(originX, originY, gs.targetedEnemyId!, canKill);
  }

  /** Create a single projectile at origin targeting enemyId. */
  private createProjectileAt(originX: number, originY: number, targetId: number, canKill: boolean, _angle?: number): void {
    const texW = GameConfig.shooting.projectileWidth;
    const texH = GameConfig.shooting.projectileHeight;

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
        targetId,
        hasPierced: false,
        bouncesLeft: 0,
        bounceTimer: 0,
        pierceDistanceLeft: 0,
        isPiercing: false,
        pierceDirX: 0,
        pierceDirY: 0,
        hasHitPrimary: false,
        lastDirX: 0,
        lastDirY: 0,
        pierceHitsLeft: 0,
        canKill,
        hitEnemyIds: new Set(),
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
      targetId,
      hasPierced: false,
      bouncesLeft: 0,
      bounceTimer: 0,
      pierceDistanceLeft: 0,
      isPiercing: false,
      pierceDirX: 0,
      pierceDirY: 0,
      hasHitPrimary: false,
        lastDirX: 0,
        lastDirY: 0,
        pierceHitsLeft: 0,
      canKill,
      hitEnemyIds: new Set(),
    });
  }

  private spawnSecondaryProjectile(): void {
    const p = this.gameState.player;
    const gs = this.gameState;
    const texW = GameConfig.shooting.projectileWidth;
    const texH = GameConfig.shooting.projectileHeight;
    const originX = p.x + 8;
    const originY = p.y - p.height / 2;

    // Determine canKill from secondary target's pendingDestruction
    const secTarget = gs.enemies.find((e) => e.id === gs.secondaryTargetId && e.alive);
    const canKill = secTarget?.pendingDestruction ?? false;

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
        hasPierced: false,
        bouncesLeft: 0,
        bounceTimer: 0,
        pierceDistanceLeft: 0,
        isPiercing: false,
        pierceDirX: 0,
        pierceDirY: 0,
        hasHitPrimary: false,
        lastDirX: 0,
        lastDirY: 0,
        pierceHitsLeft: 0,
        canKill,
        hitEnemyIds: new Set(),
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
      hasPierced: false,
      bouncesLeft: 0,
      bounceTimer: 0,
      pierceDistanceLeft: 0,
      isPiercing: false,
      pierceDirX: 0,
      pierceDirY: 0,
      hasHitPrimary: false,
        lastDirX: 0,
        lastDirY: 0,
        pierceHitsLeft: 0,
      canKill,
      hitEnemyIds: new Set(),
    });
  }

  private updateProjectiles(delta: number): void {
    const deltaSec = delta / 1000;
    const speed = GameConfig.shooting.projectileSpeed;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // Handle bounce timer — counts down while flying to new target
      if (proj.bounceTimer > 0) {
        proj.bounceTimer -= delta;
        if (proj.bounceTimer <= 0) {
          // Failed to reach new target in time — destroy projectile
          proj.image.destroy();
          proj.glow.destroy();
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Handle pierce flight (straight line, not homing)
      if (proj.isPiercing && proj.pierceDistanceLeft > 0) {
        const moveX = proj.pierceDirX * speed * deltaSec;
        const moveY = proj.pierceDirY * speed * deltaSec;
        proj.image.x += moveX;
        proj.image.y += moveY;
        proj.pierceDistanceLeft -= Math.sqrt(moveX * moveX + moveY * moveY);
        proj.glow.x = proj.image.x;
        proj.glow.y = proj.image.y;

        // Check collision with all enemies during pierce
        const gs = this.gameState;
        const pierceCount = gs.activePowerUps.filter(id => id === 'PIERCING_SHOT').length;
        for (const enemy of gs.enemies) {
          if (!enemy.alive || enemy.id === proj.targetId || proj.hitEnemyIds.has(enemy.id)) continue;
          const ex = enemy.x;
          const ey = enemy.y;
          const edx = ex - proj.image.x;
          const edy = ey - proj.image.y;
          const edist = Math.sqrt(edx * edx + edy * edy);
          if (edist < 20) {
            if (enemy.word.length > 0) {
              enemy.word = enemy.word.slice(1);
              if (enemy.word.length === 0) {
                enemy.alive = false;
                gs.gearDropped = true;
                this.spawnStar(enemy.x, enemy.y);
              }
            }
            proj.hitEnemyIds.add(enemy.id);
            proj.pierceHitsLeft -= 1;
            if (proj.pierceHitsLeft <= 0) {
              // No more pierce hits — reset distance to destroy
              proj.pierceDistanceLeft = 0;
            } else {
              // Still have hits left — reset distance scaled by stack count
              proj.pierceDistanceLeft = 80 * (1 + 0.5 * pierceCount);
            }
            break;
          }
        }

        if (proj.pierceDistanceLeft <= 0) {
          proj.image.destroy();
          proj.glow.destroy();
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      const target = this.gameState.enemies.find(
        (e) => e.id === proj.targetId && e.alive,
      );

      if (!target) {
        proj.image.destroy();
        proj.glow.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const tx = target.x;
      const ty = target.y;
      const dx = tx - proj.image.x;
      const dy = ty - proj.image.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < speed * deltaSec) {
        // Track this enemy as already hit by this projectile
        proj.hitEnemyIds.add(proj.targetId);

        if (target.pendingDestruction && proj.canKill) {
          target.alive = false;
          this.gameState.gearDropped = true;
          this.spawnStar(target.x, target.y);
          // Explosive Impact VFX
          if (this.gameState.activePowerUps.includes('EXPLOSIVE_IMPACT')) {
            this.spawnExplosion(target.x, target.y);
            // Explosive push tween: push enemies within 150px (3.2)
            this.applyExplosivePush(target.x, target.y);
          }
        } else if (proj.hasHitPrimary) {
          // Bounce/pierce hit (already hit primary): strip first letter of secondary target
          if (target.word.length > 0) {
            target.word = target.word.slice(1);
            if (target.word.length === 0) {
              target.alive = false;
              this.gameState.gearDropped = true;
              this.spawnStar(target.x, target.y);
            }
          }
        }

        const gs = this.gameState;

        // RICOCHET: bounce to nearest enemy from impact point
        const ricochetCount = gs.activePowerUps.filter(id => id === 'RICOCHET').length;
        if (ricochetCount > 0 && proj.bouncesLeft === 0 && !proj.hasHitPrimary) {
          proj.bouncesLeft = ricochetCount;
        }

        // Mark primary hit on ALL projectile types, not just ricochet
        proj.hasHitPrimary = true;

        if (proj.bouncesLeft > 0) {
          const nearest = findNearestEnemy(gs.enemies, proj.image.x, proj.image.y, proj.hitEnemyIds);
          if (nearest) {
            proj.targetId = nearest.id;
            proj.bouncesLeft -= 1;
            proj.bounceTimer = 500;
            continue;
          }
        }

        // PIERCING_SHOT: straight-line pierce after bounces exhausted
        const pierceCount = gs.activePowerUps.filter(id => id === 'PIERCING_SHOT').length;
        if (pierceCount > 0 && proj.bouncesLeft <= 0 && !proj.isPiercing) {
          proj.isPiercing = true;
          proj.pierceDistanceLeft = 80 * (1 + 0.5 * pierceCount);
          proj.pierceHitsLeft = pierceCount; // one hit per stack level
          // Use projectile's actual travel direction, not direction to target
          proj.pierceDirX = proj.lastDirX || (dx / dist);
          proj.pierceDirY = proj.lastDirY || (dy / dist);
          continue;
        }

        proj.image.destroy();
        proj.glow.destroy();
        this.projectiles.splice(i, 1);
      } else {
        proj.image.x += (dx / dist) * speed * deltaSec;
        proj.image.y += (dy / dist) * speed * deltaSec;
        proj.image.rotation = Math.atan2(dy, dx) + Math.PI / 2;
        proj.glow.x = proj.image.x;
        proj.glow.y = proj.image.y;
        proj.glow.rotation = proj.image.rotation;
        // Save travel direction for pierce
        proj.lastDirX = dx / dist;
        proj.lastDirY = dy / dist;
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
          gs.player.x,
          gs.player.y,
          cfg.radius,
          color,
          cfg.alpha,
        );
        this.auraCircle.setDepth(3);
      } else {
        this.auraCircle.setPosition(
          gs.player.x,
          gs.player.y,
        );
      }
    } else if (this.auraCircle) {
      this.auraCircle.destroy();
      this.auraCircle = null;
    }
  }

  private syncShipRendering(): void {
    const gs = this.gameState;
    const playerScale = gs.player.width / this.playerImage.width;

    const pierceCount = gs.activePowerUps.filter(id => id === 'PIERCING_SHOT').length;
    this.shipPiercing.setVisible(pierceCount > 0);
    if (pierceCount > 0) {
      this.shipPiercing.setScale(playerScale * (1.3 + pierceCount * 0.2));
    }

    const ricochetCount = gs.activePowerUps.filter(id => id === 'RICOCHET').length;
    this.shipRicochet.setVisible(ricochetCount > 0);
    if (ricochetCount > 0) {
      this.shipRicochet.setScale(playerScale * (0.8 + ricochetCount * 0.15));
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

  // ── 3.2 Explosive Push ────────────────────────────────────────────

  private applyExplosivePush(cx: number, cy: number): void {
    const gs = this.gameState;
    const cfg = GameConfig.powerUps.explosiveImpact;
    const pushed = getEnemiesInRadius(gs, cx, cy, cfg.pushRadius);

    for (const enemy of pushed) {
      const ecx = enemy.x;
      const ecy = enemy.y;
      const dx = ecx - cx;
      const dy = ecy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const pushDist = cfg.pushStrength;

      const targetX = enemy.x + nx * pushDist;
      const targetY = enemy.y + ny * pushDist;

      // Tween enemy position for explosive push VFX
      const render = this.enemyRenderMap.get(enemy.id);
      if (render) {
        this.tweens.add({
          targets: render.image,
          x: targetX,
          y: targetY,
          duration: 200,
          ease: 'Power2',
          onUpdate: () => {
            // Sync enemy state position while tweening
            enemy.x = render.image.x;
            enemy.y = render.image.y;
          },
        });
      }
    }
  }

  // ── 3.4 Freeze Time-Scale ─────────────────────────────────────────

  private handleFreezeTimeScale(gs: GameState): void {
    const freezeCfg = GameConfig.powerUps.freeze;
    const isFrozen = gs.powerUpState.freezeActiveUntil > gs.elapsedTime;

    if (isFrozen) {
      this.time.timeScale = freezeCfg.timeScale;
      this.tweens.timeScale = freezeCfg.timeScale;

      // Ice wave VFX when freeze just activated
      if (!this.freezeVfxTriggered) {
        this.freezeVfxTriggered = true;
        this.spawnIceWave(gs.player.x, gs.player.y);

        // Background tint
        if (!this.freezeOverlay) {
          this.freezeOverlay = this.add.rectangle(
            GameConfig.canvas.width / 2,
            GameConfig.canvas.height / 2,
            GameConfig.canvas.width,
            GameConfig.canvas.height,
            0x1A237E,
            0.1,
          );
          this.freezeOverlay.setDepth(90);
        }
      }
    } else {
      // Freeze expired — restore time scales
      if (this.freezeVfxTriggered) {
        this.time.timeScale = 1;
        this.tweens.timeScale = 1;
        this.freezeVfxTriggered = false;

        if (this.freezeOverlay) {
          this.freezeOverlay.destroy();
          this.freezeOverlay = null;
        }
      }
    }
  }

  private spawnIceWave(x: number, y: number): void {
    const ring = this.add.circle(x, y, 10, 0x80DEEA, 0.4);
    ring.setDepth(91);
    this.tweens.add({
      targets: ring,
      radius: 300,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  // ── 3.7 Life Steal ────────────────────────────────────────────────

  private handleLifeSteal(gs: GameState): void {
    if (!gs.gearDropped) return;
    if (!gs.activePowerUps.includes('LIFE_STEAL')) return;

    // Count how many LIFE_STEAL stacks the player has
    const stacks = gs.activePowerUps.filter((id) => id === 'LIFE_STEAL').length;
    const reduction = stacks * GameConfig.powerUps.lifeSteal.heatReduction;

    gs.heatSegments = Math.max(0, gs.heatSegments - reduction);
  }

  // ── 3.5 Shield Concentric Circles ─────────────────────────────────

  private syncShieldRendering(): void {
    const gs = this.gameState;
    const cfg = GameConfig.powerUps.shield;
    const charges = gs.powerUpState.shieldCharges;

    // Remove excess circles
    while (this.shieldCircles.length > charges) {
      const circle = this.shieldCircles.pop()!;
      circle.destroy();
    }

    // Add circles if needed
    const radii = getShieldCircleRadii(charges, cfg.circleRadius, cfg.radiusStep);
    const px = gs.player.x;
    const py = gs.player.y;
    const color = parseInt(cfg.color.slice(1), 16);

    for (let i = 0; i < radii.length; i++) {
      if (i < this.shieldCircles.length) {
        // Update existing
        this.shieldCircles[i].setPosition(px, py);
        this.shieldCircles[i].setRadius(radii[i]);
      } else {
        // Create new
        const circle = this.add.circle(px, py, radii[i], color, 0);
        circle.setStrokeStyle(2, color, cfg.alpha);
        circle.setDepth(12);
        this.shieldCircles.push(circle);
      }
    }
  }

  // ── 3.6 Ally Drone ────────────────────────────────────────────────

  private syncAllyRendering(): void {
    const gs = this.gameState;
    const allyCfg = GameConfig.powerUps.ally;
    const targetCount = gs.powerUpState.allyCount;

    // Remove excess drones and their timers
    while (this.allyDrones.length > targetCount) {
      const drone = this.allyDrones.pop()!;
      drone.destroy();
      const timer = this.allyTimers.pop()!;
      timer.destroy();
    }

    // Add drones if needed
    const px = gs.player.x;
    const py = gs.player.y;

    for (let i = 0; i < targetCount; i++) {
      // Alternating positions: even → right, odd → left
      const side = i % 2 === 0 ? 1 : -1;
      const step = Math.floor(i / 2) + 1;
      const droneX = px + side * step * allyCfg.horizontalOffset;
      const droneY = py;
      // Random color per drone, seeded by index
      const hue = (i * 137 + 42) % 360;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.55).color;

      if (i < this.allyDrones.length) {
        this.allyDrones[i].setPosition(droneX, droneY);
      } else {
        const container = this.add.container(droneX, droneY);
        container.setDepth(13);

        // Drone body: main circle
        const body = this.add.circle(0, 0, 8, color);
        container.add(body);
        // Cockpit: smaller centered circle, slightly lighter
        const lighter = Phaser.Display.Color.ValueToColor(color).lighten(30).color;
        const cockpit = this.add.circle(0, 0, 4, lighter);
        container.add(cockpit);
        // Left wing
        const wingL = this.add.rectangle(-10, 0, 6, 3, color);
        container.add(wingL);
        // Right wing
        const wingR = this.add.rectangle(10, 0, 6, 3, color);
        container.add(wingR);
        // Weapon barrel: small rect pointing forward (up)
        const weapon = this.add.rectangle(0, -10, 2, 5, lighter);
        container.add(weapon);

        this.allyDrones.push(container);

        // Auto-fire timer: targets second-closest enemy
        const timer = this.time.addEvent({
          delay: allyCfg.fireRateMs,
          loop: true,
          callback: () => {
            if (gs.gameOver || gs.isPaused) return;
            const target = findNthClosestEnemy(gs, px, py, 2);
            if (target) {
              this.createProjectileAt(container.x, container.y, target.id, target.pendingDestruction ?? false);
            }
          },
        });
        this.allyTimers.push(timer);
      }
    }
  }

  // ── 3.7 Magnetic Field Ring ───────────────────────────────────────

  private syncMagneticFieldRing(): void {
    const gs = this.gameState;
    const active = gs.activePowerUps.includes('MAGNETIC_FIELD');
    const cfg = GameConfig.powerUps.magneticField;

    if (active) {
      const px = gs.player.x;
      const py = gs.player.y;
      const color = parseInt(cfg.ringColor.slice(1), 16);

      if (!this.magneticFieldRing) {
        this.magneticFieldRing = this.add.circle(px, py, cfg.radius, color, 0);
        this.magneticFieldRing.setStrokeStyle(1, color, cfg.ringAlpha);
        this.magneticFieldRing.setDepth(3);
      } else {
        this.magneticFieldRing.setPosition(px, py);
      }
    } else if (this.magneticFieldRing) {
      this.magneticFieldRing.destroy();
      this.magneticFieldRing = null;
    }
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
    // Cleanup powerup visuals
    for (const c of this.shieldCircles) c.destroy();
    this.shieldCircles = [];
    for (const d of this.allyDrones) d.destroy();
    this.allyDrones = [];
    for (const t of this.allyTimers) t.destroy();
    this.allyTimers = [];
    if (this.magneticFieldRing) {
      this.magneticFieldRing.destroy();
      this.magneticFieldRing = null;
    }
    if (this.freezeOverlay) {
      this.freezeOverlay.destroy();
      this.freezeOverlay = null;
    }
    this.tileSprite.destroy();
    this.children.removeAll(true);

    this.create();
  }
}
