import Phaser from 'phaser';
import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export interface HUD {
  update(state: GameState): void;
}

export function createHUD(scene: Phaser.Scene): HUD {
  const scoreText = scene.add.text(10, 10, 'Score: 0', {
    fontFamily: GameConfig.wordDisplay.fontFamily,
    fontSize: '20px',
    color: GameConfig.wordDisplay.color,
  });
  scoreText.setDepth(100);

  const heatRects: Phaser.GameObjects.Rectangle[] = [];
  const heatBarY = GameConfig.canvas.height - 30;
  const segWidth = 20;
  const segHeight = 16;
  const segGap = 4;
  const dimColor = 0x333333;

  for (let i = 0; i < GameConfig.heatBar.maxSegments; i++) {
    const x = GameConfig.canvas.width - 10 - (i + 1) * (segWidth + segGap);
    const rect = scene.add.rectangle(x, heatBarY, segWidth, segHeight, dimColor);
    rect.setOrigin(0.5, 0.5);
    rect.setDepth(100);
    heatRects.push(rect);
  }

  return {
    update(state: GameState): void {
      scoreText.setText(`Score: ${state.score}`);

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
