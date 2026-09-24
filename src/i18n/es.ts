// Textos en español (idioma por defecto). en.ts debe tener exactamente las mismas claves.
// Solo describir funciones que existen en la app (ver ascension-app); nada de "100% gratis".
export const es = {
  'site.name': 'Ascension',
  'site.tagline': 'Time to ascend',
  'site.description': 'Convierte tus hábitos en progreso de personaje. Sube de nivel en la vida real.',
  'site.title': 'Ascension — App de hábitos con progresión RPG',
  'og.imageAlt': 'Ascension, Time to ascend: las cinco etapas de evolución del avatar, del nivel 1 al 36+.',
  'notFound.title': 'Página no encontrada',
  'notFound.body': 'Esta página no existe o se ha movido.',
  'notFound.home': 'Volver al inicio',
  'a11y.skipToContent': 'Saltar al contenido',
  'a11y.home': 'Ascension, ir al inicio',
  'a11y.logoAlt': 'Logo de Ascension',

  'play.comingSoon': 'Próximamente en Google Play',
  'play.altLive': 'Disponible en Google Play',
  'play.freeToStart': 'Gratis para empezar',

  'hero.eyebrow': 'App de hábitos con progresión RPG',
  'hero.lead': 'Convierte tus hábitos en progreso de personaje: gana XP, sube de nivel y mira cómo evoluciona tu avatar.',
  'hero.screenshotAlt': 'Pantalla de perfil de Ascension con el nivel y la barra de experiencia',
  'hero.xpLabel': 'XP',
  'hero.factsLabel': 'Lo básico',
  'hero.facts.noAds': 'Sin anuncios',
  'hero.facts.noSubs': 'Sin suscripciones',
  'hero.facts.langs': 'En español e inglés',
  'hero.chipXp': '+40 XP',
  'hero.chipHabit': 'Meditar I completado',
  'hero.chipStreak': 'Racha de 12 días',

  'pillars.eyebrow': 'Cómo funciona',
  'pillars.levelShort': 'Nv',
  'pillars.inviteCode': 'Código de invitación',
  'evolution.eyebrow': 'Progresión',
  'screens.eyebrow': 'La app',

  'pillars.title': 'Qué es Ascension',
  'pillars.lead': 'Tres ideas simples para que la constancia se note.',
  'pillars.tree.title': 'Árbol de hábitos',
  'pillars.tree.body': 'Empiezas por la raíz y cada hábito que completas desbloquea los siguientes de su rama. Algunos se completan solos al cumplir su condición.',
  'pillars.rpg.title': 'Progresión RPG',
  'pillars.rpg.body': 'Cada hábito completado suma XP. Sube de nivel sin techo y mantén tu racha día tras día.',
  'pillars.friends.title': 'Amigos',
  'pillars.friends.body': 'Añade amigos por nombre de usuario o con tu código de invitación y sigue su nivel, su racha y su avatar.',

  'evolution.title': 'Tu avatar evoluciona contigo',
  'evolution.lead': 'Cuanto más constante eres, más sube tu nivel. Y tu personaje lo refleja.',
  'evolution.listLabel': 'Etapas de evolución del avatar',
  'evolution.level': 'Nivel',
  'evolution.novato': 'Novato',
  'evolution.aprendiz': 'Aprendiz',
  'evolution.guerrero': 'Guerrero',
  'evolution.semidios': 'Semidiós',
  'evolution.ascension': 'Ascensión',
  'evolution.alt': 'Avatar en la etapa',

  'screens.title': 'Así se ve Ascension',
  'screens.lead': 'Diseño limpio, sin ruido. Solo tú, tus hábitos y tu progreso.',
  'screens.listLabel': 'Capturas de la app',
  'screens.perfil': 'Perfil con nivel, XP y racha',
  'screens.arbol': 'Árbol de hábitos con ramas desbloqueadas',
  'screens.stats': 'Estadísticas con mapa de actividad y XP diaria',
  'screens.amigos': 'Lista de amigos con su nivel',

  'cta.lead': 'Tu próximo nivel empieza hoy.',

  'lang.label': 'Idioma',
  'lang.es': 'Español',
  'lang.en': 'English',

  'legal.updated': 'Última actualización',

  'footer.contact': 'Contacto',
  'footer.privacy': 'Privacidad',
  'footer.deleteAccount': 'Borrar cuenta',
  'footer.legalLabel': 'Legal',
  'footer.tagline': 'Hábitos con progresión RPG.',
  'footer.copyright': 'Ascension Project',
} as const;

export type UiKey = keyof typeof es;
