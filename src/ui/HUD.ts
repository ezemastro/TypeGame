import Phaser from 'phaser';
import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

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
    },
  };
}
