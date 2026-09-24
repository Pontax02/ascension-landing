import { describe, expect, it } from 'vitest';
import { AVATAR_STAGES } from './avatar-stages';

describe('etapas del avatar', () => {
  it('son cinco, en orden de evolución', () => {
    expect(AVATAR_STAGES.map((s) => s.id)).toEqual(['novato', 'aprendiz', 'guerrero', 'semidios', 'ascension']);
  });

  it('usan los umbrales de nivel reales de la app (avatar_nivel.dart)', () => {
    expect(AVATAR_STAGES.map((s) => s.minLevel)).toEqual([1, 6, 11, 21, 36]);
  });

  it('cada etapa tiene su imagen', () => {
    for (const stage of AVATAR_STAGES) expect(stage.image).toBeTruthy();
  });

  it('no inventa un nivel máximo', () => {
    expect(AVATAR_STAGES.every((s) => !('maxLevel' in s))).toBe(true);
  });
});
