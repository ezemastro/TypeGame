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

  it('should be frozen (readonly) at runtime', () => {
    expect(Object.isFrozen(GameConfig)).toBe(true);
  });
});
