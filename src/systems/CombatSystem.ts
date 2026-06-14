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
  state.score += GameConfig.scoring.pointsPerLetter;

  // Set cooldown and firing flag
  state.shootCooldown = GameConfig.shooting.cooldown;
  state.justFired = true;

  // Check if word fully destroyed
  if (enemy.word.length === 0) {
    enemy.pendingDestruction = true;
  }

  return state;
}
