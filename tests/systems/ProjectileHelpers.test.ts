import { describe, it, expect } from 'vitest';
import {
  findNearestEnemyToPosition,
  getRicochetBounces,
  getPiercingCount,
  calculatePierceDistance,
  findNearestEnemy,
} from '../../src/systems/ProjectileHelpers';
import type { EnemyState } from '../../src/entities/Enemy';

function enemy(id: number, overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id,
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    speed: 80,
    word: 'TEST',
    fullWord: 'TEST',
    color: '#ff4444',
    alive: true,
    pendingDestruction: false,
    ...overrides,
  };
}

// ── findNearestEnemyToPosition ──────────────────────────────────────

describe('findNearestEnemyToPosition', () => {
  it('should return the closest alive enemy within radius', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 500, y: 500 }),
      enemy(2, { x: 120, y: 100 }),
      enemy(3, { x: 200, y: 100 }),
    ];
    // Search at (100, 100); enemy 2 center is (150, 130) → ~54px; enemy 3 center is (230, 130) → ~133px
    const result = findNearestEnemyToPosition(enemies, 100, 100, 200);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('should return null when no enemies in radius', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 500, y: 500 }),
    ];
    const result = findNearestEnemyToPosition(enemies, 0, 0, 100);
    expect(result).toBeNull();
  });

  it('should ignore dead enemies', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 100, y: 100, alive: false }),
      enemy(2, { x: 120, y: 100 }),
    ];
    const result = findNearestEnemyToPosition(enemies, 100, 100, 200);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('should return null for empty enemy array', () => {
    const result = findNearestEnemyToPosition([], 100, 100, 200);
    expect(result).toBeNull();
  });
});

// ── getRicochetBounces ──────────────────────────────────────────────

describe('getRicochetBounces', () => {
  it('should return 0 when no RICOCHET is active', () => {
    expect(getRicochetBounces([])).toBe(0);
    expect(getRicochetBounces(['PIERCING_SHOT'])).toBe(0);
  });

  it('should return 1 for one RICOCHET pickup', () => {
    expect(getRicochetBounces(['RICOCHET'])).toBe(1);
  });

  it('should count multiple RICOCHET entries (stacking)', () => {
    expect(getRicochetBounces(['RICOCHET', 'RICOCHET', 'RICOCHET'])).toBe(3);
  });

  it('should count only RICOCHET among mixed powerups', () => {
    expect(getRicochetBounces(['PIERCING_SHOT', 'RICOCHET', 'RICOCHET', 'SLOW_AURA'])).toBe(2);
  });
});

// ── getPiercingCount ────────────────────────────────────────────────

describe('getPiercingCount', () => {
  it('should return 0 when no PIERCING_SHOT active', () => {
    expect(getPiercingCount([])).toBe(0);
  });

  it('should return count of PIERCING_SHOT entries', () => {
    expect(getPiercingCount(['PIERCING_SHOT', 'PIERCING_SHOT', 'RICOCHET'])).toBe(2);
  });
});

// ── calculatePierceDistance ─────────────────────────────────────────

describe('calculatePierceDistance', () => {
  it('should return base distance with 0 stacks', () => {
    expect(calculatePierceDistance(150, 0.5, 0)).toBe(150);
  });

  it('should increase by 50% per stack for 1 stack', () => {
    // 150 * (1 + 0.5 * 1) = 225
    expect(calculatePierceDistance(150, 0.5, 1)).toBe(225);
  });

  it('should increase additively for multiple stacks', () => {
    // 150 * (1 + 0.5 * 2) = 300
    expect(calculatePierceDistance(150, 0.5, 2)).toBe(300);
    // 150 * (1 + 0.5 * 3) = 375
    expect(calculatePierceDistance(150, 0.5, 3)).toBe(375);
  });

  it('should work with different base and multiplier', () => {
    // 100 * (1 + 0.75 * 2) = 250
    expect(calculatePierceDistance(100, 0.75, 2)).toBe(250);
  });
});

// ── findNearestEnemy (no radius, Set-based exclusion) ──────────────

describe('findNearestEnemy', () => {
  it('should return the closest alive enemy not in excludeIds', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 500, y: 500 }),  // far
      enemy(2, { x: 120, y: 100 }),  // near (~50px center distance)
      enemy(3, { x: 200, y: 100 }),  // mid (~100px center distance)
    ];
    const result = findNearestEnemy(enemies, 100, 100, new Set());
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('should skip a single enemy in excludeIds', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 120, y: 100 }),  // nearest
      enemy(2, { x: 200, y: 100 }),  // second nearest
    ];
    // Exclude enemy 1 → nearest should be enemy 2
    const result = findNearestEnemy(enemies, 100, 100, new Set([1]));
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('should exclude multiple enemies via the set', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 120, y: 100 }),  // nearest
      enemy(2, { x: 200, y: 100 }),  // second
      enemy(3, { x: 500, y: 100 }),  // third (far)
    ];
    const result = findNearestEnemy(enemies, 100, 100, new Set([1, 2]));
    expect(result).not.toBeNull();
    expect(result!.id).toBe(3);
  });

  it('should return null when all alive enemies are excluded', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 120, y: 100 }),
    ];
    const result = findNearestEnemy(enemies, 100, 100, new Set([1]));
    expect(result).toBeNull();
  });

  it('should return null for empty enemy array', () => {
    const result = findNearestEnemy([], 100, 100, new Set());
    expect(result).toBeNull();
  });

  it('should return null for empty enemy array with exclusions', () => {
    const result = findNearestEnemy([], 100, 100, new Set([1, 2, 3]));
    expect(result).toBeNull();
  });

  it('should ignore dead enemies even if not in excludeIds', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 120, y: 100, alive: false }),  // dead, not excluded
      enemy(2, { x: 200, y: 100 }),                  // alive
    ];
    const result = findNearestEnemy(enemies, 100, 100, new Set());
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('should handle empty excludeIds set (same as no exclusion)', () => {
    const enemies: EnemyState[] = [
      enemy(1, { x: 120, y: 100 }),
      enemy(2, { x: 500, y: 500 }),
    ];
    const result = findNearestEnemy(enemies, 100, 100, new Set());
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
  });
});
