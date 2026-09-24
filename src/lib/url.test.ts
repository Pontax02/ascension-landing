import { describe, expect, it } from 'vitest';
import { url } from './url';

describe('url() bajo subpath de GitHub Pages', () => {
  const base = '/ascension-landing';

  it('devuelve la raíz del sitio con barra final', () => {
    expect(url('/', base)).toBe('/ascension-landing/');
  });

  it('trata la cadena vacía como la raíz', () => {
    expect(url('', base)).toBe('/ascension-landing/');
  });

  it('prefija rutas absolutas', () => {
    expect(url('/privacy', base)).toBe('/ascension-landing/privacy');
  });

  it('prefija rutas sin barra inicial', () => {
    expect(url('en/privacy', base)).toBe('/ascension-landing/en/privacy');
  });

  it('no duplica barras si base termina en /', () => {
    expect(url('/privacy', '/ascension-landing/')).toBe('/ascension-landing/privacy');
  });

  it('conserva anclas y query strings', () => {
    expect(url('/#avatar', base)).toBe('/ascension-landing/#avatar');
    expect(url('/delete-account?lang=en', base)).toBe('/ascension-landing/delete-account?lang=en');
  });
});

describe('url() con dominio propio (base = /)', () => {
  it('devuelve la raíz', () => {
    expect(url('/', '/')).toBe('/');
  });

  it('no añade prefijo', () => {
    expect(url('/privacy', '/')).toBe('/privacy');
    expect(url('privacy', '/')).toBe('/privacy');
  });
});
