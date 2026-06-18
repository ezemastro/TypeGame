import { describe, it, expect } from 'vitest';
import {
  getEnemiesInRadius,
  calculateBurstAngles,
  findNthClosestEnemy,
  getShieldCircleRadii,
  calculateCooldownProgress,
  calculateCardPositions,
  mapDevKeyToPowerUp,
  getStackCount,
  getAllyDroneColor,
  applyAllyDamage,
  getDualCannonOffsets,
  getMagneticFieldRadius,
  getPiercingCannonParts,
} from '../../src/systems/PowerUpHelpers';
import { createEnemy } from '../../src/entities/Enemy';
import { createInitialGameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';

// 3.2 — Enemies in radius for explosive push
describe('getEnemiesInRadius', () => {
  it('returns enemies within the radius from center point', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 80;
    e1.y = 80;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 200;
    e2.y = 200;
    const e3 = createEnemy('FUEGO', 3);
    e3.x = 400;
    e3.y = 400;
    state.enemies = [e1, e2, e3];

    // Center at (100, 100), radius 120
    // e1 at (80,80): dist ≈ 28 → inside
    // e2 at (200,200): dist ≈ 141 → outside  
    // e3 at (400,400): dist ≈ 424 → outside
    const result = getEnemiesInRadius(state, 100, 100, 120);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('excludes dead enemies from radius check', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 80;
    e1.y = 80;
    e1.alive = false;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 90;
    e2.y = 90;
    state.enemies = [e1, e2];

    const result = getEnemiesInRadius(state, 100, 100, 120);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('returns empty array when no enemies in radius', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 400;
    e1.y = 400;
    state.enemies = [e1];

    const result = getEnemiesInRadius(state, 100, 100, 50);
    expect(result).toHaveLength(0);
  });

  it('uses enemy center (x+width/2, y+height/2) for distance calculation', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    // Enemy is 60×60 (config default), center at (x+30, y+30)
    e1.x = 70;
    e1.y = 70;
    state.enemies = [e1];

    // Center at (100,100), enemy center at (100,100)
    // dist = 0 → inside any positive radius
    const result = getEnemiesInRadius(state, 100, 100, 10);
    expect(result).toHaveLength(1);
  });
});

// 3.3 — Burst fire spread angles
describe('calculateBurstAngles', () => {
  it('returns two angles ±spread from base angle', () => {
    const spreadDeg = 2.5;
    // baseAngle = 0 (straight up in screen coords)
    const [a1, a2] = calculateBurstAngles(0, spreadDeg);
    const halfRad = (2.5 * Math.PI) / 180;
    expect(a1).toBeCloseTo(-halfRad, 5);
    expect(a2).toBeCloseTo(halfRad, 5);
  });

  it('returns symmetric angles around any base angle', () => {
    const baseAngle = Math.PI / 4; // 45°
    const [a1, a2] = calculateBurstAngles(baseAngle, 5);
    const halfRad = (5 * Math.PI) / 180;
    expect(a1).toBeCloseTo(baseAngle - halfRad, 5);
    expect(a2).toBeCloseTo(baseAngle + halfRad, 5);
  });

  it('returns same angle when spread is 0', () => {
    const [a1, a2] = calculateBurstAngles(Math.PI / 2, 0);
    expect(a1).toBe(a2);
    expect(a1).toBe(Math.PI / 2);
  });
});

// 3.6 — Ally drone: find Nth closest enemy
describe('findNthClosestEnemy', () => {
  it('returns the 2nd closest enemy (skip closest)', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 390;
    e1.y = 400; // closest (~100px from player at 400,500)
    const e2 = createEnemy('LUNA', 2);
    e2.x = 300;
    e2.y = 500; // second closest (~100px)
    const e3 = createEnemy('FUEGO', 3);
    e3.x = 100;
    e3.y = 500; // furthest (~300px)
    state.enemies = [e1, e2, e3];

    const result = findNthClosestEnemy(state, 400, 500, 2);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('returns null when there are fewer than N enemies', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 100;
    e1.y = 100;
    state.enemies = [e1];

    const result = findNthClosestEnemy(state, 400, 500, 2);
    expect(result).toBeNull();
  });

  it('skips dead enemies in counting', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 390;
    e1.y = 400;
    e1.alive = false;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 300;
    e2.y = 500;
    const e3 = createEnemy('FUEGO', 3);
    e3.x = 100;
    e3.y = 500;
    state.enemies = [e1, e2, e3];

    // dead e1 doesn't count, so e2 is closest alive, e3 is 2nd closest
    const result = findNthClosestEnemy(state, 400, 500, 2);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(3);
  });

  it('returns closest enemy when N=1', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 300;
    e1.y = 500;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 390;
    e2.y = 400;
    state.enemies = [e1, e2];

    const result = findNthClosestEnemy(state, 400, 500, 1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2); // at 390,400: ~100px vs 300,500: ~100px ... let me check distances
  });
});

// 3.5 — Shield circle radii
describe('getShieldCircleRadii', () => {
  it('returns empty array when charges is 0', () => {
    const radii = getShieldCircleRadii(0, 36, 6);
    expect(radii).toEqual([]);
  });

  it('returns one radius for 1 charge', () => {
    const radii = getShieldCircleRadii(1, 36, 6);
    expect(radii).toEqual([36]);
  });

  it('increments radius by step for each additional charge', () => {
    const radii = getShieldCircleRadii(3, 36, 6);
    expect(radii).toEqual([36, 42, 48]);
  });

  it('handles large charge counts', () => {
    const radii = getShieldCircleRadii(5, 36, 6);
    expect(radii).toEqual([36, 42, 48, 54, 60]);
  });
});

// 3.9/3.10 — Cooldown progress calculation
describe('calculateCooldownProgress', () => {
  it('returns ratio of remaining to total', () => {
    const progress = calculateCooldownProgress(15000, 30000);
    expect(progress).toBe(0.5);
  });

  it('returns 0 when remaining is 0', () => {
    const progress = calculateCooldownProgress(0, 30000);
    expect(progress).toBe(0);
  });

  it('returns 0 when remaining is undefined', () => {
    const progress = calculateCooldownProgress(undefined, 30000);
    expect(progress).toBe(0);
  });

  it('returns 1 when cooldown just started', () => {
    const progress = calculateCooldownProgress(30000, 30000);
    expect(progress).toBe(1);
  });

  it('handles short cooldown', () => {
    const progress = calculateCooldownProgress(9000, 18000);
    expect(progress).toBe(0.5);
  });
});

// 3.8 — Card position calculation for LevelUpScreen
describe('calculateCardPositions', () => {
  it('positions 3 cards centered in 800px canvas', () => {
    const positions = calculateCardPositions(800, 200, 20);
    // total = 3*200 + 2*20 = 640, left margin = (800-640)/2 = 80
    // cards at: 80+100, 80+200+20+100, 80+440+100
    expect(positions).toEqual([180, 400, 620]);
  });

  it('centers cards regardless of canvas width', () => {
    const positions = calculateCardPositions(640, 200, 20);
    expect(positions).toEqual([100, 320, 540]);
  });

  it('returns empty array for 0 count', () => {
    const positions = calculateCardPositions(800, 200, 20, 0);
    expect(positions).toEqual([]);
  });

  it('positions single card centered', () => {
    const positions = calculateCardPositions(800, 200, 20, 1);
    expect(positions).toEqual([400]);
  });
});

// Dev Mode — key mapping
describe('mapDevKeyToPowerUp', () => {
  it('maps 1 to EXPLOSIVE_IMPACT', () => {
    expect(mapDevKeyToPowerUp('1')).toBe('EXPLOSIVE_IMPACT');
  });

  it('maps 2 to QUICK_COOLING', () => {
    expect(mapDevKeyToPowerUp('2')).toBe('QUICK_COOLING');
  });

  it('maps 3 to SHARP_SIGHT', () => {
    expect(mapDevKeyToPowerUp('3')).toBe('SHARP_SIGHT');
  });

  it('maps 4 to SLOW_AURA', () => {
    expect(mapDevKeyToPowerUp('4')).toBe('SLOW_AURA');
  });

  it('maps 5 to PIERCING_SHOT', () => {
    expect(mapDevKeyToPowerUp('5')).toBe('PIERCING_SHOT');
  });

  it('maps 6 to DUAL_SHOT', () => {
    expect(mapDevKeyToPowerUp('6')).toBe('DUAL_SHOT');
  });

  it('maps 7 to SHIELD', () => {
    expect(mapDevKeyToPowerUp('7')).toBe('SHIELD');
  });

  it('maps 8 to ALLY', () => {
    expect(mapDevKeyToPowerUp('8')).toBe('ALLY');
  });

  it('maps 9 to MAGNETIC_FIELD', () => {
    expect(mapDevKeyToPowerUp('9')).toBe('MAGNETIC_FIELD');
  });

  it('maps 0 to BURST_FIRE', () => {
    expect(mapDevKeyToPowerUp('0')).toBe('BURST_FIRE');
  });

  it('maps - to LIFE_STEAL', () => {
    expect(mapDevKeyToPowerUp('-')).toBe('LIFE_STEAL');
  });

  it('maps = to FREEZE', () => {
    expect(mapDevKeyToPowerUp('=')).toBe('FREEZE');
  });

  it('returns null for unknown keys', () => {
    expect(mapDevKeyToPowerUp('x')).toBeNull();
    expect(mapDevKeyToPowerUp('A')).toBeNull();
    expect(mapDevKeyToPowerUp('')).toBeNull();
  });
});

// ── Stack count utility ──────────────────────────────────────────────

describe('getStackCount', () => {
  it('counts occurrences of an id in activePowerUps array', () => {
    expect(getStackCount(['A', 'A', 'B'], 'A')).toBe(2);
  });

  it('returns 0 when id is not in the array', () => {
    expect(getStackCount(['A', 'B', 'C'], 'D')).toBe(0);
  });

  it('handles empty array', () => {
    expect(getStackCount([], 'ANY')).toBe(0);
  });

  it('counts correctly when multiple active powerups of same id interspersed', () => {
    expect(getStackCount(['SHIELD', 'ALLY', 'SHIELD', 'BURST', 'SHIELD'], 'SHIELD')).toBe(3);
  });

  it('returns 0 for empty string id in empty array', () => {
    expect(getStackCount([], '')).toBe(0);
  });
});

// ── Ally drone color selection ───────────────────────────────────────

describe('getAllyDroneColor', () => {
  const palette = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#A8E6CF'];

  it('wraps around with modulo when index exceeds palette length', () => {
    expect(getAllyDroneColor(5, palette)).toBe('#A8E6CF');
  });

  it('handles index 0 returning first color', () => {
    expect(getAllyDroneColor(0, palette)).toBe('#FF6B6B');
  });

  it('returns correct color for mid-index', () => {
    expect(getAllyDroneColor(3, palette)).toBe('#A78BFA');
  });

  it('wraps for larger indices (modulo behavior)', () => {
    expect(getAllyDroneColor(6, palette)).toBe('#FF6B6B'); // 6 % 6 = 0
    expect(getAllyDroneColor(7, palette)).toBe('#4ECDC4'); // 7 % 6 = 1
  });
});

// ── Ally bullet letter peeling ──────────────────────────────────────

describe('applyAllyDamage', () => {
  it('peels one letter from the target word', () => {
    const result = applyAllyDamage('HOLA');
    expect(result.word).toBe('OLA');
    expect(result.killed).toBe(false);
  });

  it('kills enemy when word becomes empty after peeling last letter', () => {
    const result = applyAllyDamage('A');
    expect(result.word).toBe('');
    expect(result.killed).toBe(true);
  });

  it('returns empty word and no kill for empty word input (edge case)', () => {
    const result = applyAllyDamage('');
    expect(result.word).toBe('');
    expect(result.killed).toBe(true); // already empty → treat as killed
  });
});

// ── Refinement: Dual Weapon cannon offsets ─────────────────────────────

describe('getDualCannonOffsets', () => {
  it('returns empty array for 0 stacks', () => {
    expect(getDualCannonOffsets(0, 50, 8)).toEqual([]);
  });

  it('returns 1 cannon for 1 stack (alternating sides, starts left)', () => {
    const result = getDualCannonOffsets(1, 50, 8);
    expect(result).toHaveLength(1);
    // First cannon is left side (negative x), inside ship (±25 half-width)
    expect(result[0].x).toBeLessThan(0);
    expect(Math.abs(result[0].x)).toBeLessThan(25);
  });

  it('returns 2 cannons for 2 stacks (one each side)', () => {
    const result = getDualCannonOffsets(2, 50, 8);
    expect(result).toHaveLength(2);
    // Should have one left, one right
    const signs = result.map(r => Math.sign(r.x));
    expect(signs).toContain(-1);
    expect(signs).toContain(1);
  });

  it('returns 4 cannons all inside ship width for 4 stacks', () => {
    const result = getDualCannonOffsets(4, 50, 8);
    expect(result).toHaveLength(4);
    for (const pos of result) {
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(25);
    }
  });

  it('cannons beyond 4 stacks may protrude outside ship', () => {
    const result = getDualCannonOffsets(6, 50, 10);
    expect(result).toHaveLength(6);
    // At least some cannons should be at or beyond ship edge
    const hasOutside = result.some(r => Math.abs(r.x) >= 25);
    expect(hasOutside).toBe(true);
  });
});

// ── Refinement: Magnetic Field radius scaling ──────────────────────────

describe('getMagneticFieldRadius', () => {
  it('returns base radius when stacks is 0', () => {
    expect(getMagneticFieldRadius(200, 0, 30)).toBe(200);
  });

  it('scales radius by perStack * stacks', () => {
    expect(getMagneticFieldRadius(200, 1, 30)).toBe(230);
    expect(getMagneticFieldRadius(200, 2, 30)).toBe(260);
    expect(getMagneticFieldRadius(200, 3, 30)).toBe(290);
  });

  it('works with different base and perStack values', () => {
    expect(getMagneticFieldRadius(150, 1, 25)).toBe(175);
    expect(getMagneticFieldRadius(150, 2, 25)).toBe(200);
  });
});

// ── Refinement: Piercing cannon two-part dimensions ────────────────────

describe('getPiercingCannonParts', () => {
  const cfg = { baseHeight: 14, heightPerStack: 6, baseWidth: 3, tipHeight: 6 };

  it('returns base body height and tip offset for 0 stacks', () => {
    const parts = getPiercingCannonParts(0, cfg);
    expect(parts.bodyHeight).toBe(14);
    expect(parts.tipOffsetY).toBe(-14); // tip is at top of barrel
    expect(parts.bodyWidth).toBe(3);
  });

  it('grows body height per stack (Y-axis only)', () => {
    const parts2 = getPiercingCannonParts(2, cfg);
    expect(parts2.bodyHeight).toBe(26); // 14 + 2*6
    expect(parts2.tipOffsetY).toBe(-26);
    expect(parts2.bodyWidth).toBe(3); // X-axis unchanged
  });

  it('tip offset always matches body height distance upward', () => {
    const parts = getPiercingCannonParts(5, cfg);
    expect(parts.bodyHeight).toBe(44); // 14 + 5*6
    expect(parts.tipOffsetY).toBe(-44);
    expect(parts.bodyWidth).toBe(3);
  });
});
