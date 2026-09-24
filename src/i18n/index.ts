// Helpers de idioma. Los locales deben coincidir con `i18n` en astro.config.mjs.
import { url } from '../lib/url';
import { en } from './en';
import { es, type UiKey } from './es';

export const LOCALES = ['es', 'en'] as const;
export const DEFAULT_LOCALE = 'es';
export type Locale = (typeof LOCALES)[number];

const dictionaries: Record<Locale, Record<UiKey, string>> = { es, en };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Normaliza `Astro.currentLocale` (o cualquier valor) a un locale válido. */
export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Devuelve `t(key)` para el idioma dado; si no es válido, usa el idioma por defecto. */
export function useTranslations(lang: string | undefined) {
  const dict = dictionaries[isLocale(lang) ? lang : DEFAULT_LOCALE];
  return (key: UiKey): string => dict[key];
}

/** Ruta interna en un idioma: el por defecto sin prefijo, el resto con /<lang>. Respeta `base`. */
export function localePath(lang: Locale, path = '/', base: string = import.meta.env.BASE_URL): string {
  const clean = path.replace(/^\/+/, '');
  return lang === DEFAULT_LOCALE ? url(`/${clean}`, base) : url(`/${lang}/${clean}`, base);
}

/** La misma página (pathname completo, con base) en otro idioma. */
export function switchLocalePath(pathname: string, target: Locale, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.replace(/\/+$/, '');
  let rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  if (!rest.startsWith('/')) rest = `/${rest}`;

  for (const lang of LOCALES) {
    if (lang === DEFAULT_LOCALE) continue;
    if (rest === `/${lang}` || rest.startsWith(`/${lang}/`)) {
      rest = rest.slice(lang.length + 1) || '/';
      break;
    }
  }
  return localePath(target, rest, base);
}
