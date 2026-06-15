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

interface EnemyRender {
  image: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
  textBg: Phaser.GameObjects.Rectangle;
}

interface ProjectileRender {
  image: Phaser.GameObjects.Image;
  targetId: number;
}

interface ParallaxItem {
  image: Phaser.GameObjects.Image;
  speed: number;
}

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private playerImage!: Phaser.GameObjects.Image;
  private enemyRenderMap: Map<number, EnemyRender> = new Map();
  private projectiles: ProjectileRender[] = [];
  private hud!: HUD;
  private gameOverScreen: GameOverScreen | null = null;
  private levelUpScreen: LevelUpScreen | null = null;
  private keyHandler?: (event: KeyboardEvent) => void;
  private auraCircle: Phaser.GameObjects.Arc | null = null;
  private tileSprite!: Phaser.GameObjects.TileSprite;
  private parallaxItems: ParallaxItem[] = [];
  private weaponImage!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Assets loaded in BootScene
  }

  create(): void {
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
      'tile-floor',
    );
    this.tileSprite.setDepth(0);

    // Parallax environment (trees, rocks, bushes)
    this.spawnParallaxItems();

    // Player image
    const p = this.gameState.player;
    this.playerImage = this.add.image(p.x, p.y, 'robot');
    const playerScale = p.width / this.playerImage.width;
    this.playerImage.setScale(playerScale);
    this.playerImage.setDepth(10);

    // Player continuous bounce tween (CSS animations lost in Canvas2D)
    this.tweens.add({
      targets: this.playerImage,
      y: p.y - 2,       // bounce up 2px
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Weapon HUD (top-right)
    this.weaponImage = this.add.image(
      GameConfig.canvas.width - 50, 28,
      'weapon-base',
    );
    this.weaponImage.setScrollFactor(0);
    this.weaponImage.setDepth(100);
    this.weaponImage.setScale(0.8);

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
      if (this.gameState.isPaused) return;
      if (event.key.length === 1 && /^[A-Za-z]$/.test(event.key)) {
        this.gameState.pendingKeys.push(event.key.toUpperCase());
      }
    };
    this.input.keyboard!.on('keydown', this.keyHandler);
  }

  private spawnParallaxItems(): void {
    const textures = ['tree', 'rock', 'bush'];
    for (let i = 0; i < 6; i++) {
      const texture = Phaser.Utils.Array.GetRandom(textures);
      const item = this.add.image(
        Phaser.Math.Between(40, GameConfig.canvas.width - 40),
        Phaser.Math.Between(-100, GameConfig.canvas.height),
        texture,
      );
      item.setDepth(1);
      item.setScale(Phaser.Math.FloatBetween(0.5, 0.8));
      this.parallaxItems.push({ image: item, speed: 1 });
    }
  }

  update(_time: number, delta: number): void {
    if (this.gameState.gameOver) return;

    const gs = this.gameState;

    // Background scroll — scroll toward the player (world moves toward camera)
    const scrollSpeed = GameConfig.world.scrollSpeed;
    this.tileSprite.tilePositionY -= scrollSpeed * (delta / 1000);

    // Parallax movement — trees/rocks/bushes move toward player (same direction as tile)
    for (const item of this.parallaxItems) {
      item.image.y += scrollSpeed * item.speed * (delta / 1000);
      if (item.image.y > GameConfig.canvas.height + 60) {
        item.image.y = -60;
        item.image.x = Phaser.Math.Between(20, GameConfig.canvas.width - 20);
      }
    }

    // If paused (level-up screen), skip all game systems but still render
    if (gs.isPaused) {
      if (!this.levelUpScreen && gs.levelUpChoices.length > 0) {
        this.levelUpScreen = showLevelUp(this, gs.levelUpChoices, (powerUpId: string) => {
          gs.activePowerUps.push(powerUpId);
          gs.levelUpChoices = [];
          gs.isPaused = false;
          if (this.levelUpScreen) {
            this.levelUpScreen.destroy();
          }
          this.levelUpScreen = null;
        });
      }
      this.syncAuraRendering();
      this.syncRendering();
      this.hud.update(gs);
      return;
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

    // Fallback: if bullet texture fails, draw a green rectangle
    if (!this.textures.exists('bullet')) {
      const rect = this.add.rectangle(p.x, p.y - p.height / 2, texW, texH, 0x00ff88);
      rect.setDepth(15);
      this.projectiles.push({
        image: rect as unknown as Phaser.GameObjects.Image,
        targetId: this.gameState.targetedEnemyId!,
      });
      return;
    }

    const img = this.add.image(p.x, p.y - p.height / 2, 'bullet');
    img.setDisplaySize(texW, texH);
    img.setDepth(15);
    this.projectiles.push({
      image: img,
      targetId: this.gameState.targetedEnemyId!,
    });
  }

  private spawnSecondaryProjectile(): void {
    const p = this.gameState.player;
    const texW = GameConfig.shooting.projectileWidth;
    const texH = GameConfig.shooting.projectileHeight;

    // Fallback: if bullet texture fails, draw a green rectangle
    if (!this.textures.exists('bullet')) {
      const rect = this.add.rectangle(p.x + 8, p.y - p.height / 2, texW, texH, 0x00ff88);
      rect.setDepth(15);
      this.projectiles.push({
        image: rect as unknown as Phaser.GameObjects.Image,
        targetId: this.gameState.secondaryTargetId!,
      });
      return;
    }

    const img = this.add.image(p.x + 8, p.y - p.height / 2, 'bullet');
    img.setDisplaySize(texW, texH);
    img.setDepth(15);
    this.projectiles.push({
      image: img,
      targetId: this.gameState.secondaryTargetId!,
    });
  }

  private updateProjectiles(delta: number): void {
    const deltaSec = delta / 1000;
    const speed = GameConfig.shooting.projectileSpeed;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const target = this.gameState.enemies.find(
        (e) => e.id === proj.targetId && e.alive,
      );

      if (!target) {
        proj.image.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const tx = target.x + target.width / 2;
      const ty = target.y + target.height / 2;
      const dx = tx - proj.image.x;
      const dy = ty - proj.image.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < speed * deltaSec) {
        if (target.pendingDestruction) {
          target.alive = false;
          this.gameState.gearDropped = true;
          this.spawnGear(target.x, target.y);
        }
        proj.image.destroy();
        this.projectiles.splice(i, 1);
      } else {
        proj.image.x += (dx / dist) * speed * deltaSec;
        proj.image.y += (dy / dist) * speed * deltaSec;
      }
    }
  }

  private spawnGear(x: number, y: number): void {
    const gear = this.add.image(x, y, 'gear');
    gear.setDisplaySize(20, 20);
    gear.setDepth(8);
    // Continuous rotation (CSS animations lost in Canvas2D)
    this.tweens.add({
      targets: gear,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });
    // Float up and fade out
    this.tweens.add({
      targets: gear,
      y: y - 25,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => gear.destroy(),
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
        const textureKey = Math.random() > 0.5 ? 'enemy-robot' : 'enemy-bug';
        const img = this.add.image(enemy.x, enemy.y, textureKey);
        const enemyScale = enemy.width / img.width;
        img.setScale(enemyScale);
        img.setDepth(5);

        // Dark background behind word text for readability
        // Created BEFORE text so text renders on top (depth: bg=5, text=6)
        const textBg = this.add.rectangle(
          enemy.x,
          enemy.y - enemy.height / 2 - 10,
          0,
          18,
          0x000000,
          0.5,
        );
        textBg.setOrigin(0.5, 1); // same origin as text — bottom-aligned
        textBg.setDepth(5);

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
        text.setDepth(6);

        // Size background to match the measured text
        textBg.setSize(text.width + 8, 18);

        render = { image: img, text, textBg };
        this.enemyRenderMap.set(enemy.id, render);

        // Texture-specific tween animations (CSS animations lost in Canvas2D)
        if (textureKey === 'enemy-bug') {
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
        } else {
          // Robot: scale pulse — breathing/menacing feel
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
        this.auraCircle.setDepth(2);
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
    for (const [, render] of this.enemyRenderMap) {
      render.image.destroy();
      render.text.destroy();
      render.textBg.destroy();
    }
    this.enemyRenderMap.clear();
    for (const proj of this.projectiles) {
      proj.image.destroy();
    }
    this.projectiles = [];
    for (const item of this.parallaxItems) {
      item.image.destroy();
    }
    this.parallaxItems = [];
    this.tileSprite.destroy();
    this.weaponImage.destroy();
    this.children.removeAll(true);

    this.create();
  }
}
