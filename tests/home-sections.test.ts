// Secciones de la home (paso 3) sobre el HTML generado en dist/.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';

const html = readFileSync(join(import.meta.dirname, '..', 'dist', 'index.html'), 'utf8');
const doc = parse(html);
const main = doc.querySelector('main')!;
const section = (id: string) => doc.querySelector(`section#${id}`);
const text = (el: ReturnType<typeof section>) => el?.textContent.replace(/\s+/g, ' ').trim() ?? '';

describe('hero', () => {
  it('existe y contiene el único h1, con el tagline marcado en inglés', () => {
    const hero = section('hero');
    expect(hero).not.toBeNull();
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(hero!.querySelector('h1')).not.toBeNull();
    expect(h1s[0].querySelector('[lang="en"]')?.textContent).toContain('Time to ascend');
  });

  it('explica la app en una frase', () => {
    expect(text(section('hero'))).toMatch(/hábitos/i);
  });

  it('muestra un mockup de móvil con imagen', () => {
    expect(section('hero')!.querySelector('.phone img')).not.toBeNull();
  });
});

describe('badge de Google Play (app aún no publicada)', () => {
  const badges = () => main.querySelectorAll('.play-badge');

  it('aparece en el hero y en el CTA final', () => {
    expect(section('hero')!.querySelector('.play-badge')).not.toBeNull();
    expect(section('cta')!.querySelector('.play-badge')).not.toBeNull();
  });

  it('usa la imagen oficial con alt descriptivo', () => {
    for (const b of badges()) expect(b.querySelector('img')?.getAttribute('alt')).toMatch(/Google Play/);
  });

  it('dice "Próximamente" y no enlaza a ninguna parte', () => {
    for (const b of badges()) {
      expect(b.textContent).toMatch(/Próximamente/);
      expect(b.tagName).not.toBe('A');
      expect(b.closest('a')).toBeNull();
      expect(b.querySelector('a')).toBeNull();
    }
    expect(html).not.toMatch(/play\.google\.com\/store/);
  });
});

describe('pilares', () => {
  it('son tres, con icono, título y descripción', () => {
    const items = section('pilares')!.querySelectorAll('li');
    expect(items).toHaveLength(3);
    for (const li of items) {
      expect(li.querySelector('svg')).not.toBeNull();
      expect(li.querySelector('h3')?.textContent.trim()).toBeTruthy();
      expect(li.querySelector('p')?.textContent.trim()).toBeTruthy();
    }
  });

  it('cubren árbol de hábitos, progresión y amigos', () => {
    const titles = section('pilares')!.querySelectorAll('h3').map((h) => h.textContent);
    expect(titles.join(' | ')).toMatch(/árbol.*\|.*(progresión|nivel).*\|.*amigos/is);
  });
});

describe('evolución del avatar', () => {
  const stages = () => section('evolucion')!.querySelectorAll('ol > li');

  it('muestra las cinco etapas en orden', () => {
    expect(stages().map((li) => li.querySelector('h3')?.textContent.trim())).toEqual([
      'Novato',
      'Aprendiz',
      'Guerrero',
      'Semidiós',
      'Ascensión',
    ]);
  });

  it('indica el nivel real en que se alcanza cada etapa', () => {
    expect(stages().map((li) => li.querySelector('.level')?.textContent.replace(/\s+/g, ' ').trim())).toEqual([
      'Nivel 1',
      'Nivel 6',
      'Nivel 11',
      'Nivel 21',
      'Nivel 36+',
    ]);
  });

  it('cada etapa tiene imagen con alt', () => {
    for (const li of stages()) expect(li.querySelector('img')?.getAttribute('alt')).toMatch(/\w/);
  });

  it('la fila con scroll horizontal es accesible por teclado', () => {
    const scroller = section('evolucion')!.querySelector('ol')!;
    expect(scroller.getAttribute('tabindex')).toBe('0');
    expect(scroller.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('capturas', () => {
  it('muestra entre 3 y 5 capturas en mockups de móvil', () => {
    const shots = section('capturas')!.querySelectorAll('.phone img');
    expect(shots.length).toBeGreaterThanOrEqual(3);
    expect(shots.length).toBeLessThanOrEqual(5);
  });
});

describe('CTA final', () => {
  it('repite el tagline', () => {
    expect(text(section('cta'))).toContain('Time to ascend');
  });
});

describe('imágenes', () => {
  const imgs = () => main.querySelectorAll('img');

  it('todas tienen atributo alt', () => {
    for (const img of imgs()) expect(img.hasAttribute('alt')).toBe(true);
  });

  it('solo las del hero cargan de inmediato; el resto es lazy', () => {
    const hero = section('hero')!;
    const outside = imgs().filter((img) => !hero.querySelectorAll('img').includes(img));
    expect(outside.length).toBeGreaterThan(0);
    for (const img of outside) expect(img.getAttribute('loading')).toBe('lazy');
  });
});

describe('restricciones de copy', () => {
  const copy = text(main);

  it('dice "Gratis para empezar" y nunca "100% gratis"', () => {
    expect(copy).toContain('Gratis para empezar');
    expect(copy).not.toMatch(/100\s*%\s*gratis/i);
  });

  it('no promete un nivel máximo que la app no tiene', () => {
    expect(copy).not.toMatch(/nivel(es)?\s+(hasta\s+(el\s+)?)?100\b/i);
  });

  it('no menciona el dragón (no existe en la app)', () => {
    expect(copy).not.toMatch(/drag[oó]n/i);
  });
});
