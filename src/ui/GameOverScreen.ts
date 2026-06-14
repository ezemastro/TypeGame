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

  const overlay = scene.add.rectangle(cx, cy, 400, 250, 0x000000, 0.8);
  overlay.setDepth(depth);

  const title = scene.add.text(cx, cy - 60, 'GAME OVER', {
    fontFamily: GameConfig.wordDisplay.fontFamily,
    fontSize: '36px',
    color: '#ff4444',
  });
  title.setOrigin(0.5);
  title.setDepth(depth + 1);

  const scoreDisplay = scene.add.text(cx, cy, `Final Score: ${score}`, {
    fontFamily: GameConfig.wordDisplay.fontFamily,
    fontSize: '22px',
    color: '#ffffff',
  });
  scoreDisplay.setOrigin(0.5);
  scoreDisplay.setDepth(depth + 1);

  const restartText = scene.add.text(cx, cy + 60, 'Press R to Restart', {
    fontFamily: GameConfig.wordDisplay.fontFamily,
    fontSize: '18px',
    color: '#00ff88',
  });
  restartText.setOrigin(0.5);
  restartText.setDepth(depth + 1);

  const objects = [overlay, title, scoreDisplay, restartText];

  return {
    destroy(): void {
      for (const obj of objects) {
        obj.destroy();
      }
    },
  };
}
