import Phaser from 'phaser';
import type { PowerUpChoice } from '../entities/types';
import { GameConfig } from '../config';
import { calculateCardPositions } from '../systems/PowerUpHelpers';

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
  SHIELD: '#00BCD4',
  ALLY: '#FF6B6B',
  MAGNETIC_FIELD: '#40C4FF',
  BURST_FIRE: '#FFAB40',
  LIFE_STEAL: '#E040FB',
  FREEZE: '#80DEEA',
};

/** Draw a Circle World icon for a powerup on a Graphics object. */
function drawPowerUpIcon(gfx: Phaser.GameObjects.Graphics, powerUpId: string): void {
  const colorStr = ICON_COLORS[powerUpId] ?? '#00E5FF';
  const color = parseInt(colorStr.slice(1), 16);
  gfx.clear();

  switch (powerUpId) {
    case 'EXPLOSIVE_IMPACT':
      // Starburst: central circle + radiating lines
      gfx.fillStyle(color, 0.7);
      gfx.fillCircle(0, 0, 10);
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4 - Math.PI / 2;
        gfx.fillRect(Math.cos(ang) * 12 - 2, Math.sin(ang) * 12 - 2, 4, 14);
      }
      break;
    case 'QUICK_COOLING':
      // Snowflake: central hexagon
      gfx.lineStyle(2, color, 0.9);
      gfx.strokeCircle(0, 0, 12);
      gfx.fillStyle(color, 0.5);
      gfx.fillCircle(0, 0, 5);
      break;
    case 'SHARP_SIGHT':
      // Eye: circle with inner dot
      gfx.lineStyle(2, color, 0.9);
      gfx.strokeCircle(0, 0, 14);
      gfx.fillStyle(color, 0.8);
      gfx.fillCircle(0, 0, 5);
      break;
    case 'SLOW_AURA':
      // Concentric rings
      gfx.lineStyle(2, color, 0.6);
      gfx.strokeCircle(0, 0, 6);
      gfx.lineStyle(1.5, color, 0.4);
      gfx.strokeCircle(0, 0, 13);
      gfx.lineStyle(1, color, 0.2);
      gfx.strokeCircle(0, 0, 20);
      break;
    case 'PIERCING_SHOT':
      // Arrow through target — line + circle
      gfx.lineStyle(3, color, 0.9);
      gfx.beginPath();
      gfx.moveTo(-18, 0);
      gfx.lineTo(18, 0);
      gfx.strokePath();
      gfx.fillStyle(color, 0.6);
      gfx.fillCircle(0, 0, 6);
      gfx.lineStyle(2, color, 0.8);
      gfx.strokeCircle(0, 0, 10);
      break;
    case 'DUAL_SHOT':
      // Two parallel small rects
      gfx.fillStyle(color, 0.8);
      gfx.fillRect(-10, -8, 5, 16);
      gfx.fillRect(5, -8, 5, 16);
      break;
    case 'SHIELD':
      // Shield shape: rounded hexagon approximation
      gfx.lineStyle(2, color, 0.8);
      gfx.strokeCircle(0, 0, 14);
      gfx.fillStyle(color, 0.25);
      gfx.fillCircle(0, 0, 14);
      break;
    case 'ALLY':
      // Drone: small circle + antenna
      gfx.fillStyle(color, 0.7);
      gfx.fillCircle(0, 0, 8);
      gfx.fillStyle(0xFFFFFF, 0.8);
      gfx.fillCircle(0, -3, 3);
      gfx.lineStyle(1.5, color, 0.8);
      gfx.beginPath();
      gfx.moveTo(0, -8);
      gfx.lineTo(0, -15);
      gfx.strokePath();
      break;
    case 'MAGNETIC_FIELD':
      // Horseshoe magnet: arc at bottom
      gfx.lineStyle(3, color, 0.8);
      gfx.beginPath();
      gfx.arc(0, 2, 14, Math.PI * 0.8, Math.PI * 2.2, false);
      gfx.strokePath();
      gfx.fillStyle(color, 0.5);
      gfx.fillRect(-6, -6, 4, 8);
      gfx.fillRect(2, -6, 4, 8);
      break;
    case 'BURST_FIRE':
      // Three small diamonds in a fan
      for (let j = -1; j <= 1; j++) {
        gfx.fillStyle(color, 0.7);
        const bx = j * 7;
        gfx.fillRect(bx - 1.5, -8, 3, 16);
      }
      break;
    case 'LIFE_STEAL':
      // Heart-like: two circles + triangle point
      gfx.fillStyle(color, 0.7);
      gfx.fillCircle(-5, -3, 6);
      gfx.fillCircle(5, -3, 6);
      gfx.fillTriangle(-10, 0, 10, 0, 0, 12);
      break;
    case 'FREEZE':
      // Ice crystal: six-pointed star
      gfx.lineStyle(2, color, 0.8);
      for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI) / 3 - Math.PI / 2;
        gfx.beginPath();
        gfx.moveTo(0, 0);
        gfx.lineTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
        gfx.strokePath();
      }
      gfx.fillStyle(color, 0.5);
      gfx.fillCircle(0, 0, 4);
      break;
    default:
      // Generic circle
      gfx.lineStyle(2, color, 0.8);
      gfx.strokeCircle(0, 0, 14);
      break;
  }
}

export function showLevelUp(
  scene: Phaser.Scene,
  choices: PowerUpChoice[],
  onSelect: (powerUpId: string) => void,
): LevelUpScreen {
  const canvasW = GameConfig.canvas.width;
  const canvasH = GameConfig.canvas.height;
  const cy = canvasH / 2;
  const depth = 300;
  const font = GameConfig.hud.fontFamily;
  const cardSize = 200;
  const cardGap = 20;

  const container = scene.add.container(0, 0);

  // Dark overlay
  const overlay = scene.add.rectangle(canvasW / 2, canvasH / 2, canvasW, canvasH, 0x0B0E2A, 0.85);
  overlay.setDepth(depth);
  container.add(overlay);

  // Title
  const title = scene.add.text(canvasW / 2, cy - 160, 'LEVEL UP!', {
    fontFamily: font,
    fontSize: '40px',
    color: '#00E5FF',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);
  title.setDepth(depth + 1);
  container.add(title);

  // Card positions
  const positions = calculateCardPositions(canvasW, cardSize, cardGap, choices.length);

  // Card containers for highlight management
  const cardContainers: Phaser.GameObjects.Container[] = [];
  const cardBorders: Phaser.GameObjects.Rectangle[] = [];
  let highlightedIndex = 0;

  // Highlight a specific card
  const highlightCard = (index: number): void => {
    for (let i = 0; i < cardBorders.length; i++) {
      if (i === index) {
        cardBorders[i].setStrokeStyle(4, 0x00E5FF, 1);
      } else {
        cardBorders[i].setStrokeStyle(2, 0x1E1E3F, 0.6);
      }
    }
    highlightedIndex = index;
  };

  for (let i = 0; i < choices.length; i++) {
    const cx = positions[i];
    const choice = choices[i];

    // Card container
    const card = scene.add.container(cx, cy);
    card.setDepth(depth + 1);

    // Card background (rounded rect via rectangle + corners — use rectangle for simplicity)
    const bg = scene.add.rectangle(0, 0, cardSize, cardSize, 0x1A1A3E, 0.95);
    bg.setStrokeStyle(2, 0x1E1E3F, 0.6);
    card.add(bg);
    cardBorders.push(bg);

    // Icon (drawn inside card, centered upper half)
    const gfx = scene.add.graphics();
    gfx.setPosition(0, -20);
    drawPowerUpIcon(gfx, choice.id);
    card.add(gfx);

    // Powerup name
    const nameText = scene.add.text(0, 40, choice.name, {
      fontFamily: font,
      fontSize: '13px',
      color: '#FFFFFF',
      align: 'center',
    });
    nameText.setOrigin(0.5);
    card.add(nameText);

    // Description (1-line, smaller)
    const descText = scene.add.text(0, 62, choice.description, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#AAAAAA',
      align: 'center',
      wordWrap: { width: cardSize - 20 },
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // Key hint
    const keyHint = scene.add.text(0, -cardSize / 2 + 12, `${i + 1}`, {
      fontFamily: font,
      fontSize: '11px',
      color: '#00E5FF',
    });
    keyHint.setOrigin(0.5, 0);
    card.add(keyHint);

    // Make card interactive for click/tap
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => highlightCard(i));
    bg.on('pointerdown', () => {
      scene.input.keyboard!.off('keydown', keyHandler);
      onSelect(choice.id);
    });

    cardContainers.push(card);
    container.add(card);
  }

  // Initial highlight
  highlightCard(0);

  // Keyboard listener: 1/2/3 for direct selection, arrows to move highlight
  const keyHandler = (event: KeyboardEvent) => {
    const keyNum = parseInt(event.key, 10);
    if (keyNum >= 1 && keyNum <= choices.length) {
      scene.input.keyboard!.off('keydown', keyHandler);
      onSelect(choices[keyNum - 1].id);
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      highlightCard(Math.min(highlightedIndex + 1, choices.length - 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      highlightCard(Math.max(highlightedIndex - 1, 0));
    } else if (event.key === 'Enter' || event.key === ' ') {
      scene.input.keyboard!.off('keydown', keyHandler);
      onSelect(choices[highlightedIndex].id);
    }
  };
  scene.input.keyboard!.on('keydown', keyHandler);

  container.setDepth(depth);

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
