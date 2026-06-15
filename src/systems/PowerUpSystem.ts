import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function powerUpSystem(state: GameState, delta: number): GameState {
  if (state.gameOver) return state;

  const freezeConfig = GameConfig.powerUps.freeze;

  // Decrement all active cooldowns
  const newCooldowns: Record<string, number> = {};
  let shieldExpired = false;

  for (const [id, remaining] of Object.entries(state.powerUpState.cooldowns)) {
    const newRemaining = remaining - delta;
    if (newRemaining > 0) {
      newCooldowns[id] = newRemaining;
    } else if (id === 'SHIELD') {
      shieldExpired = true;
    }
  }
  state.powerUpState.cooldowns = newCooldowns;

  // Shield charge regen when SHIELD cooldown expires
  if (shieldExpired) {
    state.powerUpState.shieldCharges += 1;
  }

  // Freeze proximity check
  if (
    state.activePowerUps.includes('FREEZE') &&
    !state.powerUpState.cooldowns.FREEZE
  ) {
    const playerCenterX = state.player.x + state.player.width / 2;
    const playerCenterY = state.player.y + state.player.height / 2;

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;

      const enemyCenterX = enemy.x + enemy.width / 2;
      const enemyCenterY = enemy.y + enemy.height / 2;
      const dx = enemyCenterX - playerCenterX;
      const dy = enemyCenterY - playerCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < freezeConfig.triggerRadius) {
        state.powerUpState.freezeActiveUntil =
          state.elapsedTime + freezeConfig.durationMs;
        state.powerUpState.cooldowns.FREEZE = freezeConfig.cooldownMs;
        break; // only trigger once per frame
      }
    }
  }

  return state;
}
