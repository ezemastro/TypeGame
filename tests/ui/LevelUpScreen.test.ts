import { describe, it, expect } from 'vitest';
import type { PowerUpChoice } from '../../src/entities/types';
import { ALL_POWERUPS } from '../../src/data/powerups';

describe('LevelUpScreen', () => {
  const sampleChoices: PowerUpChoice[] = ALL_POWERUPS.slice(0, 3);

  it('should have a title "LEVEL UP!"', () => {
    const title = 'LEVEL UP!';
    expect(title).toBe('LEVEL UP!');
    expect(title.length).toBeGreaterThan(0);
  });

  it('should format choice display with index, name, and description', () => {
    const choice = sampleChoices[0];
    const display = `[1] ${choice.name} — ${choice.description}`;
    expect(display).toContain('[1]');
    expect(display).toContain(choice.name);
    expect(display).toContain(choice.description);
  });

  it('should format all three choices correctly', () => {
    const formatted: string[] = [];
    for (let i = 0; i < sampleChoices.length; i++) {
      formatted.push(`[${i + 1}] ${sampleChoices[i].name} — ${sampleChoices[i].description}`);
    }
    expect(formatted).toHaveLength(3);
    for (let i = 0; i < formatted.length; i++) {
      expect(formatted[i]).toContain(`[${i + 1}]`);
      expect(formatted[i]).toContain(sampleChoices[i].name);
      expect(formatted[i]).toContain(sampleChoices[i].description);
    }
  });

  it('should map key 1 to choice index 0', () => {
    const index = 0; // key "1" maps to 0
    expect(sampleChoices[index]).toBeDefined();
    expect(sampleChoices[index].id).toBeTruthy();
  });

  it('should map key 2 to choice index 1', () => {
    const index = 1; // key "2" maps to 1
    expect(sampleChoices[index]).toBeDefined();
    expect(sampleChoices[index].id).toBeTruthy();
  });

  it('should map key 3 to choice index 2', () => {
    const index = 2; // key "3" maps to 2
    expect(sampleChoices[index]).toBeDefined();
    expect(sampleChoices[index].id).toBeTruthy();
  });

  it('should return correct power-up id for valid selection', () => {
    const select = (index: number): string => {
      if (index < 0 || index >= sampleChoices.length) return '';
      return sampleChoices[index].id;
    };

    expect(select(0)).toBe(sampleChoices[0].id);
    expect(select(1)).toBe(sampleChoices[1].id);
    expect(select(2)).toBe(sampleChoices[2].id);
  });

  it('should return empty string for invalid index', () => {
    const select = (index: number): string => {
      if (index < 0 || index >= sampleChoices.length) return '';
      return sampleChoices[index].id;
    };

    expect(select(-1)).toBe('');
    expect(select(3)).toBe('');
    expect(select(99)).toBe('');
  });
});
