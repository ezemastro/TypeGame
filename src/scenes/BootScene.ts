import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load all SVG game assets as images
    this.load.image('player-ship', 'assets/player-ship.svg');

    this.load.image('ship-ricochet', 'assets/ship-ricochet.svg');
    this.load.image('ship-explosive', 'assets/ship-explosive.svg');
    this.load.image('ship-dual', 'assets/ship-dual.svg');
    this.load.image('ship-cooling', 'assets/ship-cooling.svg');
    this.load.image('ship-sight', 'assets/ship-sight.svg');
    this.load.image('enemy-fighter', 'assets/enemy-fighter.svg');
    this.load.image('enemy-scout', 'assets/enemy-scout.svg');
    this.load.image('enemy-comet', 'assets/enemy-comet.svg');
    this.load.image('enemy-asteroid', 'assets/enemy-asteroid.svg');
    this.load.image('starfield', 'assets/starfield.svg');
    this.load.image('star', 'assets/star.svg');
    this.load.image('laser', 'assets/laser.svg');
    this.load.image('planet', 'assets/planet.svg');
    this.load.image('planet-ice', 'assets/planet-ice.svg');
    this.load.image('planet-gas', 'assets/planet-gas.svg');
    this.load.image('planet-rocky', 'assets/planet-rocky.svg');
    this.load.image('planet-ocean', 'assets/planet-ocean.svg');
    this.load.image('planet-desert', 'assets/planet-desert.svg');
    this.load.image('meteorite', 'assets/meteorite.svg');
    this.load.image('asteroid', 'assets/asteroid.svg');
    this.load.image('nebula', 'assets/nebula.svg');
    this.load.image('comet', 'assets/comet.svg');
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
