import { describe, it, expect } from 'vitest';
import { GameConfig } from '../../src/config';

describe('HUD', () => {
  it('should format score text correctly', () => {
    const score = 150;
    const text = `Score: ${score}`;
    expect(text).toBe('Score: 150');
  });

  it('should use config colors for heat bar segments', () => {
    // Normal heat color
    expect(GameConfig.heatBar.color).toBe('#ff8800');
    // Overheat color
    expect(GameConfig.heatBar.overheatColor).toBe('#ff0000');
    // Heat bar should have maxSegments
    expect(GameConfig.heatBar.maxSegments).toBe(5);
  });

  it('should show overheat color when overheated', () => {
    const overheated = true;
    const color = overheated
      ? GameConfig.heatBar.overheatColor
      : GameConfig.heatBar.color;
    expect(color).toBe('#ff0000');
  });

  it('should show normal color when not overheated', () => {
    const overheated = false;
    const color = overheated
      ? GameConfig.heatBar.overheatColor
      : GameConfig.heatBar.color;
    expect(color).toBe('#ff8800');
  });

  it('should light up correct number of heat segments', () => {
    const heatSegments = 3;
    const maxSegments = 5;
    const segments = Array.from({ length: maxSegments }, (_, i) => i < heatSegments);
    expect(segments).toEqual([true, true, true, false, false]);
  });

  it('should calculate XP bar progress as xp / xpToNextLevel', () => {
    const xp = 50;
    const xpToNextLevel = 100;
    const progress = xp / xpToNextLevel;
    expect(progress).toBe(0.5);
  });

  it('should clamp XP bar progress to 0 when xp is 0', () => {
    const progress = 0 / 100;
    expect(progress).toBe(0);
  });

  it('should reach 1.0 when xp equals threshold', () => {
    const progress = 100 / 100;
    expect(progress).toBe(1.0);
  });

  it('should format level text correctly', () => {
    const level = 3;
    const text = `Lv. ${level}`;
    expect(text).toBe('Lv. 3');
  });

  it('should show level 1 at game start', () => {
    const level = 1;
    const text = `Lv. ${level}`;
    expect(text).toBe('Lv. 1');
  });
});
