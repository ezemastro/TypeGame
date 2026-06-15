import Phaser from 'phaser';
import { GameConfig } from '../config';

export interface GameOverScreen {
  destroy(): void;
}

export function showGameOver(
  scene: Phaser.Scene,
  score: number,
): GameOverScreen {
  const cx = GameConfig.canvas.width / 2;
  const cy = GameConfig.canvas.height / 2;
  const depth = 200;
  const font = GameConfig.hud.fontFamily;

  // Dark space overlay
  const overlay = scene.add.rectangle(cx, cy, 440, 280, 0x0B0E2A, 0.88);
  overlay.setDepth(depth);
  overlay.setStrokeStyle(2, 0x00E5FF, 0.4);

  // Game title
  const gameTitle = scene.add.text(cx, cy - 90, 'ASTROTYPE', {
    fontFamily: font,
    fontSize: '18px',
    color: '#00E5FF',
  });
  gameTitle.setOrigin(0.5);
  gameTitle.setDepth(depth + 1);

  // GAME OVER in red
  const title = scene.add.text(cx, cy - 50, 'GAME OVER', {
    fontFamily: font,
    fontSize: '34px',
    color: '#FF5252',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);
  title.setDepth(depth + 1);

  // Final score
  const scoreDisplay = scene.add.text(cx, cy + 10, `SCORE  ${score}`, {
    fontFamily: font,
    fontSize: '22px',
    color: '#FFD740',
  });
  scoreDisplay.setOrigin(0.5);
  scoreDisplay.setDepth(depth + 1);

  // Restart hint
  const restartText = scene.add.text(cx, cy + 60, '[R]  RESTART', {
    fontFamily: font,
    fontSize: '16px',
    color: '#FFFFFF',
  });
  restartText.setOrigin(0.5);
  restartText.setDepth(depth + 1);

  // Decorative corner accents
  const accentSize = 8;
  const margin = 12;
  const corners = [
    [cx - 220 + margin, cy - 140 + margin],
    [cx + 220 - margin, cy - 140 + margin],
    [cx - 220 + margin, cy + 140 - margin],
    [cx + 220 - margin, cy + 140 - margin],
  ];
  const accents = corners.map(([ax, ay]) => {
    const dot = scene.add.circle(ax, ay, 2, 0x00E5FF, 0.5);
    dot.setDepth(depth + 1);
    return dot;
  });

  const objects = [overlay, gameTitle, title, scoreDisplay, restartText, ...accents];

  return {
    destroy(): void {
      for (const obj of objects) {
        obj.destroy();
      }
    },
  };
}
