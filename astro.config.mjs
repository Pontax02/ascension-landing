// @ts-check
import { defineConfig } from 'astro/config';

// Mientras no haya dominio propio, la web vive en GitHub Pages bajo /ascension-landing/.
// Al comprar ascensionproject.app: site -> 'https://ascensionproject.app' y eliminar `base`
// (ver README, sección "Cuando se compre el dominio").
// https://astro.build/config
export default defineConfig({
  site: 'https://pontax02.github.io',
  base: '/ascension-landing',
  output: 'static',
  trailingSlash: 'ignore',
});
