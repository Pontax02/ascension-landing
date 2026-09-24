// TODO(capturas): sustituir los placeholders por capturas reales de la app (1080×2400, las mismas
// de la ficha de Play Store) y ajustar los textos alternativos en i18n (screens.*).
import shot1 from '../assets/screenshots/placeholder-1.png';
import shot2 from '../assets/screenshots/placeholder-2.png';
import shot3 from '../assets/screenshots/placeholder-3.png';
import shot4 from '../assets/screenshots/placeholder-4.png';

export const SCREENSHOTS = [
  { id: 'perfil', image: shot1 },
  { id: 'arbol', image: shot2 },
  { id: 'stats', image: shot3 },
  { id: 'amigos', image: shot4 },
] as const;

export type ScreenshotId = (typeof SCREENSHOTS)[number]['id'];

/** Captura que aparece en el mockup del hero. */
export const HERO_SCREENSHOT = SCREENSHOTS[0];
