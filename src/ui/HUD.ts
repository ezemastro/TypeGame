import Phaser from 'phaser';
import type { GameState } from '../entities/types';
import { GameConfig } from '../config';
import { calculateCooldownProgress } from '../systems/PowerUpHelpers';

export interface HUD {
  update(state: GameState): void;
}

export function createHUD(scene: Phaser.Scene): HUD {
  const font = GameConfig.hud.fontFamily;

  // Score — top-left, cyan glow
  const scoreText = scene.add.text(14, 14, 'SCORE 0', {
    fontFamily: font,
    fontSize: '18px',
    color: '#00E5FF',
  });
  scoreText.setDepth(100);

  // Level text — bottom-left, gold
  const levelText = scene.add.text(14, GameConfig.canvas.height - 52, 'LV.1', {
    fontFamily: font,
    fontSize: '14px',
    color: '#FFD740',
  });
  levelText.setDepth(100);

  // XP bar — thin line across top, cyan fill on dark bg
  const xpBarWidth = GameConfig.canvas.width;
  const xpBarHeight = 4;
  const xpBarBg = scene.add.rectangle(
    xpBarWidth / 2,
    xpBarHeight / 2,
    xpBarWidth,
    xpBarHeight,
    0x1E1E3F,
  );
  xpBarBg.setDepth(100);

  const xpBarFill = scene.add.rectangle(
    0,
    xpBarHeight / 2,
    0,
    xpBarHeight,
    0x00E5FF,
  );
  xpBarFill.setOrigin(0, 0.5);
  xpBarFill.setDepth(101);

  const heatRects: Phaser.GameObjects.Rectangle[] = [];
  const heatBarY = GameConfig.canvas.height - 30;
  const segWidth = 20;
  const segHeight = 16;
  const segGap = 4;
  const dimColor = 0x1E1E3F;

  for (let i = 0; i < GameConfig.heatBar.maxSegments; i++) {
    const x = GameConfig.canvas.width - 10 - (i + 1) * (segWidth + segGap);
    const rect = scene.add.rectangle(x, heatBarY, segWidth, segHeight, dimColor);
    rect.setOrigin(0.5, 0.5);
    rect.setStrokeStyle(1, 0x00E5FF, 0.3);
    rect.setDepth(100);
    heatRects.push(rect);
  }

  // ── 3.9 Shield cooldown indicator (cyan arc) ──────────────────────
  const shieldCfg = GameConfig.powerUps.shield;
  const shieldArcX = GameConfig.canvas.width - 140;
  const shieldArcY = GameConfig.canvas.height - 30;
  const arcRadius = 14;

  const shieldArcBg = scene.add.circle(shieldArcX, shieldArcY, arcRadius, 0x1E1E3F, 0.8);
  shieldArcBg.setDepth(100);
  shieldArcBg.setStrokeStyle(1, 0x00BCD4, 0.3);

  const shieldArcFill = scene.add.graphics();
  shieldArcFill.setDepth(101);

  // Shield label
  const shieldLabel = scene.add.text(shieldArcX, shieldArcY, '🛡', {
    fontSize: '10px',
  });
  shieldLabel.setOrigin(0.5);
  shieldLabel.setDepth(102);

  // ── 3.10 Freeze cooldown indicator (blue arc) ─────────────────────
  const freezeCfg = GameConfig.powerUps.freeze;
  const freezeArcX = GameConfig.canvas.width - 100;
  const freezeArcY = GameConfig.canvas.height - 30;

  const freezeArcBg = scene.add.circle(freezeArcX, freezeArcY, arcRadius, 0x1E1E3F, 0.8);
  freezeArcBg.setDepth(100);
  freezeArcBg.setStrokeStyle(1, 0x80DEEA, 0.3);

  const freezeArcFill = scene.add.graphics();
  freezeArcFill.setDepth(101);

  // Freeze label
  const freezeLabel = scene.add.text(freezeArcX, freezeArcY, '❄', {
    fontSize: '10px',
  });
  freezeLabel.setOrigin(0.5);
  freezeLabel.setDepth(102);

  /** Draw a filled arc on a Graphics object representing progress 0..1. */
  const drawArc = (
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    progress: number,
    color: number,
  ): void => {
    gfx.clear();
    if (progress <= 0) return;
    // Draw a pie slice from top (-PI/2) clockwise
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;
    const segments = Math.max(8, Math.floor(progress * 32));
    gfx.fillStyle(color, 0.5);
    gfx.beginPath();
    gfx.moveTo(cx, cy);
    for (let i = 0; i <= segments; i++) {
      const a = startAngle + (i / segments) * (endAngle - startAngle);
      gfx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    }
    gfx.closePath();
    gfx.fillPath();
  };

  return {
    update(state: GameState): void {
      scoreText.setText(`SCORE ${state.score}`);
      levelText.setText(`LV.${state.level}`);

      // Update XP bar width based on progress
      const progress = state.xpToNextLevel > 0
        ? Math.min(state.xp / state.xpToNextLevel, 1)
        : 1;
      xpBarFill.width = progress * xpBarWidth;

      const heatColorStr = state.overheated
        ? GameConfig.heatBar.overheatColor
        : GameConfig.heatBar.color;
      const heatColor = parseInt(heatColorStr.slice(1), 16);

      for (let i = 0; i < heatRects.length; i++) {
        heatRects[i].setFillStyle(
          i < state.heatSegments ? heatColor : dimColor,
        );
      }

      // Shield cooldown arc (3.9)
      const shieldProgress = calculateCooldownProgress(
        state.powerUpState.cooldowns.SHIELD,
        shieldCfg.cooldownMs,
      );
      drawArc(
        shieldArcFill,
        shieldArcX,
        shieldArcY,
        arcRadius - 2,
        shieldProgress,
        0x00BCD4,
      );

      // Freeze cooldown arc (3.10)
      const freezeProgress = calculateCooldownProgress(
        state.powerUpState.cooldowns.FREEZE,
        freezeCfg.cooldownMs,
      );
      drawArc(
        freezeArcFill,
        freezeArcX,
        freezeArcY,
        arcRadius - 2,
        freezeProgress,
        0x80DEEA,
      );
    },
  };
}
