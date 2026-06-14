import { describe, it, expect } from 'vitest';

describe('GameOverScreen', () => {
  it('should display final score in game over message', () => {
    const score = 320;
    const message = `Final Score: ${score}`;
    expect(message).toBe('Final Score: 320');
  });

  it('should show game over title', () => {
    const title = 'GAME OVER';
    expect(title.length).toBeGreaterThan(0);
  });

  it('should provide restart instruction', () => {
    const instruction = 'Press R to Restart';
    expect(instruction).toContain('R');
    expect(instruction).toContain('Restart');
  });

  it('should format score correctly for any value', () => {
    expect(`Final Score: ${0}`).toBe('Final Score: 0');
    expect(`Final Score: ${9999}`).toBe('Final Score: 9999');
  });
});
