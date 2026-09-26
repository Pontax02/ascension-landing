// Reglas de las guías de diseño de Apple (materiales, tipografía, accesibilidad) sobre el build.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseHtml } from 'node-html-parser';
import postcss, { type AtRule, type Container, type Declaration, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

const DIST = join(import.meta.dirname, '..', 'dist');
const read = (p: string) => (existsSync(join(DIST, p)) ? readFileSync(join(DIST, p), 'utf8') : '');
const html = ['index.html', join('en', 'index.html'), '404.html'].map(read).join('\n');
const css = parseHtml(html)
	.querySelectorAll('style')
	.map((s) => s.textContent)
	.join('\n');
const root = postcss.parse(css);

const decls: Declaration[] = [];
root.walkDecls((d) => {
	decls.push(d);
});

const ancestors = (d: Declaration) => {
	const out: (AtRule | Rule)[] = [];
	for (let p = d.parent as Container | undefined; p && p.type !== 'root'; p = p.parent as Container | undefined) {
		out.push(p as AtRule | Rule);
	}
	return out;
};
const selectorOf = (d: Declaration) => ancestors(d).find((a): a is Rule => a.type === 'rule')?.selector ?? '';
const inMedia = (d: Declaration, re: RegExp) => ancestors(d).some((a) => a.type === 'atrule' && a.name === 'media' && re.test(a.params));
const topLevel = (d: Declaration) => !ancestors(d).some((a) => a.type === 'atrule');
/** Valor de `prop` en la regla cuyo selector incluye exactamente `sel` (fuera de @media). */
const valueOf = (sel: string, prop: string) =>
	decls.find((d) => topLevel(d) && d.prop === prop && selectorOf(d).split(',').map((s) => s.trim()).includes(sel))?.value;
/** Resuelve un var(--token) a su valor en :root. */
const resolve = (v = ''): string => {
	const token = v.match(/^var\((--[\w-]+)\)$/)?.[1];
	return token ? resolve(css.match(new RegExp(`${token}:\\s*([^;}]+)`))?.[1]?.trim()) : v;
};
const num = (v?: string) => Number(resolve(v).match(/-?\d*\.?\d+/)?.[0] ?? NaN);
/** Opacidad de un color, tal como lo deja el minificador (#rrggbbaa) o en rgb(… / a). */
const alphaOf = (v = '') => {
	const hex = v.match(/#[0-9a-f]{6}([0-9a-f]{2})(?![0-9a-f])/i)?.[1];
	if (hex) return parseInt(hex, 16) / 255;
	const rgb = v.match(/rgba?\([^)]*[,/]\s*(0?\.\d+)\s*\)/)?.[1];
	return rgb ? Number(rgb) : 1;
};
/** Sombras de un valor box-shadow con desplazamiento o desenfoque (un anillo `0 0 0 Npx` no cuenta). */
const realShadows = (value: string) =>
	resolveAll(value)
		.split(/,(?![^(]*\))/)
		.filter((part) => {
			const lengths = part
				.replace(/\w+\([^)]*\)/g, ' ')
				.replace(/#[0-9a-f]+/gi, ' ')
				.split(/\s+/)
				.filter((t) => /^-?[\d.]+(px|em|rem)?$/.test(t));
			return lengths.slice(0, 3).some((t) => Number.parseFloat(t) !== 0);
		});
/** Sustituye cada var(--token) por su valor en :root (hasta dos niveles). */
const resolveAll = (v: string): string =>
	v.replace(/var\((--[\w-]+)\)/g, (_, token) => resolveAll(css.match(new RegExp(`${token}:\s*([^;}]+)`))?.[1]?.trim() ?? ''));
/** Declaraciones del header (con el atributo de ámbito de Astro), fuera de @media. */
const header = (pseudo: RegExp) => decls.filter((d) => topLevel(d) && /\.site-header(\[[^\]]+\])?/.test(selectorOf(d)) && pseudo.test(selectorOf(d)));

describe('diseño Apple: materiales', () => {
	it('el header es un material translúcido (el contenido pasa por debajo)', () => {
		const bg = header(/^[^:]*$/).find((d) => d.prop === 'background')?.value;
		expect(alphaOf(bg)).toBeLessThan(0.9);
	});

	it('el separador del header es una línea fina (hairline), no una sombra', () => {
		const edge = header(/::?after/);
		expect(edge.find((d) => d.prop === 'height')?.value).toBe('1px');
		expect(edge.some((d) => d.prop === 'box-shadow')).toBe(false);
	});

	it('con "reducir transparencia" los materiales son opacos y sin desenfoque', () => {
		const reduced = decls.filter((d) => inMedia(d, /prefers-reduced-transparency:\s*reduce/));
		expect(reduced.some((d) => /backdrop-filter/.test(d.prop) && d.value === 'none')).toBe(true);
	});

	it('con "más contraste" hay bordes definidos', () => {
		expect(decls.some((d) => inMedia(d, /prefers-contrast:\s*more/))).toBe(true);
	});
});

describe('diseño Apple: tipografía', () => {
	it('el tracking depende del tamaño: h1 más cerrado que h2, h2 que h3', () => {
		const [h1, h2, h3] = ['h1', 'h2', 'h3'].map((h) => num(valueOf(h, 'letter-spacing')));
		expect(h1).toBeLessThan(h2);
		expect(h2).toBeLessThan(h3);
		expect(h3).toBeLessThanOrEqual(0);
	});

	it('el interlineado crece al bajar de tamaño', () => {
		const [h1, h2, h3] = ['h1', 'h2', 'h3'].map((h) => num(valueOf(h, 'line-height')));
		expect(h1).toBeLessThan(h2);
		expect(h2).toBeLessThan(h3);
	});

	it('usa tamaño óptico automático', () => {
		expect(decls.some((d) => d.prop === 'font-optical-sizing' && d.value === 'auto')).toBe(true);
	});
});

describe('diseño Apple: respuesta y accesibilidad', () => {
	it('sin bucles infinitos (las oscilaciones lentas marean y distraen)', () => {
		const loops = decls.filter((d) => /^animation(-iteration-count)?$/.test(d.prop) && /\binfinite\b/.test(d.value));
		expect(loops.map((d) => `${selectorOf(d)} { ${d.prop}: ${d.value} }`)).toEqual([]);
	});

	it('el header fijo no tapa el elemento enfocado ni los anclajes', () => {
		expect(valueOf('html', 'scroll-padding-top')).toBeTruthy();
	});

	it('toque sin retardo ni destello gris', () => {
		expect(decls.some((d) => d.prop === 'touch-action' && d.value === 'manipulation')).toBe(true);
		expect(decls.some((d) => d.prop === '-webkit-tap-highlight-color')).toBe(true);
	});

	it('nombres de marca y códigos no se traducen automáticamente', () => {
		const doc = parseHtml(read('index.html'));
		expect(doc.querySelector('.brand__name')?.getAttribute('translate')).toBe('no');
		expect(doc.querySelector('.site-footer__logo span')?.getAttribute('translate')).toBe('no');
		expect(doc.querySelector('.code b')?.getAttribute('translate')).toBe('no');
	});

	it('apóstrofos tipográficos en el texto en inglés', () => {
		expect(read('404.html')).toMatch(/doesn’t/);
	});
});

// DESIGN.md (análisis del diseño web de Apple), adaptado: el dorado de marca hace de acento único.
describe('DESIGN.md: superficies planas', () => {
	it('sin degradados decorativos: la atmósfera la ponen las imágenes y el cambio de color', () => {
		expect(css.match(/[\w.:\[\]="-]*\{[^}]*(?:radial|linear|conic)-gradient[^}]*\}/g) ?? []).toEqual([]);
	});

	it('sin sombras en tarjetas, botones ni chips: solo el render del producto (el móvil) la lleva', () => {
		const bad = decls
			.filter((d) => d.prop === 'box-shadow' && !/phone|focus/.test(selectorOf(d)))
			.filter((d) => realShadows(d.value).length > 0)
			.map((d) => `${selectorOf(d)} { box-shadow: ${d.value} }`);
		expect(bad).toEqual([]);
	});

	it('el móvil lleva la sombra de producto del sistema', () => {
		const phone = decls.filter((d) => /\.phone\b/.test(selectorOf(d)) && d.prop === 'box-shadow');
		expect(phone.some((d) => /3px 5px 30px/.test(resolveAll(d.value)))).toBe(true);
	});

	it('tarjetas con el radio de utilidad de 18px', () => {
		for (const card of [/^\.pillar(\[[^\]]+\])?$/, /^\.stage(\[[^\]]+\])?$/]) {
			const radius = decls.find((d) => topLevel(d) && card.test(selectorOf(d)) && d.prop === 'border-radius');
			expect(resolveAll(radius?.value ?? '')).toBe('18px');
		}
	});

	it('el pie se separa por el cambio de color, sin borde superior', () => {
		const footer = decls.filter((d) => topLevel(d) && /^\.site-footer(\[[^\]]+\])?$/.test(selectorOf(d)));
		expect(footer.some((d) => /^border(-top)?$/.test(d.prop))).toBe(false);
	});
});

describe('DESIGN.md: tipografía', () => {
	it('titulares a peso 600, no 700', () => {
		for (const h of ['h1', 'h2', 'h3']) expect(valueOf(h, 'font-weight')).toBe('600');
	});

	it('texto de lectura a 17px, no 16px', () => {
		expect(resolve(valueOf('body', 'font-size'))).toMatch(/^(1\.0625rem|17px)$/);
	});
});
