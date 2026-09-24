# Ascension — landing

Landing estática de [Ascension](https://pontax02.github.io/ascension-landing/), app Android de
hábitos con progresión RPG. Hecha con [Astro](https://astro.build) (salida 100% estática) y
desplegada en GitHub Pages.

- Web actual: `https://pontax02.github.io/ascension-landing/`
- Dominio futuro: `https://ascensionproject.app` (ver [Cuando se compre el dominio](#cuando-se-compre-el-dominio))

## Desarrollo local

Requiere Node 24 (ver `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321/ascension-landing/
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:4321/ascension-landing/
```

Ojo: la web vive bajo el subpath `/ascension-landing/`; la raíz `http://localhost:4321/` da 404.

### Tests

```bash
npm test             # tests unitarios (Vitest) de src/
npm run test:build   # astro build + comprueba el HTML de dist/
npm run check        # todo lo anterior (es lo que ejecuta el deploy)
```

`test:build` verifica que toda ruta local de `dist/` lleva el prefijo `base` y apunta a un
fichero existente, así que un enlace o asset escrito a mano con ruta absoluta rompe el build.

## Rutas: usar siempre `url()`

Nunca escribir rutas internas a mano (`href="/privacy"`). Usar el helper:

```astro
---
import { url } from '../lib/url';
---
<a href={url('/privacy')}>Privacidad</a>
```

Las imágenes de `src/assets/` se importan y se pintan con `<Image>` de `astro:assets`, que ya
aplica el `base` automáticamente. Los originales están en `assets-originales/` y no se modifican.

## Deploy

Cada push a `main` lanza `.github/workflows/deploy.yml`: ejecuta los tests, construye con
`withastro/action` y publica con `actions/deploy-pages`. También se puede lanzar a mano desde
la pestaña Actions (*Run workflow*).

Configuración única en GitHub (manual): **Settings → Pages → Build and deployment → Source:
GitHub Actions**. El repo debe ser público.

## Cuando se compre el dominio

No hacer hasta tener `ascensionproject.app`:

1. En hPanel de Hostinger, añadir los registros DNS:
   - `A` en `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` en `www` → `pontax02.github.io`
2. Crear `public/CNAME` con el contenido `ascensionproject.app`.
3. En `astro.config.mjs`: `site: 'https://ascensionproject.app'` y **eliminar** `base`.
   Gracias a `url()` no hay que tocar nada más; `npm run check` lo confirma.
4. En GitHub → Settings → Pages: poner el dominio personalizado y activar *Enforce HTTPS*.
5. Actualizar en Play Console las URLs de privacidad y de borrado de cuenta.
