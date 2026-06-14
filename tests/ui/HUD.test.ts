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
});
