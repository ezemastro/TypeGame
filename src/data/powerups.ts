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
];

export function getRandomChoices(count: number): PowerUpChoice[] {
  const shuffled = [...ALL_POWERUPS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ALL_POWERUPS.length));
}
