import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GameConfig } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: GameConfig.canvas.width,
  height: GameConfig.canvas.height,
  backgroundColor: GameConfig.canvas.backgroundColor,
  parent: 'game-container',
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
