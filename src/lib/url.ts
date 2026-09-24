/**
 * Construye una ruta interna respetando el `base` de astro.config.mjs.
 * Usar SIEMPRE para enlaces internos y assets de public/: así el paso de
 * `/ascension-landing/` al dominio propio solo requiere cambiar la config.
 */
export function url(path = '/', base: string = import.meta.env.BASE_URL): string {
  const prefix = base.replace(/\/+$/, '');
  const suffix = path.replace(/^\/+/, '');
  return `${prefix}/${suffix}`;
}
