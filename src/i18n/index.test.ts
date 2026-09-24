import { describe, expect, it } from 'vitest';
import { en } from './en';
import { es } from './es';
import { DEFAULT_LOCALE, LOCALES, localePath, switchLocalePath, useTranslations } from './index';

const BASE = '/ascension-landing';

describe('diccionarios', () => {
  it('en.ts tiene exactamente las mismas claves que es.ts', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('ningún texto está vacío', () => {
    for (const dict of [es, en]) {
      for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('');
    }
  });
});

describe('useTranslations', () => {
  it('devuelve el texto del idioma pedido', () => {
    expect(useTranslations('es')('play.freeToStart')).toBe('Gratis para empezar');
    expect(useTranslations('en')('play.freeToStart')).toBe('Free to start');
  });

  it('cae al idioma por defecto si el locale no existe', () => {
    expect(useTranslations('fr')('play.freeToStart')).toBe('Gratis para empezar');
    expect(useTranslations(undefined)('play.freeToStart')).toBe('Gratis para empezar');
  });
});

describe('locales', () => {
  it('español por defecto, e inglés', () => {
    expect(DEFAULT_LOCALE).toBe('es');
    expect(LOCALES).toEqual(['es', 'en']);
  });
});

describe('localePath', () => {
  it('el idioma por defecto no lleva prefijo', () => {
    expect(localePath('es', '/', BASE)).toBe('/ascension-landing/');
    expect(localePath('es', '/privacy', BASE)).toBe('/ascension-landing/privacy/');
  });

  it('inglés lleva /en', () => {
    expect(localePath('en', '/', BASE)).toBe('/ascension-landing/en/');
    expect(localePath('en', '/privacy', BASE)).toBe('/ascension-landing/en/privacy/');
  });

  it('funciona sin base (dominio propio)', () => {
    expect(localePath('en', '/', '/')).toBe('/en/');
    expect(localePath('es', '/', '/')).toBe('/');
  });
});

describe('localePath: barra final', () => {
  // GitHub Pages sirve cada página como <ruta>/index.html y redirige <ruta> → <ruta>/ con un 301.
  it('las páginas terminan en / para evitar la redirección', () => {
    expect(localePath('es', 'delete-account', BASE)).toBe('/ascension-landing/delete-account/');
    expect(localePath('es', '/privacy/', BASE)).toBe('/ascension-landing/privacy/');
  });

  it('no añade barra a anclas, query strings ni ficheros', () => {
    expect(localePath('es', '/#evolucion', BASE)).toBe('/ascension-landing/#evolucion');
    expect(localePath('en', '/privacy?x=1', BASE)).toBe('/ascension-landing/en/privacy?x=1');
    expect(localePath('es', '/sitemap-index.xml', BASE)).toBe('/ascension-landing/sitemap-index.xml');
  });
});

describe('switchLocalePath', () => {
  it('de español a inglés', () => {
    expect(switchLocalePath('/ascension-landing/', 'en', BASE)).toBe('/ascension-landing/en/');
    expect(switchLocalePath('/ascension-landing/privacy/', 'en', BASE)).toBe('/ascension-landing/en/privacy/');
  });

  it('de inglés a español', () => {
    expect(switchLocalePath('/ascension-landing/en/', 'es', BASE)).toBe('/ascension-landing/');
    expect(switchLocalePath('/ascension-landing/en', 'es', BASE)).toBe('/ascension-landing/');
    expect(switchLocalePath('/ascension-landing/en/privacy/', 'es', BASE)).toBe('/ascension-landing/privacy/');
  });

  it('al mismo idioma devuelve la misma página', () => {
    expect(switchLocalePath('/ascension-landing/en/privacy', 'en', BASE)).toBe('/ascension-landing/en/privacy/');
  });

  it('no confunde rutas que empiezan por "en" (p. ej. /enlaces)', () => {
    expect(switchLocalePath('/ascension-landing/enlaces', 'en', BASE)).toBe('/ascension-landing/en/enlaces/');
  });

  it('funciona sin base', () => {
    expect(switchLocalePath('/en/privacy', 'es', '/')).toBe('/privacy/');
    expect(switchLocalePath('/', 'en', '/')).toBe('/en/');
  });
});
