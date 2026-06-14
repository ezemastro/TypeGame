import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function heatBarSystem(state: GameState, delta: number): GameState {
  // Handle overheat state
  if (state.overheated) {
    state.overheatTimer = Math.max(0, state.overheatTimer - delta);

    if (state.overheatTimer <= 0) {
      state.overheated = false;
      state.heatSegments = 0;
      state.overheatTimer = 0;
    }
    return state;
  }

  const keyWasPressed = state.lastKeyPressed !== null;
  const wasMiss = keyWasPressed && state.targetedEnemyId === null;
  const wasHit = keyWasPressed && state.targetedEnemyId !== null;

  if (wasMiss) {
    // Wrong key: add heat, reset cooldown
    state.heatSegments += 1;
    state.cooldownTimer = 0;

    // Check for overheat
    if (state.heatSegments >= GameConfig.heatBar.maxSegments) {
      state.heatSegments = GameConfig.heatBar.maxSegments;
      state.overheated = true;
      state.overheatTimer = GameConfig.heatBar.overheatDuration;
    }
  } else if (wasHit) {
    // Correct key: reset cooldown timer, no heat added
    state.cooldownTimer = 0;
  } else {
    // Idle (no key press): accumulate cooldown, drain heat
    state.cooldownTimer += delta;

    while (
      state.cooldownTimer >= GameConfig.heatBar.cooldownPerSegment &&
      state.heatSegments > 0
    ) {
      state.cooldownTimer -= GameConfig.heatBar.cooldownPerSegment;
      state.heatSegments -= 1;
    }
  }

  return state;
}
