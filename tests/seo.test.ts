// SEO y metadatos (paso 6) sobre el build en dist/.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

const DIST = join(import.meta.dirname, '..', 'dist');
const BASE = (config.base ?? '/').replace(/\/$/, '');
const ORIGIN = String(config.site).replace(/\/$/, '');
const SITE = `${ORIGIN}${BASE}`;

function htmlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const read = (file: string) => (existsSync(join(DIST, file)) ? readFileSync(join(DIST, file), 'utf8') : '');
const pages = htmlFiles(DIST).filter((f) => !f.endsWith('404.html'));
const pageUrl = (file: string) => `${SITE}/${relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '')}`;
/** Fichero de dist/ que sirve una URL absoluta del sitio. */
const distPath = (absUrl: string) => join(DIST, decodeURIComponent(new URL(absUrl).pathname.slice(BASE.length)));

const EXPECTED_PAGES = ['', 'en/', 'privacy/', 'en/privacy/', 'delete-account/', 'en/delete-account/'].map(
  (p) => `${SITE}/${p}`,
);

describe('páginas indexables', () => {
  it('son las 6 esperadas', () => {
    expect(pages.map(pageUrl).sort()).toEqual([...EXPECTED_PAGES].sort());
  });

  it('cada una tiene un <title> distinto', () => {
    const titles = pages.map((f) => parse(readFileSync(f, 'utf8')).querySelector('title')?.textContent);
    expect(new Set(titles).size).toBe(pages.length);
  });
});

describe.each(pages.map((f) => [relative(DIST, f), f]))('metadatos de %s', (_name, file) => {
  const doc = parse(readFileSync(file, 'utf8'));
  const meta = (attr: 'property' | 'name', key: string) =>
    doc.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content');
  const lang = doc.querySelector('html')?.getAttribute('lang');

  it('Open Graph básico coherente con la página', () => {
    expect(meta('property', 'og:type')).toBe('website');
    expect(meta('property', 'og:site_name')).toBe('Ascension');
    expect(meta('property', 'og:title')).toBeTruthy();
    expect(meta('property', 'og:description')).toBe(meta('name', 'description'));
    expect(meta('property', 'og:url')).toBe(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'));
  });

  it('og:locale del idioma de la página y el otro como alternativo', () => {
    const [locale, alternate] = lang === 'en' ? ['en_US', 'es_ES'] : ['es_ES', 'en_US'];
    expect(meta('property', 'og:locale')).toBe(locale);
    expect(meta('property', 'og:locale:alternate')).toBe(alternate);
  });

  it('imagen de previsualización 1200×630 en el idioma de la página', async () => {
    const image = meta('property', 'og:image') ?? '';
    expect(image).toBe(`${SITE}/og/og-${lang}.png`);
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
    expect(meta('property', 'og:image:alt')).toBeTruthy();
    const { width, height } = await sharp(distPath(image)).metadata();
    expect([width, height]).toEqual([1200, 630]);
  });

  it('Twitter Card grande con la misma imagen', () => {
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    expect(meta('name', 'twitter:image')).toBe(meta('property', 'og:image'));
  });

  it('favicon, apple-touch-icon y enlace al sitemap', () => {
    expect(doc.querySelector('link[rel="icon"][type="image/png"]')?.getAttribute('href')).toBe(`${BASE}/favicon-32x32.png`);
    expect(doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe(`${BASE}/apple-touch-icon.png`);
    expect(doc.querySelector('link[rel="sitemap"]')?.getAttribute('href')).toBe(`${BASE}/sitemap-index.xml`);
  });

  it('se puede indexar', () => {
    expect(meta('name', 'robots') ?? '').not.toMatch(/noindex/);
  });
});

describe('iconos', () => {
  it.each([
    ['favicon-32x32.png', 32],
    ['apple-touch-icon.png', 180],
  ])('%s mide %ipx', async (file, size) => {
    const { width, height } = await sharp(join(DIST, file)).metadata();
    expect([width, height]).toEqual([size, size]);
  });

  it('apple-touch-icon no tiene transparencia (iOS la pinta de negro)', async () => {
    const { data } = await sharp(join(DIST, 'apple-touch-icon.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) transparent++;
    expect(transparent).toBe(0);
  });

  it('favicon.ico es un ICO válido', () => {
    const ico = readFileSync(join(DIST, 'favicon.ico'));
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2)]).toEqual([0, 1]);
    expect(ico.readUInt16LE(4)).toBeGreaterThan(0);
  });
});

describe('sitemap', () => {
  const index = read('sitemap-index.xml');
  const sitemap = read('sitemap-0.xml');

  it('existe el índice y apunta al sitemap con URL absoluta', () => {
    expect(index).toContain(`<loc>${SITE}/sitemap-0.xml</loc>`);
  });

  it('contiene las 6 páginas y ninguna más', () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual([...EXPECTED_PAGES].sort());
  });

  it('declara las alternativas de idioma', () => {
    expect(sitemap).toContain(`<xhtml:link rel="alternate" hreflang="en-US" href="${SITE}/en/privacy/"`);
    expect(sitemap).toContain(`<xhtml:link rel="alternate" hreflang="es-ES" href="${SITE}/privacy/"`);
  });
});

describe('robots.txt', () => {
  const robots = read('robots.txt');

  it('permite rastrear todo y enlaza el sitemap absoluto', () => {
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });
});

describe('página 404', () => {
  const doc = parse(read('404.html') || '<html></html>');

  it('existe y no se indexa', () => {
    expect(existsSync(join(DIST, '404.html'))).toBe(true);
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toMatch(/noindex/);
  });

  it('ofrece volver al inicio en ambos idiomas', () => {
    const hrefs = doc.querySelectorAll('main a').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining([`${BASE}/`, `${BASE}/en/`]));
  });

  it('no declara canonical ni hreflang (no es una página real)', () => {
    expect(doc.querySelector('link[rel="canonical"]')).toBeNull();
    expect(doc.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(0);
  });
});
