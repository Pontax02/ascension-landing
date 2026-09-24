// Reglas de movimiento sobre el CSS generado (incrustado en el HTML de dist/).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseHtml } from 'node-html-parser';
import postcss, { type AtRule, type Container, type Declaration, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

const DIST = join(import.meta.dirname, '..', 'dist');
const PAGES = ['index.html', join('en', 'index.html'), '404.html'];

const html = PAGES.filter((p) => existsSync(join(DIST, p)))
  .map((p) => readFileSync(join(DIST, p), 'utf8'))
  .join('\n');
const css = parseHtml(html)
  .querySelectorAll('style')
  .map((s) => s.textContent)
  .join('\n');
const root = postcss.parse(css);

const decls: Declaration[] = [];
root.walkDecls((d) => {
  decls.push(d);
});

function ancestors(node: Declaration | Rule): (AtRule | Rule)[] {
  const out: (AtRule | Rule)[] = [];
  for (let p = node.parent as Container | undefined; p && p.type !== 'root'; p = p.parent as Container | undefined) {
    out.push(p as AtRule | Rule);
  }
  return out;
}
const inAtRule = (node: Declaration | Rule, name: string, params: RegExp) =>
  ancestors(node).some((a) => a.type === 'atrule' && a.name === name && params.test(a.params));
const selectorOf = (d: Declaration) => ancestors(d).find((a): a is Rule => a.type === 'rule')?.selector ?? '';
const where = (d: Declaration) => `${selectorOf(d)} { ${d.prop}: ${d.value} }`;

// Declaraciones de animación dentro de @keyframes no cuentan: son los fotogramas, no el disparo.
const animationDecls = decls.filter(
  (d) => /^animation(-name)?$/.test(d.prop) && !inAtRule(d, 'keyframes', /./) && !/^none$/.test(d.value),
);

describe('movimiento: reglas de oficio', () => {
  it('hay animaciones (la página no es estática)', () => {
    expect(animationDecls.length).toBeGreaterThan(0);
  });

  it('usa las curvas propias de la marca', () => {
    expect(css).toMatch(/--ease-out:\s*cubic-bezier\(\s*\.?0?\.23,\s*1,\s*\.?0?\.32,\s*1\s*\)/);
  });

  it('nunca "transition: all"', () => {
    const bad = decls.filter((d) => /^transition(-property)?$/.test(d.prop) && /(^|[\s,])all\b/.test(d.value));
    expect(bad.map(where)).toEqual([]);
  });

  it('nunca ease-in (lento al empezar); ease-in-out sí', () => {
    const bad = decls.filter((d) => /^(transition|animation)/.test(d.prop) && /\bease-in\b(?!-)/.test(d.value));
    expect(bad.map(where)).toEqual([]);
  });

  it('nunca aparece desde scale(0)', () => {
    expect(css).not.toMatch(/scale\(\s*0\s*\)/);
  });

  it('toda animación está dentro de prefers-reduced-motion: no-preference', () => {
    const bad = animationDecls.filter((d) => !inAtRule(d, 'media', /prefers-reduced-motion:\s*no-preference/));
    expect(bad.map(where)).toEqual([]);
  });

  it('las animaciones ligadas al scroll solo se activan donde hay soporte', () => {
    const scrollDriven = decls.filter((d) => d.prop === 'animation-timeline');
    expect(scrollDriven.length).toBeGreaterThan(0);
    const bad = scrollDriven.filter((d) => !inAtRule(d, 'supports', /animation-timeline/));
    expect(bad.map(where)).toEqual([]);
  });

  it('los efectos hover que mueven cosas se limitan a dispositivos con ratón', () => {
    const bad = decls.filter(
      (d) =>
        /:hover/.test(selectorOf(d)) &&
        /^(transform|translate|scale|rotate)$/.test(d.prop) &&
        !inAtRule(d, 'media', /hover:\s*hover/),
    );
    expect(bad.map(where)).toEqual([]);
  });

  it('lo pulsable responde al tocar (scale al :active)', () => {
    const press = decls.filter((d) => /:active/.test(selectorOf(d)) && /scale\(0?\.9[5-8]\)/.test(`${d.prop}:${d.value}`));
    expect(press.length).toBeGreaterThan(0);
  });

  it('las transiciones de UI no pasan de 300ms', () => {
    const slow = decls
      .filter((d) => d.prop === 'transition' || d.prop === 'transition-duration')
      .filter((d) => [...d.value.matchAll(/(\d*\.?\d+)(ms|s)\b/g)].some(([, n, u]) => (u === 's' ? Number(n) * 1000 : Number(n)) > 300));
    expect(slow.map(where)).toEqual([]);
  });

  it('sigue sin JavaScript', () => {
    expect(html).not.toMatch(/<script/i);
  });
});
