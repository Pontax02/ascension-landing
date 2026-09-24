// Secciones de la home en cada idioma, sobre el HTML generado en dist/.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';

const DIST = join(import.meta.dirname, '..', 'dist');

const LOCALES = [
  {
    lang: 'es',
    file: 'index.html',
    heroKeyword: /hábitos/i,
    pillars: /árbol.*\|.*(progresión|nivel).*\|.*amigos/is,
    stages: ['Novato', 'Aprendiz', 'Guerrero', 'Semidiós', 'Ascensión'],
    levels: ['Nivel 1', 'Nivel 6', 'Nivel 11', 'Nivel 21', 'Nivel 36+'],
    comingSoon: 'Próximamente en Google Play',
    freeToStart: 'Gratis para empezar',
    facts: ['Sin anuncios', 'Sin suscripciones', 'En español e inglés'],
    forbidden: [/100\s*%\s*gratis/i, /nivel(es)?\s+(hasta\s+(el\s+)?)?100\b/i, /drag[oó]n/i],
  },
  {
    lang: 'en',
    file: join('en', 'index.html'),
    heroKeyword: /habits/i,
    pillars: /habit tree.*\|.*(progression|level).*\|.*friends/is,
    stages: ['Novice', 'Apprentice', 'Warrior', 'Demigod', 'Ascended'],
    levels: ['Level 1', 'Level 6', 'Level 11', 'Level 21', 'Level 36+'],
    comingSoon: 'Coming soon to Google Play',
    freeToStart: 'Free to start',
    facts: ['No ads', 'No subscriptions', 'In English and Spanish'],
    forbidden: [/100\s*%\s*free/i, /levels?\s+(up\s+to\s+)?100\b/i, /dragon/i],
  },
] as const;

describe.each(LOCALES)('home ($lang)', (locale) => {
  const path = join(DIST, locale.file);
  const html = existsSync(path) ? readFileSync(path, 'utf8') : '<html><main></main></html>';

  it(`se genera ${locale.file}`, () => {
    expect(existsSync(path)).toBe(true);
  });
  const doc = parse(html);
  const main = doc.querySelector('main')!;
  const section = (id: string) => doc.querySelector(`section#${id}`);
  const text = (el: ReturnType<typeof section>) => el?.textContent.replace(/\s+/g, ' ').trim() ?? '';

  it(`declara lang="${locale.lang}"`, () => {
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe(locale.lang);
  });

  describe('hero', () => {
    it('contiene el único h1, con el tagline marcado en inglés', () => {
      const h1s = doc.querySelectorAll('h1');
      expect(h1s).toHaveLength(1);
      expect(section('hero')!.querySelector('h1')).not.toBeNull();
      expect(h1s[0].querySelector('[lang="en"]')?.textContent).toContain('Time to ascend');
    });

    it('explica la app en una frase', () => {
      expect(text(section('hero'))).toMatch(locale.heroKeyword);
    });

    it('muestra un mockup de móvil con imagen', () => {
      expect(section('hero')!.querySelector('.phone img')).not.toBeNull();
    });

    it('enumera hechos concretos del producto', () => {
      const facts = section('hero')!.querySelectorAll('.hero__facts li').map((li) => text(li));
      expect(facts).toEqual([...locale.facts]);
    });

    it('los adornos flotantes del mockup no los lee un lector de pantalla', () => {
      const chips = section('hero')!.querySelectorAll('.float-chip');
      expect(chips.length).toBeGreaterThanOrEqual(2);
      for (const c of chips) expect(c.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('ritmo editorial', () => {
    it.each(['pilares', 'evolucion', 'capturas'])('la sección %s lleva etiqueta superior', (id) => {
      expect(text(section(id)!.querySelector('.section-eyebrow'))).toBeTruthy();
    });

    it('la evolución del avatar es la sección oscura', () => {
      expect(section('evolucion')!.classList.contains('section--dark')).toBe(true);
    });

    it('los pilares no son una fila de tres tarjetas iguales: uno es el destacado', () => {
      expect(section('pilares')!.querySelectorAll('li.pillar--feature')).toHaveLength(1);
    });

    it('cada pilar muestra una muestra visual de la app, oculta a lectores de pantalla', () => {
      for (const li of section('pilares')!.querySelectorAll('li.pillar')) {
        expect(li.querySelector('.pillar__visual[aria-hidden="true"]')).not.toBeNull();
      }
    });
  });

  describe('Google Play mientras la app no está publicada', () => {
    const badges = () => main.querySelectorAll('.play-badge');

    it('aparece en el hero y en el CTA final', () => {
      expect(section('hero')!.querySelector('.play-badge')).not.toBeNull();
      expect(section('cta')!.querySelector('.play-badge')).not.toBeNull();
    });

    it(`dice "${locale.comingSoon}" y no enlaza a ninguna parte`, () => {
      for (const b of badges()) {
        expect(b.textContent.replace(/\s+/g, ' ').trim()).toContain(locale.comingSoon);
        expect(b.tagName).not.toBe('A');
        expect(b.closest('a')).toBeNull();
        expect(b.querySelector('a')).toBeNull();
      }
      expect(html).not.toMatch(/play\.google\.com\/store/);
    });

    it('no usa el badge oficial ("Disponible en"/"Get it on") mientras no esté disponible', () => {
      expect(html).not.toMatch(/google-play-(es|en)/);
    });
  });

  describe('pilares', () => {
    it('son tres, con icono, título y descripción', () => {
      const items = section('pilares')!.querySelectorAll('li.pillar');
      expect(items).toHaveLength(3);
      for (const li of items) {
        expect(li.querySelector('svg')).not.toBeNull();
        expect(li.querySelector('h3')?.textContent.trim()).toBeTruthy();
        expect(li.querySelector('p')?.textContent.trim()).toBeTruthy();
      }
    });

    it('cubren árbol de hábitos, progresión y amigos', () => {
      const titles = section('pilares')!.querySelectorAll('h3').map((h) => h.textContent);
      expect(titles.join(' | ')).toMatch(locale.pillars);
    });
  });

  describe('evolución del avatar', () => {
    const stages = () => section('evolucion')!.querySelectorAll('ol > li');

    it('muestra las cinco etapas en orden', () => {
      expect(stages().map((li) => li.querySelector('h3')?.textContent.trim())).toEqual([...locale.stages]);
    });

    it('indica el nivel real en que se alcanza cada etapa', () => {
      expect(stages().map((li) => li.querySelector('.level')?.textContent.replace(/\s+/g, ' ').trim())).toEqual([
        ...locale.levels,
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
      const heroImgs = section('hero')!.querySelectorAll('img');
      const outside = imgs().filter((img) => !heroImgs.includes(img));
      expect(outside.length).toBeGreaterThan(0);
      for (const img of outside) expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('restricciones de copy', () => {
    const copy = () => text(main);

    it(`dice "${locale.freeToStart}"`, () => {
      expect(copy()).toContain(locale.freeToStart);
    });

    it.each(locale.forbidden.map((re) => [re]))('no contiene %s', (re) => {
      expect(copy()).not.toMatch(re);
    });
  });
});
