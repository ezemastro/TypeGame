import { describe, it, expect } from 'vitest';
import { GameConfig } from '../../src/config';

describe('PowerUp config', () => {
  it('should have shield config with cooldown, radius, color', () => {
    const s = GameConfig.powerUps.shield;
    expect(s).toBeDefined();
    expect(s.cooldownMs).toBe(30000);
    expect(s.circleRadius).toBe(28);
    expect(s.radiusStep).toBe(6);
    expect(s.color).toBe('#00BCD4');
    expect(s.alpha).toBe(0.3);
  });

  it('should have ally config with fire rate and horizontal offset', () => {
    const a = GameConfig.powerUps.ally;
    expect(a).toBeDefined();
    expect(a.fireRateMs).toBe(1500);
    expect(a.horizontalOffset).toBe(25);
    expect(Array.isArray(a.colorPalette)).toBe(true);
    expect(a.colorPalette.length).toBeGreaterThan(0);
  });

  it('should have magneticField config with radius and pull strength', () => {
    const mf = GameConfig.powerUps.magneticField;
    expect(mf).toBeDefined();
    expect(mf.radius).toBe(200);
    expect(mf.pullStrength).toBe(0.3);
    expect(mf.ringColor).toBe('#00BCD4');
    expect(mf.ringAlpha).toBe(0.1);
  });

  it('should have burstFire config with spread degrees', () => {
    const bf = GameConfig.powerUps.burstFire;
    expect(bf).toBeDefined();
    expect(bf.spreadDegrees).toBe(2.5);
  });

  it('should have lifeSteal config with heat reduction per stack', () => {
    const ls = GameConfig.powerUps.lifeSteal;
    expect(ls).toBeDefined();
    expect(ls.heatReduction).toBe(1);
  });

  it('should have freeze config with trigger radius, duration, cooldown, timeScale', () => {
    const f = GameConfig.powerUps.freeze;
    expect(f).toBeDefined();
    expect(f.triggerRadius).toBe(100);
    expect(f.durationMs).toBe(3000);
    expect(f.cooldownMs).toBe(18000);
    expect(f.timeScale).toBe(0.2);
  });

  it('should preserve existing powerUps options array with 6 original entries', () => {
    const opts = GameConfig.powerUps.options;
    expect(opts).toHaveLength(6);
    expect(opts).toContain('EXPLOSIVE_IMPACT');
    expect(opts).toContain('PIERCING_SHOT');
  });
});
