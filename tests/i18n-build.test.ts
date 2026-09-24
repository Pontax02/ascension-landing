// Selector de idioma y hreflang sobre el HTML generado en dist/.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

const DIST = join(import.meta.dirname, '..', 'dist');
const BASE = (config.base ?? '/').replace(/\/$/, '');
const ORIGIN = String(config.site).replace(/\/$/, '');
const load = (file: string) => {
  const path = join(DIST, file);
  return parse(existsSync(path) ? readFileSync(path, 'utf8') : '<html></html>');
};

const PAGES = [
  { lang: 'es', file: 'index.html', self: `${BASE}/`, other: { lang: 'en', href: `${BASE}/en/` } },
  { lang: 'en', file: join('en', 'index.html'), self: `${BASE}/en/`, other: { lang: 'es', href: `${BASE}/` } },
] as const;

describe('rutas por idioma', () => {
  it('genera la home en español en / y en inglés en /en/', () => {
    expect(existsSync(join(DIST, 'index.html'))).toBe(true);
    expect(existsSync(join(DIST, 'en', 'index.html'))).toBe(true);
  });

  it('no genera /es/ (el español es el idioma por defecto, sin prefijo)', () => {
    expect(existsSync(join(DIST, 'es', 'index.html'))).toBe(false);
  });
});

describe.each(PAGES)('selector de idioma en $file', (page) => {
  const doc = load(page.file);
  const switchers = () => doc.querySelectorAll('nav.lang-switch');

  it('aparece en el header y en el footer', () => {
    expect(doc.querySelector('header nav.lang-switch')).not.toBeNull();
    expect(doc.querySelector('footer nav.lang-switch')).not.toBeNull();
  });

  it('funciona sin JavaScript: enlaza a la misma página en el otro idioma', () => {
    expect(switchers().length).toBeGreaterThan(0);
    for (const nav of switchers()) {
      const link = nav.querySelector(`a[hreflang="${page.other.lang}"]`);
      expect(link?.getAttribute('href')).toBe(page.other.href);
      expect(link?.getAttribute('lang')).toBe(page.other.lang);
    }
    expect(doc.querySelectorAll('script')).toHaveLength(0);
  });

  it('marca el idioma actual con aria-current y tiene nombre accesible', () => {
    expect(switchers().length).toBeGreaterThan(0);
    for (const nav of switchers()) {
      expect(nav.getAttribute('aria-label')).toBeTruthy();
      const current = nav.querySelector('[aria-current="page"]');
      expect(current?.getAttribute('lang')).toBe(page.lang);
    }
  });
});

describe.each(PAGES)('hreflang en $file', (page) => {
  const doc = load(page.file);
  const alternates = () =>
    Object.fromEntries(
      doc.querySelectorAll('link[rel="alternate"][hreflang]').map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]),
    );

  it('declara es, en y x-default con URLs absolutas', () => {
    expect(alternates()).toEqual({
      es: `${ORIGIN}${BASE}/`,
      en: `${ORIGIN}${BASE}/en/`,
      'x-default': `${ORIGIN}${BASE}/`,
    });
  });

  it('declara su URL canónica', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${ORIGIN}${page.self}`);
  });
});
