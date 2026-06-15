import { describe, it, expect } from 'vitest';
import { createPlayer, type PlayerState } from '../../src/entities/Player';

describe('PlayerState', () => {
  it('should create a player at the config position', () => {
    const player = createPlayer();
    expect(player.x).toBe(400);
    expect(player.y).toBe(500);
  });

  it('should create a player with config dimensions', () => {
    const player = createPlayer();
    expect(player.width).toBe(50);
    expect(player.height).toBe(50);
  });

  it('should create a player that is alive', () => {
    const player = createPlayer();
    expect(player.alive).toBe(true);
  });

  it('should have zero initial movement deltas', () => {
    const player = createPlayer();
    expect(player.dx).toBe(0);
    expect(player.dy).toBe(0);
  });

  it('should have color from GameConfig', () => {
    const player = createPlayer();
    expect(player.color).toBe('#00E5FF');
  });

  it('should produce a PlayerState that matches the interface contract', () => {
    const player = createPlayer();
    const _check: PlayerState = player;
    expect(_check).toBe(player);
  });
});
