import type { GameState } from '../entities/types';
import type { EnemyState } from '../entities/Enemy';

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

// ── Stack count utility ─────────────────────────────────────────────

/** Count occurrences of `id` in `activePowerUps`. Used by all stack- scaling formulas. */
export function getStackCount(activePowerUps: string[], id: string): number {
  return activePowerUps.filter((p) => p === id).length;
}

// ── Ally drone color selection ──────────────────────────────────────

/** Return the hex color for ally drone at `index` from the palette (wraps with modulo). */
export function getAllyDroneColor(index: number, palette: string[]): string {
  return palette[index % palette.length];
}

// ── Ally bullet damage ──────────────────────────────────────────────

/**
 * Peel one letter from a word on ally bullet hit.
 * Returns the new word and whether this kills the target.
 */
export function applyAllyDamage(word: string): { word: string; killed: boolean } {
  const next = word.slice(1);
  return { word: next, killed: next.length === 0 };
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
    '[': 'RICOCHET',
  };
  return map[key] ?? null;
}

/** Return the dev key → powerup name mapping for the debug guide overlay. */
export function getDevKeyGuide(): { key: string; id: string; name: string }[] {
  const keyMap: Record<string, string> = {
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
    '[': 'RICOCHET',
  };
  const nameMap: Record<string, string> = {
    EXPLOSIVE_IMPACT: 'Impacto Explosivo',
    QUICK_COOLING: 'Enfriamiento Rápido',
    SHARP_SIGHT: 'Vista Aguda',
    SLOW_AURA: 'Aura Ralentizadora',
    PIERCING_SHOT: 'Bala Perforante',
    DUAL_SHOT: 'Doble Arma',
    SHIELD: 'Escudo',
    ALLY: 'Aliado',
    MAGNETIC_FIELD: 'Campo Magnético',
    BURST_FIRE: 'Ráfaga',
    LIFE_STEAL: 'Robo de Vida',
    FREEZE: 'Congelación',
    RICOCHET: 'Rebote',
  };
  return Object.entries(keyMap).map(([key, id]) => ({
    key,
    id,
    name: nameMap[id] ?? id,
  }));
}

// ── Dual Weapon cannon offsets ────────────────────────────────────────

/** Offset relative to ship center for a dual-shot cannon. */
export interface CannonOffset {
  x: number;
  y: number;
}

/**
 * Compute side-cannon positions for DUAL_SHOT stacking.
 * Each stack adds one cannon, alternating left/right.
 * First 4 stacks: cannons stay inside shipWidth bounds.
 * Stacks beyond 4 may protrude outside.
 *
 * @param stacks    Number of active DUAL_SHOT stacks
 * @param shipWidth Width of the ship in pixels (for inside-bound check)
 * @param perStep   Horizontal spacing between successive cannons on the same side
 */
export function getDualCannonOffsets(
  stacks: number,
  shipWidth: number,
  perStep: number,
): CannonOffset[] {
  const offsets: CannonOffset[] = [];
  const halfShip = shipWidth / 2;

  for (let i = 0; i < stacks; i++) {
    const side = i % 2 === 0 ? -1 : 1; // alternate left/right
    const step = Math.floor(i / 2) + 1;
    const x = side * step * perStep;
    // First 4 stacks: clamp to inside ship
    const clampedX =
      i < 4 ? Math.max(-halfShip + 4, Math.min(halfShip - 4, x)) : x;
    offsets.push({ x: clampedX, y: 0 });
  }

  return offsets;
}

// ── Magnetic Field radius scaling ─────────────────────────────────────

/** Compute effective magnetic field radius from stack count. */
export function getMagneticFieldRadius(
  baseRadius: number,
  stacks: number,
  perStack: number,
): number {
  return baseRadius + stacks * perStack;
}

// ── Piercing cannon two-part dimensions ───────────────────────────────

export interface PiercingCannonParts {
  bodyHeight: number;
  bodyWidth: number;
  tipOffsetY: number;
  tipHeight: number;
}

export interface PiercingCannonConfig {
  baseHeight: number;
  heightPerStack: number;
  baseWidth: number;
  tipHeight: number;
}

/** Compute two-part piercing cannon dimensions from stack count. */
export function getPiercingCannonParts(
  stacks: number,
  cfg: PiercingCannonConfig,
): PiercingCannonParts {
  const bodyHeight = cfg.baseHeight + stacks * cfg.heightPerStack;
  return {
    bodyHeight,
    bodyWidth: cfg.baseWidth,
    tipOffsetY: -bodyHeight, // tip sits at top of barrel (negative Y = up)
    tipHeight: cfg.tipHeight,
  };
}
