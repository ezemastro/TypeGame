import { describe, it, expect } from 'vitest';
import { createInitialGameState, type GameState } from '../../src/entities/types';

describe('GameState', () => {
  it('should have secondaryTargetId defaulting to null', () => {
    const state = createInitialGameState();
    expect(state.secondaryTargetId).toBeNull();
  });

  it('should have secondaryTargetId in the GameState type', () => {
    const state = createInitialGameState();
    // secondaryTargetId should exist and be settable
    state.secondaryTargetId = 5;
    expect(state.secondaryTargetId).toBe(5);
    state.secondaryTargetId = null;
    expect(state.secondaryTargetId).toBeNull();
  });
});
