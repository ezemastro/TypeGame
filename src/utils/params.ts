import { GameConfig } from '../config';

/**
 * Type-safe accessor for GameConfig properties.
 * Returns the value at the given dot-separated path, or undefined if invalid.
 *
 * @example
 * const speed = getParam<number>('player.speed');
 */
export function getParam<T = unknown>(path: string): T | undefined {
  const keys = path.split('.');
  let current: unknown = GameConfig;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

/**
 * Validates that a config path exists and returns the value.
 * Throws an error if the path is invalid.
 */
export function requireParam<T = unknown>(path: string): T {
  const value = getParam<T>(path);
  if (value === undefined) {
    throw new Error(`Missing required config parameter: ${path}`);
  }
  return value;
}
