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

  // If a shot was fired this frame, it was definitely a hit — prevents
  // multi-key frames where the last key was a miss from adding unfair heat.
  if (state.justFired) {
    // Hit: reset cooldown timer, no heat added
    state.cooldownTimer = 0;
  } else if (wasMiss) {
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
    const cooldownMultiplier = state.activePowerUps.includes('QUICK_COOLING')
      ? GameConfig.powerUps.quickCooling.cooldownMultiplier
      : 1;
    state.cooldownTimer += delta * cooldownMultiplier;

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
