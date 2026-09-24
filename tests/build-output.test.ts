// Comprueba el HTML generado en dist/: toda ruta local debe llevar el prefijo `base`
// y apuntar a un fichero que exista. Ejecutar tras `astro build` (npm run test:build).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

const DIST = join(import.meta.dirname, '..', 'dist');
const BASE = (config.base ?? '/').replace(/\/$/, '');

function filesWithExt(dir: string, exts: string[]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return filesWithExt(full, exts);
    return exts.some((ext) => name.endsWith(ext)) ? [full] : [];
  });
}

const htmlFiles = (dir: string) => filesWithExt(dir, ['.html']);
const outputFiles = () => filesWithExt(DIST, ['.html', '.css']);

// Rutas locales en atributos href/src/srcset y en url(...) de CSS (inline o en fichero).
function localRefs(content: string): string[] {
  const refs: string[] = [];
  for (const [, attr, value] of content.matchAll(/\b(href|src|srcset)="([^"]*)"/g)) {
    const candidates = attr === 'srcset' ? value.split(',').map((s) => s.trim().split(/\s+/)[0]) : [value];
    refs.push(...candidates);
  }
  for (const [, value] of content.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(value);
  return refs.filter((v) => v.startsWith('/') && !v.startsWith('//'));
}

const home = () => readFileSync(join(DIST, 'index.html'), 'utf8');

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
    expect(home()).toContain('Ascension');
    expect(home()).toContain('Time to ascend');
  });

  it('la home incluye el logo como imagen con alt', () => {
    expect(home()).toMatch(/<img[^>]+alt="[^"]*Ascension[^"]*"/);
  });

  it('todas las rutas locales llevan el prefijo base', () => {
    const offenders = outputFiles().flatMap((file) =>
      localRefs(readFileSync(file, 'utf8'))
        .filter((ref) => !(ref === BASE || ref.startsWith(`${BASE}/`)))
        .map((ref) => `${file}: ${ref}`),
    );
    expect(offenders).toEqual([]);
  });

  it('todas las rutas locales apuntan a ficheros existentes', () => {
    const refs = outputFiles().flatMap((file) => localRefs(readFileSync(file, 'utf8')));
    expect(refs.length).toBeGreaterThan(0);
    const broken = refs.filter((ref) => resolveInDist(ref) === null);
    expect(broken).toEqual([]);
  });
});

describe('layout base', () => {
  it('declara el idioma español', () => {
    expect(home()).toMatch(/<html[^>]+lang="es"/);
  });

  it('tiene un enlace para saltar al contenido que apunta a <main id="main">', () => {
    expect(home()).toMatch(/<a[^>]+href="#main"/);
    expect(home()).toMatch(/<main[^>]+id="main"/);
  });

  it('el header enlaza a la home respetando base', () => {
    const header = home().match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
    expect(header).toMatch(new RegExp(`<a[^>]+href="${BASE}/"`));
  });

  it('el footer tiene el email de contacto y el copyright', () => {
    const footer = home().match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footer).toContain('href="mailto:ascensionapp.es@gmail.com"');
    expect(footer).toMatch(/©\s*\d{4}\s*Ascension Project/);
  });
});

describe('tipografías autoalojadas', () => {
  it('no carga nada de Google Fonts', () => {
    const all = outputFiles().map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(all).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  it('declara Sora e Inter con @font-face servidas desde el propio sitio', () => {
    const all = outputFiles().map((f) => readFileSync(f, 'utf8')).join('\n');
    for (const family of ['Sora', 'Inter']) {
      expect(all).toMatch(new RegExp(`@font-face\\s*\\{[^}]*font-family:\\s*["']?${family}`));
    }
    expect(all).toMatch(new RegExp(`url\\(["']?${BASE}/[^)]+\\.woff2`));
  });

  it('precarga al menos una fuente woff2', () => {
    expect(home()).toMatch(/<link[^>]+rel="preload"[^>]+as="font"/);
  });

  // Regresión medida en el paso 6: Sora 600 sin precargar producía CLS 0.07 en el hero.
  it('precarga todas las fuentes que declara (evita saltos de layout)', () => {
    const declared = new Set([...home().matchAll(/url\("?([^")]+\.woff2)"?\)/g)].map((m) => m[1]));
    const preloaded = new Set([...home().matchAll(/rel="preload" href="([^"]+\.woff2)"/g)].map((m) => m[1]));
    expect(declared.size).toBeGreaterThan(0);
    expect(preloaded).toEqual(declared);
  });

  // Regresión medida en el paso 6: dos hojas CSS externas bloqueaban el primer render ~600 ms en 4G.
  it('no carga hojas de estilo externas (el CSS va incrustado)', () => {
    expect(home()).not.toMatch(/<link[^>]+rel="stylesheet"/);
  });
});
