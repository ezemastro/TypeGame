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
  {
    id: 'SHIELD',
    name: 'Escudo',
    description: 'Absorbe 1 golpe. Recarga cada 30s',
  },
  {
    id: 'ALLY',
    name: 'Aliado',
    description: 'Dron que dispara automáticamente',
  },
  {
    id: 'MAGNETIC_FIELD',
    name: 'Campo Magnético',
    description: 'Atrae enemigos cercanos',
  },
  {
    id: 'BURST_FIRE',
    name: 'Ráfaga',
    description: 'Dispara 2 proyectiles por letra',
  },
  {
    id: 'LIFE_STEAL',
    name: 'Robo de Vida',
    description: 'Eliminar enemigos reduce el calor',
  },
  {
    id: 'FREEZE',
    name: 'Congelación',
    description: 'Los enemigos cercanos se congelan',
  },
];

export function getRandomChoices(count: number): PowerUpChoice[] {
  const shuffled = [...ALL_POWERUPS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ALL_POWERUPS.length));
}
