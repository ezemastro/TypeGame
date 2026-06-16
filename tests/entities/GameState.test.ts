import { describe, it, expect } from 'vitest';
import { createInitialGameState, type PowerUpState } from '../../src/entities/types';

describe('GameState initialization', () => {
  it('should include powerUpState initialized with empty cooldowns and zero counts', () => {
    const state = createInitialGameState();

    expect(state.powerUpState).toBeDefined();
    expect(state.powerUpState.cooldowns).toEqual({});
    expect(state.powerUpState.shieldCharges).toBe(0);
    expect(state.powerUpState.allyCount).toBe(0);
    expect(state.powerUpState.freezeActiveUntil).toBe(0);
  });

  it('should export PowerUpState type with correct shape', () => {
    // Type-level test: verify PowerUpState is exported and assignable
    const ps: PowerUpState = {
      cooldowns: { SHIELD: 15000 },
      shieldCharges: 2,
      allyCount: 1,
      freezeActiveUntil: 0,
    };
    expect(ps.cooldowns.SHIELD).toBe(15000);
    expect(ps.shieldCharges).toBe(2);
    expect(ps.allyCount).toBe(1);
    expect(ps.freezeActiveUntil).toBe(0);
  });
});
