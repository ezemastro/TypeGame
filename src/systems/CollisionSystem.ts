import type { GameState } from '../entities/types';

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
      state.gameOver = true;
      return state;
    }
  }

  return state;
}
