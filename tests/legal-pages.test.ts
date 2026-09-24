// Páginas legales requeridas por Google Play: /privacy y /delete-account, en ES y EN.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';
import { CONTACT_EMAIL } from '../src/config';

const DIST = join(import.meta.dirname, '..', 'dist');
const BASE = (config.base ?? '/').replace(/\/$/, '');

function load(file: string) {
  const path = join(DIST, file);
  const html = existsSync(path) ? readFileSync(path, 'utf8') : '<html><main></main></html>';
  return { exists: existsSync(path), doc: parse(html) };
}
const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

const LOCALES = [
  {
    lang: 'es',
    prefix: '',
    privacy: { title: /Política de privacidad/i, sections: 10 },
    del: {
      title: /borrar tu cuenta/i,
      steps: ['Ajustes', 'Cuenta', 'Eliminar cuenta', 'contraseña actual'],
      subject: 'Solicitud de borrado de cuenta',
      deadline: /30 días/,
      deleted: [/nombre de usuario/i, /racha/i, /amistades/i],
      kept: /justificante.*compra/i,
    },
    footer: { privacy: 'Privacidad', delete: 'Borrar cuenta' },
  },
  {
    lang: 'en',
    prefix: '/en',
    privacy: { title: /Privacy Policy/i, sections: 10 },
    del: {
      title: /delete your (Ascension )?account/i,
      steps: ['Settings', 'Account', 'Delete account', 'current password'],
      subject: 'Account deletion request',
      deadline: /30 days/,
      deleted: [/username/i, /streak/i, /friendships/i],
      kept: /purchase receipt/i,
    },
    footer: { privacy: 'Privacy', delete: 'Delete account' },
  },
] as const;

describe.each(LOCALES)('política de privacidad ($lang)', (locale) => {
  const { exists, doc } = load(join(locale.prefix, 'privacy', 'index.html'));
  const main = () => doc.querySelector('main')!;

  it('se genera', () => expect(exists).toBe(true));

  it(`declara lang="${locale.lang}" y un único h1 con el título`, () => {
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe(locale.lang);
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toMatch(locale.privacy.title);
    expect(doc.querySelector('title')?.textContent).toMatch(locale.privacy.title);
  });

  it('muestra la fecha de última actualización', () => {
    expect(main().querySelector('time')?.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}$/);
  });

  it(`tiene las ${locale.privacy.sections} secciones de la política`, () => {
    expect(main().querySelectorAll('h2')).toHaveLength(locale.privacy.sections);
  });

  it('enlaza al email de contacto', () => {
    expect(main().querySelector(`a[href^="mailto:${CONTACT_EMAIL}"]`)).not.toBeNull();
  });

  it('tiene meta description', () => {
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')?.length).toBeGreaterThan(20);
  });
});

describe.each(LOCALES)('borrado de cuenta ($lang)', (locale) => {
  const { exists, doc } = load(join(locale.prefix, 'delete-account', 'index.html'));
  const main = () => doc.querySelector('main')!;
  const text = () => clean(main().textContent);

  it('se genera', () => expect(exists).toBe(true));

  it(`declara lang="${locale.lang}" y un único h1`, () => {
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe(locale.lang);
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toMatch(locale.del.title);
  });

  it('explica paso a paso cómo borrar la cuenta desde la app', () => {
    const steps = clean(main().querySelector('ol')?.textContent);
    for (const s of locale.del.steps) expect(steps).toContain(s);
  });

  it('ofrece un mailto al email de contacto con el asunto prefijado', () => {
    const href = main().querySelector(`a[href^="mailto:${CONTACT_EMAIL}"]`)?.getAttribute('href') ?? '';
    const subject = new URL(href.replace(/&amp;/g, '&')).searchParams.get('subject');
    expect(subject).toBe(locale.del.subject);
  });

  it('indica el plazo de borrado', () => {
    expect(text()).toMatch(locale.del.deadline);
  });

  it('detalla qué datos se borran y qué se conserva', () => {
    for (const re of locale.del.deleted) expect(text()).toMatch(re);
    expect(text()).toMatch(locale.del.kept);
  });

  it('no remite a la antigua página de borrado del backend', () => {
    expect(doc.toString()).not.toMatch(/railway\.app/i);
  });
});

describe.each(LOCALES)('footer enlaza a las páginas legales ($lang)', (locale) => {
  const pages = ['index.html', join('privacy', 'index.html'), join('delete-account', 'index.html')];

  it.each(pages)('en %s', (page) => {
    const { doc } = load(join(locale.prefix, page));
    const footer = doc.querySelector('footer');
    const privacy = footer?.querySelectorAll('a').find((a) => clean(a.textContent) === locale.footer.privacy);
    const del = footer?.querySelectorAll('a').find((a) => clean(a.textContent) === locale.footer.delete);
    expect(privacy?.getAttribute('href')).toBe(`${BASE}${locale.prefix}/privacy/`);
    expect(del?.getAttribute('href')).toBe(`${BASE}${locale.prefix}/delete-account/`);
  });
});

describe('el selector de idioma de las páginas legales apunta a su equivalente', () => {
  it.each([
    [join('privacy', 'index.html'), `${BASE}/en/privacy/`],
    [join('en', 'privacy', 'index.html'), `${BASE}/privacy/`],
    [join('delete-account', 'index.html'), `${BASE}/en/delete-account/`],
    [join('en', 'delete-account', 'index.html'), `${BASE}/delete-account/`],
  ])('%s → %s', (page, target) => {
    const { doc } = load(page);
    expect(doc.querySelector('header nav.lang-switch a')?.getAttribute('href')).toBe(target);
  });
});
