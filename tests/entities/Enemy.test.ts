import { describe, it, expect } from 'vitest';
import { createEnemy, type EnemyState } from '../../src/entities/Enemy';
import { GameConfig } from '../../src/config';

describe('EnemyState', () => {
  const word = 'SOL';
  const id = 1;

  it('should create an enemy with the given id', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.id).toBe(id);
  });

  it('should spawn at y=0 (top of screen)', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.y).toBe(0);
  });

  it('should spawn at a random X within canvas bounds', () => {
    // Run multiple times to verify bounded range
    for (let i = 0; i < 100; i++) {
      const enemy = createEnemy(word, i);
      expect(enemy.x).toBeGreaterThanOrEqual(0);
      expect(enemy.x).toBeLessThanOrEqual(
        GameConfig.canvas.width - GameConfig.enemies.width,
      );
    }
  });

  it('should assign the word and preserve fullWord', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.word).toBe('SOL');
    expect(enemy.fullWord).toBe('SOL');
  });

  it('should set alive to true', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.alive).toBe(true);
  });

  it('should set pendingDestruction to false by default', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.pendingDestruction).toBe(false);
  });

  it('should use config dimensions', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.width).toBe(GameConfig.enemies.width);
    expect(enemy.height).toBe(GameConfig.enemies.height);
  });

  it('should use config color', () => {
    const enemy = createEnemy(word, id);
    expect(enemy.color).toBe(GameConfig.enemies.color);
  });

  it('should apply speed within variance range', () => {
    const baseSpeed = GameConfig.enemies.baseSpeed;
    const variance = GameConfig.enemies.speedVariance;
    const minSpeed = baseSpeed * (1 - variance);
    const maxSpeed = baseSpeed * (1 + variance);

    // Run many times to verify speed stays in range
    for (let i = 0; i < 100; i++) {
      const enemy = createEnemy(word, i);
      expect(enemy.speed).toBeGreaterThanOrEqual(minSpeed);
      expect(enemy.speed).toBeLessThanOrEqual(maxSpeed);
    }
  });

  it('should produce an EnemyState matching the interface', () => {
    const enemy = createEnemy(word, id);
    const _check: EnemyState = enemy;
    expect(_check).toBe(enemy);
  });
});
