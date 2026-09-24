// Genera los iconos de public/ a partir del símbolo del logo. Ejecutar al cambiar el logo:
//   node scripts/generate-icons.mjs
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SOURCE = 'src/assets/logo-mark.png';
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** Símbolo centrado en un lienzo cuadrado de `size` px con `padding` (fracción) de margen. */
async function icon(size, { padding, background }) {
  const inner = Math.round(size * (1 - 2 * padding));
  const mark = await sharp(SOURCE).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  let img = sharp({ create: { width: size, height: size, channels: 4, background } }).composite([{ input: mark, gravity: 'center' }]);
  if (background.alpha === 1) img = img.flatten({ background });
  return img.png({ compressionLevel: 9 }).toBuffer();
}

/** ICO con una única imagen PNG embebida (formato admitido por todos los navegadores actuales). */
function ico(png, size) {
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: icono
  header.writeUInt16LE(1, 4); // nº de imágenes
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt8(0, 8); // paleta
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10); // planos
  header.writeUInt16LE(32, 12); // bits por píxel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

const favicon32 = await icon(32, { padding: 0.02, background: { r: 0, g: 0, b: 0, alpha: 0 } });
writeFileSync('public/favicon-32x32.png', favicon32);
writeFileSync('public/favicon.ico', ico(favicon32, 32));
// iOS no admite transparencia en el apple-touch-icon: fondo blanco y margen generoso.
writeFileSync('public/apple-touch-icon.png', await icon(180, { padding: 0.14, background: WHITE }));
console.log('Iconos generados en public/');
