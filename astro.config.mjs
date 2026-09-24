// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// La web vive en GitHub Pages bajo /ascension-landing/. Con dominio propio basta con
// cambiar `site` y eliminar `base`: todas las rutas pasan por url() (src/lib/url.ts).
// https://astro.build/config
export default defineConfig({
  site: 'https://pontax02.github.io',
  base: '/ascension-landing',
  output: 'static',
  trailingSlash: 'ignore',
  // Español por defecto en la raíz; inglés en /en/. Textos en src/i18n/{es,en}.ts.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Fuentes de Fontsource descargadas en build y servidas desde el propio sitio (sin Google Fonts).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Sora',
      cssVariable: '--font-sora',
      weights: [600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
});
