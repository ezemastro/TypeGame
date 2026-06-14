import { describe, it, expect } from 'vitest';
import { heatBarSystem } from '../../src/systems/HeatBarSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { createEnemy } from '../../src/entities/Enemy';
import { GameConfig } from '../../src/config';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  return { ...base, ...overrides };
}

describe('HeatBarSystem', () => {
  it('should add 1 heat segment on a wrong key press (miss)', () => {
    // lastKeyPressed set but targetedEnemyId null = miss
    const state = makeState({
      lastKeyPressed: 'Z',
      targetedEnemyId: null,
      heatSegments: 0,
    });

    heatBarSystem(state, 0);

    expect(state.heatSegments).toBe(1);
  });

  it('should NOT add heat on a correct key press (hit)', () => {
    // lastKeyPressed set AND targetedEnemyId set = hit
    const state = makeState({
      lastKeyPressed: 'S',
      targetedEnemyId: 1,
      heatSegments: 2,
    });

    heatBarSystem(state, 0);

    expect(state.heatSegments).toBe(2); // unchanged
  });

  it('should trigger overheat when heat reaches maxSegments', () => {
    const state = makeState({
      lastKeyPressed: 'Z',
      targetedEnemyId: null,
      heatSegments: GameConfig.heatBar.maxSegments - 1, // 4
      overheated: false,
    });

    heatBarSystem(state, 0);

    expect(state.heatSegments).toBe(5);
    expect(state.overheated).toBe(true);
    expect(state.overheatTimer).toBe(GameConfig.heatBar.overheatDuration);
  });

  it('should reset cooldown timer when a key is pressed (miss or hit)', () => {
    // Miss case
    const missState = makeState({
      lastKeyPressed: 'Z',
      targetedEnemyId: null,
      cooldownTimer: 3000, // already accumulated
      heatSegments: 0,
    });

    heatBarSystem(missState, 0);
    expect(missState.cooldownTimer).toBe(0);

    // Hit case
    const hitState = makeState({
      lastKeyPressed: 'A',
      targetedEnemyId: 1,
      cooldownTimer: 3000,
      heatSegments: 0,
    });

    heatBarSystem(hitState, 0);
    expect(hitState.cooldownTimer).toBe(0);
  });

  it('should drain heat segments over time when idle (no key press)', () => {
    const state = makeState({
      lastKeyPressed: null,
      targetedEnemyId: null,
      heatSegments: 3,
      cooldownTimer: 0,
    });

    const cooldownPerSegment = GameConfig.heatBar.cooldownPerSegment;

    // After 1.5s (one segment drained)
    heatBarSystem(state, cooldownPerSegment);
    expect(state.heatSegments).toBe(2);
    // After another 1.5s (second segment drained)
    heatBarSystem(state, cooldownPerSegment);
    expect(state.heatSegments).toBe(1);
    // After another 1.5s (third segment drained)
    heatBarSystem(state, cooldownPerSegment);
    expect(state.heatSegments).toBe(0);
  });

  it('should not drain heat below zero when idle', () => {
    const state = makeState({
      lastKeyPressed: null,
      targetedEnemyId: null,
      heatSegments: 0,
      cooldownTimer: 0,
    });

    heatBarSystem(state, 10000);
    expect(state.heatSegments).toBe(0);
  });

  it('should decrement overheat timer', () => {
    const state = makeState({
      overheated: true,
      overheatTimer: 2000,
      heatSegments: 5,
    });

    heatBarSystem(state, 500);
    expect(state.overheatTimer).toBe(1500);
  });

  it('should exit overheat when timer expires and reset heat', () => {
    const state = makeState({
      overheated: true,
      overheatTimer: 200,
      heatSegments: 5,
    });

    heatBarSystem(state, 300);

    expect(state.overheated).toBe(false);
    expect(state.overheatTimer).toBe(0);
    expect(state.heatSegments).toBe(0);
  });

  it('should not add heat while overheated', () => {
    const state = makeState({
      lastKeyPressed: 'Z',
      targetedEnemyId: null,
      overheated: true,
      overheatTimer: 1000,
      heatSegments: 5,
    });

    heatBarSystem(state, 0);

    expect(state.heatSegments).toBe(5); // no change
  });

  it('should not drain heat while overheated', () => {
    const state = makeState({
      lastKeyPressed: null,
      targetedEnemyId: null,
      overheated: true,
      overheatTimer: 1000,
      heatSegments: 5,
      cooldownTimer: 0,
    });

    // Delta smaller than overheatTimer — overheat still active
    heatBarSystem(state, 500);
    expect(state.heatSegments).toBe(5);
    expect(state.overheated).toBe(true);
  });
});
