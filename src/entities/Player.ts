import { GameConfig } from '../config';

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  alive: boolean;
  color: string;
}

export function createPlayer(): PlayerState {
  return {
    x: GameConfig.player.x,
    y: GameConfig.player.y,
    width: GameConfig.player.width,
    height: GameConfig.player.height,
    dx: 0,
    dy: 0,
    alive: true,
    color: GameConfig.player.color,
  };
}
