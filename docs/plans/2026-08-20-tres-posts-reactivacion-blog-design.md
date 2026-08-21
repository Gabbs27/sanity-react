# Diseño — 3 posts para reactivar el blog

**Fecha:** 2026-08-20
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Autor:** Gabriel Abreu (con Claude Code)

## Contexto

El blog lleva **3 meses sin publicar**. Último post: 2026-05-13
(`3-prompts-gemini-nano-banana-resultados`, español, ~13k caracteres).
Anterior: 2026-04-30 (`vercel-express-node-js-serverless-ga4-migration`,
inglés). Total en Sanity: 11 posts publicados.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Objetivo | Los cuatro: tráfico/SEO, build in public, autoridad para clientes, y reactivar cadencia |
| Idioma | Español en los tres |
| Alcance | 3 posts, uno de cada set propuesto |
| Portadas | SVG de marca diseñadas a medida, subidas a Sanity |
| Publicación | Los tres hoy, directamente publicados, con timestamps escalonados por minutos |

## Los tres posts

### Post 1 — Auditoría del portfolio (build in public + SEO)

- **Título:** Le hice una auditoría a mi propio portfolio y encontré 20 problemas
- **Slug:** `auditoria-portfolio-20-problemas`
- **Objetivo primario:** build in public; secundario SEO ("auditoría web", "optimizar sitio")
- **Largo:** ~2.000 palabras
- **Tags:** Auditoría, Performance, SEO, React, Vite

Fuente: `docs/plans/2026-04-29-portfolio-audit.md` y los 9 slices ya ejecutados.
Cifras verificadas contra commits:

| Hallazgo | Dato real | Commit |
|---|---|---|
| Hero PNG sin optimizar | 993 KB → 23 KB WebP (−98%) | `67b479f` |
| `nobggabo` en todas las páginas | 358 KB → 45 KB (−87%) | `67b479f` |
| Posts en sitemap | 0 de 9 → generado en build con GROQ | `f5d9807` |
| 404 catch-all roto | `/:slug` sombreaba `*`; ahora `OnePost` distingue cargando vs inexistente | `bf6b1a0` |
| Badge "New" invisible | `Portfolio.tsx` no pasaba la prop a `Card` | `18f0030` |
| Chunk de recharts | 405 KB → 3 KB (`ChartCard` lazy de 411 KB) | `18e765e` |

Estructura: cómo audité → los 5 hallazgos con código antes/después →
qué aprendí → checklist accionable para que el lector audite el suyo.

### Post 2 — Programar con Claude Code (SEO)

- **Título:** Cómo programo con Claude Code: mi flujo real en un proyecto de verdad
- **Slug:** `como-programo-con-claude-code-flujo-real`
- **Objetivo primario:** SEO; secundario autoridad
- **Largo:** ~2.000 palabras
- **Tags:** Claude Code, IA, Productividad, Desarrollo Web

Ángulo diferenciador: **no** es un "qué es Claude Code". Es el flujo real
sobre este repo, con tres tareas efectivamente delegadas — la auditoría
completa, la migración de Express a Vercel Functions, y el sitemap
generado desde Sanity. Incluye sección honesta de dónde falla.

### Post 3 — Editor propio vs Sanity Studio (técnico del stack)

- **Título:** Por qué construí mi propio editor de posts en vez de usar Sanity Studio
- **Slug:** `editor-propio-vs-sanity-studio`
- **Objetivo primario:** autoridad técnica
- **Largo:** ~1.800 palabras
- **Tags:** Sanity, React, BlockNote, Portable Text, TypeScript

Fuente: `src/utils/blocknoteToPortable.ts` (mapeo bidireccional
BlockNote ↔ Portable Text), `src/components/Admin/PostEditor.tsx`,
rutas `/admin/write` y `/admin/write/:id`.
Cierra admitiendo el costo real: el chunk del `PostEditor` pesa 1,3 MB,
y una sección de "cuándo NO deberías hacer esto".

## Portadas

`AllPosts.tsx:98` pasa `post.mainImage?.asset?.url || ""` a `PostCard`, que
renderiza `<img src="">` — es decir, **sin portada la tarjeta sale rota**.
`OnePost.tsx:106` sí protege el render con un guard.

Solución: tres SVG diseñados con la paleta del sitio (`#6366F1` indigo,
`#0F172A` slate, `#38BDF8` sky), subidos como assets de imagen a Sanity.
SVG es válido porque ambos componentes consumen `asset->url` directo, sin
transformaciones de `@sanity/image-url`.

## Campos por documento

```
_type: "post"
title, slug.current, mainImage (referencia al asset SVG),
tags[], excerpt, publishedAt, sponsored: false,
affiliateDisclosure: false, body (blockContent)
```

`author` queda nulo, igual que los dos posts más recientes.

## Restricciones

- El cuerpo debe usar solo tipos que `blockContent.ts` admite: `block`
  (estilos normal/h1-h4/blockquote/code, listas bullet/number), `image`,
  y `codeBlock`. Nada de tablas.
- `excerpt` se rellena en los tres — los 11 posts existentes lo tienen
  nulo, y alimenta SEO y las tarjetas.
- No tocar `index.html`, `public/ads.txt` ni el meta de AdSense.
- El sitemap se regenera solo en el próximo `npm run build` (`prebuild`).

## Verificación

1. Los tres documentos consultables vía GROQ con `perspective: published`.
2. `/allpost` muestra las tres tarjetas nuevas con portada visible.
3. Cada post abre en su slug y renderiza cuerpo, código y portada.
4. Revisión visual en el navegador antes de dar el trabajo por terminado.
