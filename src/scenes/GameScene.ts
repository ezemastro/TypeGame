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
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

interface ProjectileRender {
  graphic: Phaser.GameObjects.Rectangle;
  targetId: number;
}

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private playerRect!: Phaser.GameObjects.Rectangle;
  private enemyRenderMap: Map<number, EnemyRender> = new Map();
  private projectiles: ProjectileRender[] = [];
  private hud!: HUD;
  private gameOverScreen: GameOverScreen | null = null;
  private levelUpScreen: LevelUpScreen | null = null;
  private keyHandler?: (event: KeyboardEvent) => void;
  private auraCircle: Phaser.GameObjects.Arc | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // No assets to load for MVP (colored rectangles only)
  }

  create(): void {
    this.gameState = createInitialGameState();
    this.gameState.player = createPlayer();
    this.enemyRenderMap = new Map();
    this.projectiles = [];
    this.gameOverScreen = null;
    this.levelUpScreen = null;
    this.auraCircle = null;

    // Player rectangle
    const p = this.gameState.player;
    this.playerRect = this.add.rectangle(
      p.x, p.y, p.width, p.height,
      parseInt(p.color.slice(1), 16),
    );

    // HUD
    this.hud = createHUD(this);

    // Keyboard input — remove old listener before re-adding (prevents leaks on restart)
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
      // Don't capture letters while paused (level-up screen handles 1/2/3)
      if (this.gameState.isPaused) return;
      if (event.key.length === 1 && /^[A-Za-z]$/.test(event.key)) {
        this.gameState.pendingKeys.push(event.key.toUpperCase());
      }
    };
    this.input.keyboard!.on('keydown', this.keyHandler);
  }

  update(_time: number, delta: number): void {
    if (this.gameState.gameOver) return;

    const gs = this.gameState;

    // If paused (level-up screen), skip all game systems but still render
    if (gs.isPaused) {
      // Show level-up screen if not already shown and choices exist
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

    // Run systems in deterministic order
    spawnSystem(gs, delta);
    movementSystem(gs, delta);

    // Always decrement cooldown every frame (even when idle) so cooldown
    // can expire naturally over time without requiring key presses.
    combatSystem(gs, delta);

    // Process pending keys. Only consume a key if the shot fired (justFired)
    // or the key was a miss (no target). If a valid target was found but
    // cooldown/overheat blocked the shot, leave the key in the queue to
    // retry next frame so rapid keypresses aren't lost.
    while (gs.pendingKeys.length > 0) {
      const key = gs.pendingKeys[0]; // peek, don't consume yet
      gs.lastKeyPressed = key;
      targetSystem(gs);

      // Forgiveness: if the key doesn't match any current enemy but it was
      // recently destroyed by a power-up (Piercing Shot, Dual Shot, etc.),
      // treat it as forgiven — consume the key silently, no heat.
      if (gs.targetedEnemyId === null) {
        const fi = gs.forgivenKeys.findIndex((f) => f.key === key);
        if (fi !== -1) {
          gs.forgivenKeys.splice(fi, 1);
          gs.pendingKeys.shift();
          continue; // skip combat/heat for this forgiven key
        }
      }

      const hadTarget = gs.targetedEnemyId !== null;
      combatSystem(gs, delta);

      if (gs.justFired || !hadTarget || gs.overheated) {
        gs.pendingKeys.shift(); // consume — shot fired, miss, or overheated
      } else {
        break; // cooldown blocked — leave key for next frame
      }
    }

    heatBarSystem(gs, delta);
    difficultySystem(gs, delta);

    // Clean up expired forgiven keys (older than 1 second)
    gs.forgivenKeys = gs.forgivenKeys.filter((f) => f.expiresAt > gs.elapsedTime);

    xpSystem(gs);
    scoreSystem(gs);
    collisionSystem(gs);

    // Remove dead enemies from the array so they don't block spawning
    gs.enemies = gs.enemies.filter((e) => e.alive);

    // If game over just triggered, show overlay
    if (gs.gameOver) {
      this.gameOverScreen = showGameOver(this, gs.score);
      return;
    }

    // Handle projectile creation
    if (gs.justFired) {
      if (gs.targetedEnemyId !== null) {
        this.spawnProjectile();
      }
      if (gs.secondaryTargetId !== null) {
        this.spawnSecondaryProjectile();
      }
      gs.justFired = false;
    }

    // Update projectiles
    this.updateProjectiles(delta);

    // Sync rendering
    this.syncAuraRendering();
    this.syncRendering();

    // Update HUD
    this.hud.update(gs);

    // Reset per-frame state
    gs.lastKeyPressed = null;
    gs.targetedEnemyId = null;
    gs.secondaryTargetId = null;
  }

  private spawnProjectile(): void {
    const p = this.gameState.player;
    const proj = this.add.rectangle(
      p.x, p.y - p.height / 2,
      GameConfig.shooting.projectileWidth,
      GameConfig.shooting.projectileHeight,
      parseInt(GameConfig.shooting.projectileColor.slice(1), 16),
    );
    this.projectiles.push({
      graphic: proj,
      targetId: this.gameState.targetedEnemyId!,
    });
  }

  private spawnSecondaryProjectile(): void {
    const p = this.gameState.player;
    const offsetX = 8; // slight horizontal offset so both projectiles are visible
    const proj = this.add.rectangle(
      p.x + offsetX, p.y - p.height / 2,
      GameConfig.shooting.projectileWidth,
      GameConfig.shooting.projectileHeight,
      parseInt(GameConfig.shooting.projectileColor.slice(1), 16),
    );
    this.projectiles.push({
      graphic: proj,
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
        proj.graphic.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const tx = target.x + target.width / 2;
      const ty = target.y + target.height / 2;
      const dx = tx - proj.graphic.x;
      const dy = ty - proj.graphic.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < speed * deltaSec) {
        // Projectile reached target
        if (target.pendingDestruction) {
          target.alive = false;
          this.gameState.gearDropped = true;
        }
        proj.graphic.destroy();
        this.projectiles.splice(i, 1);
      } else {
        proj.graphic.x += (dx / dist) * speed * deltaSec;
        proj.graphic.y += (dy / dist) * speed * deltaSec;
      }
    }
  }

  private syncRendering(): void {
    const gs = this.gameState;
    const currentIds = new Set<number>();

    for (const enemy of gs.enemies) {
      if (!enemy.alive) continue;
      currentIds.add(enemy.id);

      let render = this.enemyRenderMap.get(enemy.id);
      if (!render) {
        const rect = this.add.rectangle(
          enemy.x, enemy.y, enemy.width, enemy.height,
          parseInt(enemy.color.slice(1), 16),
        );
        const text = this.add.text(
          enemy.x - enemy.width / 2,
          enemy.y - enemy.height,
          enemy.word,
          {
            fontFamily: GameConfig.wordDisplay.fontFamily,
            fontSize: `${GameConfig.wordDisplay.fontSize}px`,
            color: GameConfig.wordDisplay.color,
          },
        );
        render = { rect, text };
        this.enemyRenderMap.set(enemy.id, render);
      }

      render.rect.setPosition(enemy.x, enemy.y);
      render.text.setPosition(
        enemy.x - enemy.width / 2,
        enemy.y - enemy.height,
      );
      render.text.setText(enemy.word);
    }

    for (const [id, render] of this.enemyRenderMap) {
      if (!currentIds.has(id)) {
        render.rect.destroy();
        render.text.destroy();
        this.enemyRenderMap.delete(id);
      }
    }
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
        this.auraCircle.setDepth(-1); // behind enemies
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
    // Clean up game over overlay
    if (this.gameOverScreen) {
      this.gameOverScreen.destroy();
      this.gameOverScreen = null;
    }
    if (this.levelUpScreen) {
      this.levelUpScreen.destroy();
      this.levelUpScreen = null;
    }

    // Clean up all game objects
    this.playerRect.destroy();
    for (const [, render] of this.enemyRenderMap) {
      render.rect.destroy();
      render.text.destroy();
    }
    this.enemyRenderMap.clear();
    for (const proj of this.projectiles) {
      proj.graphic.destroy();
    }
    this.projectiles = [];
    this.children.removeAll(true);

    // Re-create the scene
    this.create();
  }
}
