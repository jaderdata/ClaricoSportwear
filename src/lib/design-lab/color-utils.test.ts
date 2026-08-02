import { describe, expect, it } from 'vitest';
import { contrastTextColor, deriveShirtTokens } from './color-utils';

describe('deriveShirtTokens', () => {
  it('keeps the base color and derives darker shadow / lighter highlight tones', () => {
    const tokens = deriveShirtTokens('#c8102e');
    expect(tokens.base).toBe('#c8102e');
    expect(tokens.shadow).toMatch(/^#[0-9a-f]{6}$/);
    expect(tokens.highlight).toMatch(/^#[0-9a-f]{6}$/);
    expect(tokens.midtone).toMatch(/^#[0-9a-f]{6}$/);
    expect(tokens.shadow).not.toBe(tokens.base);
    expect(tokens.highlight).not.toBe(tokens.base);
  });

  it('produces a near-black shadow for a near-black base without going negative', () => {
    const tokens = deriveShirtTokens('#0d0d0d');
    expect(tokens.shadow).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('contrastTextColor', () => {
  it('picks dark text for a light (white) base', () => {
    expect(contrastTextColor('#f5f5f0')).toBe('#0f172a');
  });

  it('picks white text for a dark (black) base', () => {
    expect(contrastTextColor('#0d0d0d')).toBe('#ffffff');
  });
});
