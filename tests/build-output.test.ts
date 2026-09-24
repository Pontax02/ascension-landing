// Comprueba el HTML generado en dist/: toda ruta local debe llevar el prefijo `base`
// y apuntar a un fichero que exista. Ejecutar tras `astro build` (npm run test:build).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

const DIST = join(import.meta.dirname, '..', 'dist');
const BASE = (config.base ?? '/').replace(/\/$/, '');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

function localRefs(html: string): string[] {
  const refs: string[] = [];
  for (const [, attr, value] of html.matchAll(/\b(href|src|srcset)="([^"]*)"/g)) {
    const candidates = attr === 'srcset' ? value.split(',').map((s) => s.trim().split(/\s+/)[0]) : [value];
    refs.push(...candidates.filter((v) => v.startsWith('/') && !v.startsWith('//')));
  }
  return refs;
}

function resolveInDist(ref: string): string | null {
  const path = decodeURIComponent(ref.split(/[?#]/)[0].slice(BASE.length));
  const candidates = [join(DIST, path), join(DIST, path, 'index.html'), join(DIST, `${path}.html`)];
  return candidates.find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
}

describe('build estático', () => {
  it('genera dist/index.html', () => {
    expect(existsSync(join(DIST, 'index.html'))).toBe(true);
  });

  it('la home muestra el nombre y el tagline', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect(html).toContain('Ascension');
    expect(html).toContain('Time to ascend');
  });

  it('la home incluye el logo como imagen con alt', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect(html).toMatch(/<img[^>]+alt="[^"]*Ascension[^"]*"/);
  });

  it('todas las rutas locales llevan el prefijo base', () => {
    const offenders = htmlFiles(DIST).flatMap((file) =>
      localRefs(readFileSync(file, 'utf8'))
        .filter((ref) => !(ref === BASE || ref.startsWith(`${BASE}/`)))
        .map((ref) => `${file}: ${ref}`),
    );
    expect(offenders).toEqual([]);
  });

  it('todas las rutas locales apuntan a ficheros existentes', () => {
    const files = htmlFiles(DIST);
    const refs = files.flatMap((file) => localRefs(readFileSync(file, 'utf8')));
    expect(refs.length).toBeGreaterThan(0);
    const broken = refs.filter((ref) => resolveInDist(ref) === null);
    expect(broken).toEqual([]);
  });
});
