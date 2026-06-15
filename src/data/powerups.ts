import type { PowerUpChoice } from '../entities/types';

export const ALL_POWERUPS: PowerUpChoice[] = [
  {
    id: 'EXPLOSIVE_IMPACT',
    name: 'Impacto Explosivo',
    description: 'Al destruir un enemigo, empuja a los cercanos',
  },
  {
    id: 'QUICK_COOLING',
    name: 'Enfriamiento Rápido',
    description: 'La barra de calor se vacía el doble de rápido',
  },
  {
    id: 'SHARP_SIGHT',
    name: 'Vista Aguda',
    description: '+10% puntos por cada letra',
  },
  {
    id: 'SLOW_AURA',
    name: 'Aura Ralentizadora',
    description: 'Los enemigos cercanos se mueven a la mitad de velocidad',
  },
  {
    id: 'PIERCING_SHOT',
    name: 'Bala Perforante',
    description: 'Atraviesa al primer enemigo y daña al que está detrás',
  },
  {
    id: 'DUAL_SHOT',
    name: 'Doble Arma',
    description: 'Dispara a los dos enemigos más cercanos con la misma letra',
  },
];

export function getRandomChoices(count: number): PowerUpChoice[] {
  const shuffled = [...ALL_POWERUPS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ALL_POWERUPS.length));
}
