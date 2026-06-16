import { describe, it, expect } from 'vitest';
import { ALL_POWERUPS, getRandomChoices } from '../../src/data/powerups';
import type { PowerUpChoice } from '../../src/entities/types';

describe('PowerUpChoice type', () => {
  it('should have the correct shape', () => {
    const choice: PowerUpChoice = {
      id: 'EXPLOSIVE_IMPACT',
      name: 'Impacto Explosivo',
      description: 'Al destruir un enemigo, empuja a los cercanos',
    };

    expect(choice.id).toBe('EXPLOSIVE_IMPACT');
    expect(choice.name).toBe('Impacto Explosivo');
    expect(choice.description).toBe('Al destruir un enemigo, empuja a los cercanos');
  });
});

describe('ALL_POWERUPS', () => {
  it('should contain exactly 13 power-up definitions (6 original + 7 new including RICOCHET)', () => {
    expect(ALL_POWERUPS).toHaveLength(13);
  });

  it('should include EXPLOSIVE_IMPACT', () => {
    const pu = ALL_POWERUPS.find((p) => p.id === 'EXPLOSIVE_IMPACT');
    expect(pu).toBeDefined();
    expect(pu!.name).toBe('Impacto Explosivo');
  });

  it('should include QUICK_COOLING', () => {
    const pu = ALL_POWERUPS.find((p) => p.id === 'QUICK_COOLING');
    expect(pu).toBeDefined();
    expect(pu!.name).toBe('Enfriamiento Rápido');
  });

  it('should include SHARP_SIGHT', () => {
    const pu = ALL_POWERUPS.find((p) => p.id === 'SHARP_SIGHT');
    expect(pu).toBeDefined();
    expect(pu!.name).toBe('Vista Aguda');
  });

  it('should include SLOW_AURA', () => {
    const pu = ALL_POWERUPS.find((p) => p.id === 'SLOW_AURA');
    expect(pu).toBeDefined();
    expect(pu!.name).toBe('Aura Ralentizadora');
    expect(pu!.description).toBe('Los enemigos cercanos se mueven a la mitad de velocidad');
  });

  it('should include PIERCING_SHOT', () => {
    const pu = ALL_POWERUPS.find((p) => p.id === 'PIERCING_SHOT');
    expect(pu).toBeDefined();
    expect(pu!.name).toBe('Bala Perforante');
    expect(pu!.description).toBe('Atraviesa al primer enemigo y daña al que está detrás');
  });

  it('should include DUAL_SHOT', () => {
    const pu = ALL_POWERUPS.find((p) => p.id === 'DUAL_SHOT');
    expect(pu).toBeDefined();
    expect(pu!.name).toBe('Doble Arma');
    expect(pu!.description).toBe('Dispara a los dos enemigos más cercanos con la misma letra');
  });

  // New powerups from powerups-rework
  const expectedNew = [
    { id: 'SHIELD', name: 'Escudo', description: 'Absorbe 1 golpe. Recarga cada 30s' },
    { id: 'ALLY', name: 'Aliado', description: 'Dron que dispara automáticamente' },
    { id: 'MAGNETIC_FIELD', name: 'Campo Magnético', description: 'Atrae enemigos cercanos' },
    { id: 'BURST_FIRE', name: 'Ráfaga', description: 'Dispara 2 proyectiles por letra' },
    { id: 'LIFE_STEAL', name: 'Robo de Vida', description: 'Eliminar enemigos reduce el calor' },
    { id: 'FREEZE', name: 'Congelación', description: 'Los enemigos cercanos se congelan' },
    { id: 'RICOCHET', name: 'Rebote', description: 'La bala rebota hacia otro enemigo' },
  ];

  for (const expected of expectedNew) {
    it(`should include ${expected.id}`, () => {
      const found = ALL_POWERUPS.find((p) => p.id === expected.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe(expected.name);
      expect(found!.description).toBe(expected.description);
    });
  }

  it('should have unique IDs', () => {
    const ids = ALL_POWERUPS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ALL_POWERUPS.length);
  });
});

describe('getRandomChoices', () => {
  it('should return the requested number of choices', () => {
    const choices = getRandomChoices(2);
    expect(choices).toHaveLength(2);
  });

  it('should return 3 choices when count is 3', () => {
    const choices = getRandomChoices(3);
    expect(choices).toHaveLength(3);
  });

  it('should return all choices when count >= total', () => {
    const choices = getRandomChoices(100);
    expect(choices).toHaveLength(ALL_POWERUPS.length);
  });

  it('should return empty array when count is 0', () => {
    const choices = getRandomChoices(0);
    expect(choices).toHaveLength(0);
  });

  it('should return valid power-up definitions (all have required fields)', () => {
    const choices = getRandomChoices(3);
    for (const choice of choices) {
      expect(choice.id).toBeTruthy();
      expect(choice.name).toBeTruthy();
      expect(choice.description).toBeTruthy();
    }
  });
});
