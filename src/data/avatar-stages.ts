// Etapas del avatar. Los umbrales de nivel son los de la app (ascension-app, avatar_nivel.dart);
// los nombres son de la landing. La app no tiene nivel máximo: la última etapa es "36+".
import avatar1 from '../assets/avatars/avatar_1.png';
import avatar2 from '../assets/avatars/avatar_2.png';
import avatar3 from '../assets/avatars/avatar_3.png';
import avatar4 from '../assets/avatars/avatar_4.png';
import avatar5 from '../assets/avatars/avatar_5.png';

export const AVATAR_STAGES = [
  { id: 'novato', minLevel: 1, image: avatar1 },
  { id: 'aprendiz', minLevel: 6, image: avatar2 },
  { id: 'guerrero', minLevel: 11, image: avatar3 },
  { id: 'semidios', minLevel: 21, image: avatar4 },
  { id: 'ascension', minLevel: 36, image: avatar5 },
] as const;

export type AvatarStageId = (typeof AVATAR_STAGES)[number]['id'];
