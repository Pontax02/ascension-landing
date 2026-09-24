// @ts-check
import { defineConfig } from 'astro/config';

// La web vive en GitHub Pages bajo /ascension-landing/. Con dominio propio basta con
// cambiar `site` y eliminar `base`: todas las rutas pasan por url() (src/lib/url.ts).
// https://astro.build/config
export default defineConfig({
  site: 'https://pontax02.github.io',
  base: '/ascension-landing',
  output: 'static',
  trailingSlash: 'ignore',
});
