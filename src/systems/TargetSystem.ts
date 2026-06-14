import type { GameState } from '../entities/types';

export function targetSystem(state: GameState): GameState {
  if (!state.lastKeyPressed) {
    state.targetedEnemyId = null;
    return state;
  }

  const key = state.lastKeyPressed.toUpperCase();
  let bestId: number | null = null;
  let bestDistance = Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (enemy.word.charAt(0).toUpperCase() !== key) continue;

    const dx = enemy.x + enemy.width / 2 - state.player.x;
    const dy = enemy.y + enemy.height / 2 - state.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = enemy.id;
    }
  }

  state.targetedEnemyId = bestId;
  return state;
}
