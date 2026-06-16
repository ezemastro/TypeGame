import Phaser from 'phaser';
import type { PowerUpChoice } from '../entities/types';
import { GameConfig } from '../config';

export interface LevelUpScreen {
  container: Phaser.GameObjects.Container;
  select(index: number): string;
  destroy(): void;
}

/** Icon color per powerup — Circle World flat palette. */
const ICON_COLORS: Record<string, string> = {
  EXPLOSIVE_IMPACT: '#FF5252',
  QUICK_COOLING: '#448AFF',
  SHARP_SIGHT: '#FFD740',
  SLOW_AURA: '#7C4DFF',
  PIERCING_SHOT: '#69F0AE',
  DUAL_SHOT: '#FF6E40',
  RICOCHET: '#FF9100',
};

export function showLevelUp(
  scene: Phaser.Scene,
  choices: PowerUpChoice[],
  onSelect: (powerUpId: string) => void,
): LevelUpScreen {
  const cx = GameConfig.canvas.width / 2;
  const cy = GameConfig.canvas.height / 2;
  const depth = 300;
  const font = GameConfig.hud.fontFamily;

  const container = scene.add.container(0, 0);

  // Dark overlay with subtle space feel
  const overlay = scene.add.rectangle(
    GameConfig.canvas.width / 2,
    GameConfig.canvas.height / 2,
    GameConfig.canvas.width,
    GameConfig.canvas.height,
    0x0B0E2A,
    0.85,
  );
  overlay.setDepth(depth);
  container.add(overlay);

  // Title — cyan, Orbitron, bold
  const title = scene.add.text(cx, cy - 110, 'LEVEL UP!', {
    fontFamily: font,
    fontSize: '40px',
    color: '#00E5FF',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);
  title.setDepth(depth + 1);
  container.add(title);

  // Choice cards
  const rectHeight = 56;
  const rectWidth = 520;
  const startY = cy - 20;

  for (let i = 0; i < choices.length; i++) {
    const y = startY + i * (rectHeight + 14);
      const rect = scene.add.rectangle(cx, y, rectWidth, rectHeight, 0x1E1E3F, 0.95);
      rect.setDepth(depth + 1);
      rect.setStrokeStyle(2, 0x00E5FF, 0.6);
      container.add(rect);

      // Color icon indicator (left side of card)
      const iconColor = ICON_COLORS[choices[i].id] ?? '#00E5FF';
      const colorNum = parseInt(iconColor.slice(1), 16);
      const icon = scene.add.circle(cx - rectWidth / 2 + 28, y, 10, colorNum, 0.7);
      icon.setDepth(depth + 3);
      container.add(icon);

    const label = `[${i + 1}]  ${choices[i].name}  —  ${choices[i].description}`;
    const text = scene.add.text(cx, y, label, {
      fontFamily: font,
      fontSize: '14px',
      color: '#FFFFFF',
      wordWrap: { width: rectWidth - 24 },
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
