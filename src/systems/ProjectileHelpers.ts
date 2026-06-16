import type { EnemyState } from '../entities/Enemy';

/**
 * Find the nearest alive enemy to a given position within a search radius.
 * Uses enemy center as position reference.
 */
export function findNearestEnemyToPosition(
  enemies: EnemyState[],
  x: number,
  y: number,
  searchRadius: number,
): EnemyState | null {
  let nearest: EnemyState | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    const dx = cx - x;
    const dy = cy - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= searchRadius && dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

/**
 * Count active RICOCHET power-up stacks.
 * Each RICOCHET pickup adds one entry to activePowerUps.
 */
export function getRicochetBounces(activePowerUps: string[]): number {
  return activePowerUps.filter((id) => id === 'RICOCHET').length;
}

/**
 * Count active PIERCING_SHOT power-up stacks.
 */
export function getPiercingCount(activePowerUps: string[]): number {
  return activePowerUps.filter((id) => id === 'PIERCING_SHOT').length;
}

/**
 * Calculate pierce distance based on base distance, multiplier, and stack count.
 * Formula: baseDistance * (1 + stackMultiplier * pierceCount)
 */
export function calculatePierceDistance(
  baseDistance: number,
  stackMultiplier: number,
  pierceCount: number,
): number {
  return baseDistance * (1 + stackMultiplier * pierceCount);
}

/**
 * Find the nearest alive enemy to a given position, excluding enemies whose IDs
 * are in the excludeIds set. No search radius — finds the absolute nearest.
 */
export function findNearestEnemy(
  enemies: EnemyState[],
  cx: number,
  cy: number,
  excludeIds: Set<number>,
): EnemyState | null {
  let nearest: EnemyState | null = null;
  let nearestDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.alive || excludeIds.has(enemy.id)) continue;
    const ex = enemy.x + enemy.width / 2;
    const ey = enemy.y + enemy.height / 2;
    const dx = ex - cx;
    const dy = ey - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }
  return nearest;
}
