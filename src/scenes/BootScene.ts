import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load all SVG game assets as images
    this.load.image('player-ship', 'assets/player-ship.svg');
    this.load.image('enemy-fighter', 'assets/enemy-fighter.svg');
    this.load.image('enemy-scout', 'assets/enemy-scout.svg');
    this.load.image('starfield', 'assets/starfield.svg');
    this.load.image('star', 'assets/star.svg');
    this.load.image('weapon-base', 'assets/weapon-base.svg');
    this.load.image('laser', 'assets/laser.svg');
    this.load.image('planet', 'assets/planet.svg');
    this.load.image('meteorite', 'assets/meteorite.svg');
    this.load.image('asteroid', 'assets/asteroid.svg');
    this.load.image('nebula', 'assets/nebula.svg');
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
