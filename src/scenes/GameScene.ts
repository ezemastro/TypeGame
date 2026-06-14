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
import { collisionSystem } from '../systems/CollisionSystem';
import { createHUD, type HUD } from '../ui/HUD';
import { showGameOver, type GameOverScreen } from '../ui/GameOverScreen';
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

    // Player rectangle
    const p = this.gameState.player;
    this.playerRect = this.add.rectangle(
      p.x, p.y, p.width, p.height,
      parseInt(p.color.slice(1), 16),
    );

    // HUD
    this.hud = createHUD(this);

    // Keyboard input
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (this.gameState.gameOver) {
        if (event.key === 'r' || event.key === 'R') {
          this.restartGame();
        }
        return;
      }
      if (event.key.length === 1 && /^[A-Za-z]$/.test(event.key)) {
        this.gameState.pendingKeys.push(event.key.toUpperCase());
      }
    });
  }

  update(_time: number, delta: number): void {
    if (this.gameState.gameOver) return;

    const gs = this.gameState;

    // Run systems in deterministic order
    spawnSystem(gs, delta);
    movementSystem(gs, delta);

    // Process all pending keys in a queue to handle multi-key frames
    while (gs.pendingKeys.length > 0) {
      gs.lastKeyPressed = gs.pendingKeys.shift()!;
      targetSystem(gs);
      combatSystem(gs, delta);
    }

    heatBarSystem(gs, delta);
    difficultySystem(gs, delta);
    scoreSystem(gs);
    collisionSystem(gs);

    // If game over just triggered, show overlay
    if (gs.gameOver) {
      this.gameOverScreen = showGameOver(this, gs.score);
      return;
    }

    // Handle projectile creation
    if (gs.justFired && gs.targetedEnemyId !== null) {
      this.spawnProjectile();
      gs.justFired = false;
    }

    // Update projectiles
    this.updateProjectiles(delta);

    // Sync rendering
    this.syncRendering();

    // Update HUD
    this.hud.update(gs);

    // Reset per-frame state
    gs.lastKeyPressed = null;
    gs.targetedEnemyId = null;
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

  private restartGame(): void {
    // Clean up game over overlay
    if (this.gameOverScreen) {
      this.gameOverScreen.destroy();
      this.gameOverScreen = null;
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
