// Textos en español (idioma por defecto). En el paso de i18n se añade en.ts con las mismas claves.
export const es = {
  'site.name': 'Ascension',
  'site.tagline': 'Time to ascend',
  'site.description': 'Convierte tus hábitos en progreso de personaje. Sube de nivel en la vida real.',
  'a11y.skipToContent': 'Saltar al contenido',
  'a11y.home': 'Ascension, ir al inicio',
  'a11y.logoAlt': 'Logo de Ascension',
  'footer.contact': 'Contacto',
  'footer.copyright': 'Ascension Project',
} as const;

export type UiKey = keyof typeof es;
