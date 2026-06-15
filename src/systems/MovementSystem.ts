import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function movementSystem(state: GameState, delta: number): GameState {
  if (state.gameOver) return state;

  const deltaSeconds = delta / 1000;
  const playerCenterX = state.player.x + state.player.width / 2;
  const playerCenterY = state.player.y + state.player.height / 2;
  const slowingAuraActive = state.activePowerUps.includes('SLOW_AURA');
  const auraRadius = GameConfig.powerUps.slowingAura.radius;
  const auraSpeedMultiplier = GameConfig.powerUps.slowingAura.speedMultiplier;

  for (const enemy of state.enemies) {
    if (enemy.alive) {
      const enemyCenterX = enemy.x + enemy.width / 2;
      const enemyCenterY = enemy.y + enemy.height / 2;
      const dx = playerCenterX - enemyCenterX;
      const dy = playerCenterY - enemyCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        let speedMultiplier = 1;
        if (slowingAuraActive && dist < auraRadius) {
          speedMultiplier = auraSpeedMultiplier;
        }
        enemy.x += (dx / dist) * enemy.speed * deltaSeconds * speedMultiplier;
        enemy.y += (dy / dist) * enemy.speed * deltaSeconds * speedMultiplier;
      }
    }
  }

  return state;
}
