// Contraste WCAG 2.2 AA de los pares de color que usa la web, leídos de tokens.css.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');
const tokens = Object.fromEntries(
  [...css.matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(([, name, hex]) => [name, hex]),
);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
  const [hi, lo] = [luminance(tokens[fg]), luminance(tokens[bg])].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

describe('tokens de marca', () => {
  it.each([
    ['--color-bg', '#FFFFFF'],
    ['--color-text', '#1D1D1F'],
    ['--color-gold', '#C9A84C'],
    ['--color-success', '#4CAF50'],
  ])('%s es el color de marca %s', (name, hex) => {
    expect(tokens[name]?.toUpperCase()).toBe(hex);
  });
});

describe('contraste de texto (AA ≥ 4.5:1)', () => {
  it.each([
    ['--color-text', '--color-bg'],
    ['--color-text', '--color-surface'],
    ['--color-text-secondary', '--color-bg'],
    ['--color-text-secondary', '--color-surface'],
    ['--color-gold-text', '--color-bg'],
    ['--color-gold-text', '--color-surface'],
    ['--color-text', '--color-gold'],
    // Sección oscura (evolución del avatar)
    ['--color-text-on-dark', '--color-dark'],
    ['--color-text-secondary-on-dark', '--color-dark'],
    ['--color-gold', '--color-dark'],
  ])('%s sobre %s', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('contraste de elementos no textuales (≥ 3:1)', () => {
  it.each([
    ['--color-focus', '--color-bg'],
    ['--color-focus', '--color-surface'],
  ])('%s sobre %s', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('el dorado de marca no sirve para texto de cuerpo', () => {
  it('--color-gold sobre blanco queda por debajo de 4.5:1 (por eso existe --color-gold-text)', () => {
    expect(contrast('--color-gold', '--color-bg')).toBeLessThan(4.5);
  });
});
