import { describe, it, expect } from 'vitest';
import { powerUpSystem } from '../../src/systems/PowerUpSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { createEnemy, type EnemyState } from '../../src/entities/Enemy';
import { GameConfig } from '../../src/config';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  return { ...base, ...overrides };
}

describe('PowerUpSystem', () => {
  describe('cooldown decrement', () => {
    it('should decrement all active cooldowns by delta', () => {
      const state = makeState({
        powerUpState: {
          cooldowns: { SHIELD: 20000, FREEZE: 10000 },
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      powerUpSystem(state, 500); // 500ms delta

      expect(state.powerUpState.cooldowns.SHIELD).toBe(19500);
      expect(state.powerUpState.cooldowns.FREEZE).toBe(9500);
    });

    it('should remove cooldown entries that reach zero or below', () => {
      const state = makeState({
        powerUpState: {
          cooldowns: { SHIELD: 200, FREEZE: 5000 },
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      powerUpSystem(state, 500);

      // SHIELD was 200ms, decremented by 500 → 0 or below → removed
      expect(state.powerUpState.cooldowns.SHIELD).toBeUndefined();
      // FREEZE was 5000ms, decremented by 500 → 4500 → still present
      expect(state.powerUpState.cooldowns.FREEZE).toBe(4500);
    });

    it('should handle empty cooldowns without error', () => {
      const state = makeState();

      expect(() => powerUpSystem(state, 1000)).not.toThrow();
      expect(state.powerUpState.cooldowns).toEqual({});
    });
  });

  describe('freeze proximity trigger', () => {
    function makeEnemyAtDist(distX: number): EnemyState {
      const enemy = createEnemy('TEST', 1);
      // Player center is at (425, 525).
      // Place enemy center at (425 + distX, 525).
      // Enemy top-left: subtract half size (30,30)
      enemy.x = 425 - 30 + distX;
      enemy.y = 525 - 30;
      return enemy;
    }

    it('should trigger freeze when enemy enters 100px radius and cooldown is zero', () => {
      const enemy = makeEnemyAtDist(90); // 90px from player center (within 100px)
      const state = makeState({
        enemies: [enemy],
        elapsedTime: 5000,
        powerUpState: {
          cooldowns: {}, // no freeze cooldown
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
        activePowerUps: ['FREEZE'],
      });

      powerUpSystem(state, 16);

      expect(state.powerUpState.freezeActiveUntil).toBeGreaterThan(0);
      expect(state.powerUpState.cooldowns.FREEZE).toBe(GameConfig.powerUps.freeze.cooldownMs);
    });

    it('should NOT trigger freeze when cooldown is active', () => {
      const enemy = makeEnemyAtDist(90);
      const state = makeState({
        enemies: [enemy],
        elapsedTime: 5000,
        powerUpState: {
          cooldowns: { FREEZE: 10000 }, // cooldown active
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
        activePowerUps: ['FREEZE'],
      });

      powerUpSystem(state, 16);

      expect(state.powerUpState.freezeActiveUntil).toBe(0); // NOT triggered
      expect(state.powerUpState.cooldowns.FREEZE).toBe(9984); // decremented by delta
    });

    it('should NOT trigger freeze when no enemy is within radius', () => {
      const enemy = makeEnemyAtDist(150); // 150px from player (outside 100px radius)
      const state = makeState({
        enemies: [enemy],
        elapsedTime: 5000,
        powerUpState: {
          cooldowns: {},
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
        activePowerUps: ['FREEZE'],
      });

      powerUpSystem(state, 16);

      expect(state.powerUpState.freezeActiveUntil).toBe(0);
    });

    it('should NOT trigger freeze without FREEZE in activePowerUps', () => {
      const enemy = makeEnemyAtDist(90);
      const state = makeState({
        enemies: [enemy],
        elapsedTime: 5000,
        powerUpState: {
          cooldowns: {},
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
        activePowerUps: [], // no FREEZE
      });

      powerUpSystem(state, 16);

      expect(state.powerUpState.freezeActiveUntil).toBe(0);
    });
  });

  describe('shield charge regen', () => {
    it('should regen a shield charge when SHIELD cooldown expires', () => {
      const state = makeState({
        powerUpState: {
          cooldowns: { SHIELD: 200 }, // almost expired
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      // Decrement by 300ms — SHIELD cooldown hits 0 and is removed
      powerUpSystem(state, 300);

      // Cooldown expired → charge should regen
      expect(state.powerUpState.shieldCharges).toBe(1);
      expect(state.powerUpState.cooldowns.SHIELD).toBeUndefined();
    });

    it('should NOT regen shield while cooldown is still active', () => {
      const state = makeState({
        powerUpState: {
          cooldowns: { SHIELD: 10000 },
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      powerUpSystem(state, 2000);

      expect(state.powerUpState.shieldCharges).toBe(0); // not regened yet
      expect(state.powerUpState.cooldowns.SHIELD).toBe(8000);
    });

    it('should NOT regen shield if cooldown key does not exist', () => {
      const state = makeState({
        powerUpState: {
          cooldowns: {},
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      powerUpSystem(state, 1000);

      expect(state.powerUpState.shieldCharges).toBe(0); // nothing to regen from
    });

    it('should only regen one charge per expired cooldown (one tick)', () => {
      const state = makeState({
        powerUpState: {
          cooldowns: { SHIELD: 500 },
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      powerUpSystem(state, 1000); // more than enough time

      expect(state.powerUpState.shieldCharges).toBe(1); // only one charge regen
      expect(state.powerUpState.cooldowns.SHIELD).toBeUndefined();
    });
  });
});
