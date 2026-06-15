import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function combatSystem(state: GameState, delta: number): GameState {
  // Decrement cooldown timer
  if (state.shootCooldown > 0) {
    state.shootCooldown = Math.max(0, state.shootCooldown - delta);
  }

  if (state.gameOver || state.overheated) return state;
  if (state.targetedEnemyId === null) return state;
  if (state.shootCooldown > 0) return state;

  // Find the targeted enemy
  const enemy = state.enemies.find(
    (e) => e.id === state.targetedEnemyId && e.alive,
  );

  if (!enemy) return state;

  // Strip first letter and award points
  const strippedLetter = enemy.word[0];
  enemy.word = enemy.word.slice(1);
  state.forgivenKeys.push({ key: strippedLetter, expiresAt: state.elapsedTime + 1000 });
  const pointsPerLetter = state.activePowerUps.includes('SHARP_SIGHT')
    ? Math.floor(GameConfig.scoring.pointsPerLetter * GameConfig.powerUps.sharpSight.scoreMultiplier)
    : GameConfig.scoring.pointsPerLetter;
  state.score += pointsPerLetter;

  // Set cooldown and firing flag
  state.shootCooldown = GameConfig.shooting.cooldown;
  state.justFired = true;

  // Check if word fully destroyed
  if (enemy.word.length === 0) {
    enemy.pendingDestruction = true;
  }

  // Piercing Shot: damage another enemy behind the primary target
  if (
    state.activePowerUps.includes('PIERCING_SHOT') &&
    state.lastKeyPressed !== null
  ) {
    const playerCX = state.player.x + state.player.width / 2;
    const playerCY = state.player.y + state.player.height / 2;
    const primaryCX = enemy.x + enemy.width / 2;
    const primaryCY = enemy.y + enemy.height / 2;

    // Direction from player to primary target
    const pdx = primaryCX - playerCX;
    const pdy = primaryCY - playerCY;
    const primaryDist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (primaryDist > 0) {
      const pnx = pdx / primaryDist;
      const pny = pdy / primaryDist;
      const strippedLetter = state.lastKeyPressed;

      for (const other of state.enemies) {
        if (other.id === enemy.id || !other.alive) continue;
        if (!other.word.startsWith(strippedLetter)) continue;

        const otherCX = other.x + other.width / 2;
        const otherCY = other.y + other.height / 2;
        const odx = otherCX - playerCX;
        const ody = otherCY - playerCY;
        const otherDist = Math.sqrt(odx * odx + ody * ody);

        if (otherDist <= primaryDist) continue;

        const onx = odx / otherDist;
        const ony = ody / otherDist;
        const dot = pnx * onx + pny * ony;

        if (dot > 0.96) {
          // Piercing hit: strip first letter, no points
          const pierceLetter = other.word[0];
          other.word = other.word.slice(1);
          state.forgivenKeys.push({ key: pierceLetter, expiresAt: state.elapsedTime + 1000 });
          if (other.word.length === 0) {
            other.pendingDestruction = true;
          }
          break; // only one pierce per shot
        }
      }
    }
  }

  // Dual Shot: find a second target with the same starting letter
  if (
    state.activePowerUps.includes('DUAL_SHOT') &&
    state.lastKeyPressed !== null
  ) {
    const playerCX = state.player.x + state.player.width / 2;
    const playerCY = state.player.y + state.player.height / 2;
    const strippedLetter = state.lastKeyPressed;

    let closestDist = Infinity;
    let closestEnemy: typeof enemy | null = null;

    for (const other of state.enemies) {
      if (other.id === enemy.id || !other.alive) continue;
      if (!other.word.startsWith(strippedLetter)) continue;

      const otherCX = other.x + other.width / 2;
      const otherCY = other.y + other.height / 2;
      const odx = otherCX - playerCX;
      const ody = otherCY - playerCY;
      const otherDist = Math.sqrt(odx * odx + ody * ody);

      if (otherDist < closestDist) {
        closestDist = otherDist;
        closestEnemy = other;
      }
    }

    if (closestEnemy) {
      state.secondaryTargetId = closestEnemy.id;
      const dualLetter = closestEnemy.word[0];
      closestEnemy.word = closestEnemy.word.slice(1);
      state.forgivenKeys.push({ key: dualLetter, expiresAt: state.elapsedTime + 1000 });
      if (closestEnemy.word.length === 0) {
        closestEnemy.pendingDestruction = true;
      }
    }
  }

  return state;
}
