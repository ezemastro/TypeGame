import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function combatSystem(state: GameState, delta: number): GameState {
  // Decrement cooldown timer
  if (state.shootCooldown > 0) {
    state.shootCooldown = Math.max(0, state.shootCooldown - delta);
  }

  if (state.gameOver || state.overheated) return state;
  if (state.targetedEnemyId === null) return state;
  if (state.shootCooldown > 0) return state;

  // Find the targeted enemy
  const enemy = state.enemies.find(
    (e) => e.id === state.targetedEnemyId && e.alive,
  );

  if (!enemy) return state;

  // Strip first letter and award points
  enemy.word = enemy.word.slice(1);
  const pointsPerLetter = state.activePowerUps.includes('SHARP_SIGHT')
    ? Math.floor(GameConfig.scoring.pointsPerLetter * GameConfig.powerUps.sharpSight.scoreMultiplier)
    : GameConfig.scoring.pointsPerLetter;
  state.score += pointsPerLetter;

  // Set cooldown and firing flag
  state.shootCooldown = GameConfig.shooting.cooldown;
  state.justFired = true;

  // Check if word fully destroyed
  if (enemy.word.length === 0) {
    enemy.pendingDestruction = true;

    // Explosive Impact: push nearby enemies away
    if (state.activePowerUps.includes('EXPLOSIVE_IMPACT')) {
      const cfg = GameConfig.powerUps.explosiveImpact;
      for (const other of state.enemies) {
        if (other.id === enemy.id || !other.alive) continue;
        const dx = other.x - enemy.x;
        const dy = other.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cfg.pushRadius && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          other.x += nx * cfg.pushStrength;
          other.y += ny * cfg.pushStrength;
        }
      }
    }
  }

  return state;
}
