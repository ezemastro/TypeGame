import type { GameState, EnemyState } from '../entities/types';

/**
 * Pure helpers for powerup rendering and logic.
 * Extracted from GameScene/HUD to keep rendering code focused on Phaser APIs.
 */

// ── 3.2 Explosive push ──────────────────────────────────────────────

/** Find all alive enemies whose center is within `radius` pixels of (cx, cy). */
export function getEnemiesInRadius(
  state: GameState,
  cx: number,
  cy: number,
  radius: number,
): EnemyState[] {
  return state.enemies.filter((e) => {
    if (!e.alive) return false;
    const ecx = e.x + e.width / 2;
    const ecy = e.y + e.height / 2;
    const dx = ecx - cx;
    const dy = ecy - cy;
    return Math.sqrt(dx * dx + dy * dy) < radius;
  });
}

// ── 3.3 Burst fire ──────────────────────────────────────────────────

/** Return two angles offset ±spreadDeg from baseAngle (in radians). */
export function calculateBurstAngles(
  baseAngleRad: number,
  spreadDeg: number,
): [number, number] {
  const halfRad = (spreadDeg * Math.PI) / 180;
  return [baseAngleRad - halfRad, baseAngleRad + halfRad];
}

// ── 3.6 Ally drone targeting ────────────────────────────────────────

/**
 * Find the Nth closest alive enemy to (originX, originY).
 * N=1 returns closest, N=2 returns second-closest, etc.
 * Returns null if fewer than N alive enemies exist.
 */
export function findNthClosestEnemy(
  state: GameState,
  originX: number,
  originY: number,
  n: number,
): EnemyState | null {
  const alive = state.enemies.filter((e) => e.alive);
  if (alive.length < n) return null;

  const withDist = alive.map((e) => {
    const cx = e.x + e.width / 2;
    const cy = e.y + e.height / 2;
    return {
      enemy: e,
      dist: Math.sqrt((cx - originX) ** 2 + (cy - originY) ** 2),
    };
  });

  withDist.sort((a, b) => a.dist - b.dist);
  return withDist[n - 1].enemy;
}

// ── 3.5 Shield concentric circles ───────────────────────────────────

/** Return array of radii for `charges` concentric shield circles. */
export function getShieldCircleRadii(
  charges: number,
  baseRadius: number,
  step: number,
): number[] {
  return Array.from({ length: charges }, (_, i) => baseRadius + i * step);
}

// ── 3.9 / 3.10 Cooldown indicators ──────────────────────────────────

/** Return progress ratio (0..1) for a cooldown. 1 = just started, 0 = expired. */
export function calculateCooldownProgress(
  remaining: number | undefined,
  total: number,
): number {
  if (remaining === undefined || remaining <= 0) return 0;
  return remaining / total;
}

// ── 3.8 LevelUpScreen card layout ───────────────────────────────────

/** Return center-X positions for `count` cards of `size` with `gap` px spacing. */
export function calculateCardPositions(
  canvasWidth: number,
  cardSize: number,
  gap: number,
  count: number = 3,
): number[] {
  if (count === 0) return [];
  const totalWidth = count * cardSize + (count - 1) * gap;
  const leftMargin = (canvasWidth - totalWidth) / 2;
  return Array.from({ length: count }, (_, i) =>
    leftMargin + cardSize / 2 + i * (cardSize + gap),
  );
}

// ── Dev Mode key mapping ────────────────────────────────────────────

/** Map keyboard key to powerup ID for dev mode activation. Returns null if not a dev key. */
export function mapDevKeyToPowerUp(key: string): string | null {
  const map: Record<string, string> = {
    '1': 'EXPLOSIVE_IMPACT',
    '2': 'QUICK_COOLING',
    '3': 'SHARP_SIGHT',
    '4': 'SLOW_AURA',
    '5': 'PIERCING_SHOT',
    '6': 'DUAL_SHOT',
    '7': 'SHIELD',
    '8': 'ALLY',
    '9': 'MAGNETIC_FIELD',
    '0': 'BURST_FIRE',
    '-': 'LIFE_STEAL',
    '=': 'FREEZE',
  };
  return map[key] ?? null;
}
