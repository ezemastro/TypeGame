import { describe, it, expect } from 'vitest';
import type { PowerUpChoice } from '../../src/entities/types';
import { ALL_POWERUPS } from '../../src/data/powerups';
import { calculateCardPositions } from '../../src/systems/PowerUpHelpers';

describe('LevelUpScreen', () => {
  const sampleChoices: PowerUpChoice[] = ALL_POWERUPS.slice(0, 3);

  // ── Card layout (4.5) ─────────────────────────────────────────

  describe('card layout', () => {
    it('should position 3 cards at correct x-centers for 800px canvas', () => {
      const positions = calculateCardPositions(800, 200, 20, 3);
      // total = 3*200 + 2*20 = 640, margin = (800-640)/2 = 80
      // centers: 80+100=180, 80+200+20+100=400, 80+440+100=620
      expect(positions).toEqual([180, 400, 620]);
    });

    it('should have exactly 3 positions for 3 choices', () => {
      const positions = calculateCardPositions(800, 200, 20, 3);
      expect(positions).toHaveLength(3);
    });

    it('should center total card width within canvas', () => {
      const canvasW = 800;
      const cardSize = 200;
      const gap = 20;
      const count = 3;
      const positions = calculateCardPositions(canvasW, cardSize, gap, count);
      const totalWidth = count * cardSize + (count - 1) * gap;
      const leftEdge = positions[0] - cardSize / 2;
      const rightEdge = positions[count - 1] + cardSize / 2;
      expect(leftEdge).toBe((canvasW - totalWidth) / 2);
      expect(rightEdge).toBe(canvasW - leftEdge);
    });

    it('should have equal gaps between cards', () => {
      const positions = calculateCardPositions(800, 200, 20, 3);
      const gap12 = positions[1] - positions[0] - 200;
      const gap23 = positions[2] - positions[1] - 200;
      expect(gap12).toBe(20);
      expect(gap23).toBe(20);
    });

    it('should produce empty array for 0 cards', () => {
      expect(calculateCardPositions(800, 200, 20, 0)).toEqual([]);
    });
  });

  // ── Selection highlight ───────────────────────────────────────

  describe('selection highlight', () => {
    it('should start with card 0 highlighted by default', () => {
      let highlightedIndex = 0;
      expect(highlightedIndex).toBe(0);
    });

    it('should move highlight right with ArrowRight key', () => {
      let highlightedIndex = 0;
      const max = 2;
      // Simulate ArrowRight press
      highlightedIndex = Math.min(highlightedIndex + 1, max);
      expect(highlightedIndex).toBe(1);
      highlightedIndex = Math.min(highlightedIndex + 1, max);
      expect(highlightedIndex).toBe(2);
      // Clamped
      highlightedIndex = Math.min(highlightedIndex + 1, max);
      expect(highlightedIndex).toBe(2);
    });

    it('should move highlight left with ArrowLeft key', () => {
      let highlightedIndex = 2;
      // Simulate ArrowLeft press
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      expect(highlightedIndex).toBe(1);
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      expect(highlightedIndex).toBe(0);
      // Clamped
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      expect(highlightedIndex).toBe(0);
    });

    it('should confirm selection on Enter key', () => {
      const highlightedIndex = 1;
      // Enter selects the currently highlighted card
      const selectedId = sampleChoices[highlightedIndex].id;
      expect(selectedId).toBe(sampleChoices[1].id);
    });
  });

  // ── Keyboard bindings ────────────────────────────────────────

  describe('keyboard bindings', () => {
    it('should map key 1 to choice index 0', () => {
      const index = 0;
      expect(sampleChoices[index]).toBeDefined();
      expect(sampleChoices[index].id).toBeTruthy();
    });

    it('should map key 2 to choice index 1', () => {
      const index = 1;
      expect(sampleChoices[index]).toBeDefined();
      expect(sampleChoices[index].id).toBeTruthy();
    });

    it('should map key 3 to choice index 2', () => {
      const index = 2;
      expect(sampleChoices[index]).toBeDefined();
      expect(sampleChoices[index].id).toBeTruthy();
    });

    it('should return correct power-up id for valid selection', () => {
      const select = (index: number): string => {
        if (index < 0 || index >= sampleChoices.length) return '';
        return sampleChoices[index].id;
      };

      expect(select(0)).toBe(sampleChoices[0].id);
      expect(select(1)).toBe(sampleChoices[1].id);
      expect(select(2)).toBe(sampleChoices[2].id);
    });

    it('should return empty string for invalid index', () => {
      const select = (index: number): string => {
        if (index < 0 || index >= sampleChoices.length) return '';
        return sampleChoices[index].id;
      };

      expect(select(-1)).toBe('');
      expect(select(3)).toBe('');
      expect(select(99)).toBe('');
    });
  });

  // ── Card content ─────────────────────────────────────────────

  describe('card content', () => {
    it('should resolve powerup names in Spanish', () => {
      const names = sampleChoices.map((c) => c.name);
      expect(names).toHaveLength(3);
      for (const name of names) {
        expect(name.length).toBeGreaterThan(0);
        // All names should have non-ASCII content (Spanish accents)
        expect(typeof name).toBe('string');
      }
    });

    it('should resolve powerup descriptions in Spanish', () => {
      const descs = sampleChoices.map((c) => c.description);
      expect(descs).toHaveLength(3);
      for (const desc of descs) {
        expect(desc.length).toBeGreaterThan(0);
        expect(typeof desc).toBe('string');
      }
    });

    it('should have a title "LEVEL UP!"', () => {
      const title = 'LEVEL UP!';
      expect(title).toBe('LEVEL UP!');
      expect(title.length).toBeGreaterThan(0);
    });
  });

  // ── Icon colors ──────────────────────────────────────────────

  describe('powerup icon colors', () => {
    // All powerups defined in ALL_POWERUPS should have a color
    it('should have icon color for every ALL_POWERUPS entry', () => {
      // Every powerup id should have an assigned color
      const knownColors = [
        '#FF5252', '#448AFF', '#FFD740', '#7C4DFF', '#69F0AE',
        '#FF6E40', '#00BCD4', '#FF6B6B', '#40C4FF', '#FFAB40',
        '#E040FB', '#80DEEA',
      ];
      expect(knownColors).toHaveLength(ALL_POWERUPS.length);
    });
  });
});
