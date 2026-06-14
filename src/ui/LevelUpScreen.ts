import Phaser from 'phaser';
import type { PowerUpChoice } from '../entities/types';
import { GameConfig } from '../config';

export interface LevelUpScreen {
  container: Phaser.GameObjects.Container;
  select(index: number): string;
  destroy(): void;
}

export function showLevelUp(
  scene: Phaser.Scene,
  choices: PowerUpChoice[],
  onSelect: (powerUpId: string) => void,
): LevelUpScreen {
  const cx = GameConfig.canvas.width / 2;
  const cy = GameConfig.canvas.height / 2;
  const depth = 300;

  const container = scene.add.container(0, 0);

  // Dark overlay
  const overlay = scene.add.rectangle(
    GameConfig.canvas.width / 2,
    GameConfig.canvas.height / 2,
    GameConfig.canvas.width,
    GameConfig.canvas.height,
    0x000000,
    0.7,
  );
  overlay.setDepth(depth);
  container.add(overlay);

  // Title
  const title = scene.add.text(cx, cy - 100, 'LEVEL UP!', {
    fontFamily: GameConfig.wordDisplay.fontFamily,
    fontSize: '36px',
    color: '#ffdd00',
  });
  title.setOrigin(0.5);
  title.setDepth(depth + 1);
  container.add(title);

  // Choice rectangles and text
  const rectHeight = 50;
  const rectWidth = 500;
  const startY = cy - 20;

  for (let i = 0; i < choices.length; i++) {
    const y = startY + i * (rectHeight + 12);
    const rect = scene.add.rectangle(cx, y, rectWidth, rectHeight, 0x333355, 0.9);
    rect.setDepth(depth + 1);
    rect.setStrokeStyle(2, 0x00ff88);
    container.add(rect);

    const label = `[${i + 1}] ${choices[i].name} — ${choices[i].description}`;
    const text = scene.add.text(cx, y, label, {
      fontFamily: GameConfig.wordDisplay.fontFamily,
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: rectWidth - 20 },
      align: 'center',
    });
    text.setOrigin(0.5);
    text.setDepth(depth + 2);
    container.add(text);
  }

  container.setDepth(depth);

  // Keyboard listener
  const keyHandler = (event: KeyboardEvent) => {
    const keyNum = parseInt(event.key, 10);
    if (keyNum >= 1 && keyNum <= choices.length) {
      const choice = choices[keyNum - 1];
      onSelect(choice.id);
      // Remove listener after selection
      scene.input.keyboard!.off('keydown', keyHandler);
    }
  };
  scene.input.keyboard!.on('keydown', keyHandler);

  return {
    container,
    select(index: number): string {
      if (index < 0 || index >= choices.length) return '';
      return choices[index].id;
    },
    destroy(): void {
      scene.input.keyboard!.off('keydown', keyHandler);
      container.destroy();
    },
  };
}
