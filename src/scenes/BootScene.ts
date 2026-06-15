import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load all SVG game assets as images
    this.load.image('robot', 'assets/robot.svg');
    this.load.image('enemy-robot', 'assets/enemy-robot.svg');
    this.load.image('enemy-bug', 'assets/enemy-bug.svg');
    this.load.image('tile-floor', 'assets/tile-floor.svg');
    this.load.image('gear', 'assets/gear.svg');
    this.load.image('weapon-base', 'assets/weapon-base.svg');
    this.load.image('bullet', 'assets/bullet.svg');
    this.load.image('tree', 'assets/tree.svg');
    this.load.image('cloud', 'assets/cloud.svg');
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
