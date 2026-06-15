import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config';

describe('GameConfig', () => {
  it('should have all expected top-level configuration categories', () => {
    const expectedKeys = [
      'canvas',
      'player',
      'enemies',
      'words',
      'wordDisplay',
      'shooting',
      'heatBar',
      'world',
      'difficulty',
      'scoring',
      'powerUps',
    ];

    for (const key of expectedKeys) {
      expect(GameConfig).toHaveProperty(key);
    }
  });

  it('should have valid canvas dimensions', () => {
    expect(GameConfig.canvas.width).toBeGreaterThan(0);
    expect(GameConfig.canvas.height).toBeGreaterThan(0);
    expect(typeof GameConfig.canvas.backgroundColor).toBe('string');
  });

  it('should have valid player configuration', () => {
    expect(GameConfig.player.speed).toBeGreaterThan(0);
    expect(GameConfig.player.x).toBeGreaterThan(0);
    expect(GameConfig.player.y).toBeGreaterThan(0);
  });

  it('should have valid enemy configuration', () => {
    expect(GameConfig.enemies.baseSpeed).toBeGreaterThan(0);
    expect(GameConfig.enemies.maxOnScreen).toBeGreaterThan(0);
    expect(GameConfig.enemies.spawnInterval).toBeGreaterThan(0);
  });

  it('should have valid word pools', () => {
    expect(GameConfig.words.easy.length).toBeGreaterThan(0);
    expect(GameConfig.words.medium.length).toBeGreaterThan(0);
    expect(GameConfig.words.hard.length).toBeGreaterThan(0);
  });

  it('should have valid difficulty scaling configuration', () => {
    expect(GameConfig.difficulty.wordComplexityRamp.length).toBeGreaterThan(0);
  });

  it('should have valid scoring configuration', () => {
    expect(GameConfig.scoring.pointsPerLetter).toBeGreaterThan(0);
    expect(GameConfig.scoring.xpScaleFactor).toBeGreaterThan(1);
  });

  it('should have explosiveImpact config with pushRadius and pushStrength', () => {
    expect(GameConfig.powerUps.explosiveImpact).toBeDefined();
    expect(GameConfig.powerUps.explosiveImpact.pushRadius).toBeGreaterThan(0);
    expect(GameConfig.powerUps.explosiveImpact.pushStrength).toBeGreaterThan(0);
  });

  it('should have quickCooling config with cooldownMultiplier', () => {
    expect(GameConfig.powerUps.quickCooling).toBeDefined();
    expect(GameConfig.powerUps.quickCooling.cooldownMultiplier).toBeGreaterThan(1);
  });

  it('should have sharpSight config with scoreMultiplier', () => {
    expect(GameConfig.powerUps.sharpSight).toBeDefined();
    expect(GameConfig.powerUps.sharpSight.scoreMultiplier).toBeGreaterThan(1);
  });

  it('should have slowingAura config with radius, speedMultiplier, color, alpha', () => {
    expect(GameConfig.powerUps.slowingAura).toBeDefined();
    expect(GameConfig.powerUps.slowingAura.radius).toBe(150);
    expect(GameConfig.powerUps.slowingAura.speedMultiplier).toBe(0.5);
    expect(GameConfig.powerUps.slowingAura.color).toBe('#4488ff');
    expect(GameConfig.powerUps.slowingAura.alpha).toBe(0.15);
  });

  it('should have piercingShot config with enabled flag', () => {
    expect(GameConfig.powerUps.piercingShot).toBeDefined();
    expect(GameConfig.powerUps.piercingShot.enabled).toBe(true);
  });

  it('should have dualShot config with maxTargets', () => {
    expect(GameConfig.powerUps.dualShot).toBeDefined();
    expect(GameConfig.powerUps.dualShot.maxTargets).toBe(2);
  });

  it('should include all 6 power-up IDs in options array', () => {
    expect(GameConfig.powerUps.options).toContain('SLOW_AURA');
    expect(GameConfig.powerUps.options).toContain('PIERCING_SHOT');
    expect(GameConfig.powerUps.options).toContain('DUAL_SHOT');
    expect(GameConfig.powerUps.options).toHaveLength(6);
  });

  it('should be frozen (readonly) at runtime', () => {
    expect(Object.isFrozen(GameConfig)).toBe(true);
  });
});
