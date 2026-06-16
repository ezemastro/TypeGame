import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function collisionSystem(state: GameState): GameState {
  if (state.gameOver) return state;

  const p = state.player;
  const playerLeft = p.x;
  const playerRight = p.x + p.width;
  const playerTop = p.y;
  const playerBottom = p.y + p.height;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    const enemyLeft = enemy.x;
    const enemyRight = enemy.x + enemy.width;
    const enemyTop = enemy.y;
    const enemyBottom = enemy.y + enemy.height;

    if (
      enemyLeft < playerRight &&
      enemyRight > playerLeft &&
      enemyTop < playerBottom &&
      enemyBottom > playerTop
    ) {
      // Shield intercept: absorb collision if charges available
      if (state.powerUpState.shieldCharges > 0) {
        state.powerUpState.shieldCharges -= 1;
        state.powerUpState.cooldowns.SHIELD = GameConfig.powerUps.shield.cooldownMs;
        enemy.alive = false;
        continue;
      }

      state.gameOver = true;
      return state;
    }
  }

  return state;
}
