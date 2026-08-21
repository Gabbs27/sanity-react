# 3 posts en español — Plan de implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Escribir y publicar tres posts en español en codewithgabo.com, cada uno con portada propia, tras 3 meses sin publicar.

**Architecture:** Los cuerpos se escriben en markdown bajo `docs/drafts/` (fuente editable, versionada). Un script de Node convierte markdown → Portable Text respetando lo que `blockContent.ts` admite. Las portadas se diseñan en SVG, se rasterizan a PNG con herramientas nativas de macOS, y se suben a Sanity por el endpoint `/api/upload` del backend desplegado. Los documentos se crean por `/api/posts`, que publica directo.

**Tech Stack:** Node 20 (ESM, sin dependencias nuevas), Sanity Content Lake, `qlmanage` + `sips`, `curl`, Sanity MCP para verificación.

---

## Restricciones descubiertas (no violar)

1. **El CLI de Sanity no está autenticado** (`Unauthorized - Session not found`). No usar `npx sanity`. La escritura va por el backend desplegado en `https://analytics-backend-seven.vercel.app` con `ADMIN_TOKEN` de `analytics-backend/.env`.
2. **Los bloques de código deben ser `style: "code"`**, nunca `_type: "codeBlock"`. `OnePost.tsx:37` solo registra un componente para `block.code`; un `codeBlock` no tendría renderer. Los 2 posts recientes lo confirman: su body solo contiene `block` e `image`.
3. **`/api/upload` rechaza SVG** — `ALLOWED_MIME` solo admite jpeg/png/webp/gif. Por eso las portadas se rasterizan a PNG.
4. **No tocar** `index.html`, `public/ads.txt` ni el meta de AdSense.
5. **Nunca imprimir el `ADMIN_TOKEN`** en salida de terminal. Leerlo en una variable de entorno del propio comando.

---

## Task 1: Script conversor markdown → Portable Text

**Files:**
- Create: `scripts/md-to-portable.mjs`
- Test: `scripts/__tests__/md-to-portable.test.mjs`

**Step 1: Escribir el test que falla**

```js
// scripts/__tests__/md-to-portable.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mdToPortable } from '../md-to-portable.mjs';

test('párrafo simple produce un block normal', () => {
  const [b] = mdToPortable('Hola mundo.');
  assert.equal(b._type, 'block');
  assert.equal(b.style, 'normal');
  assert.equal(b.children[0].text, 'Hola mundo.');
});

test('encabezado ## produce style h2', () => {
  const [b] = mdToPortable('## Título');
  assert.equal(b.style, 'h2');
  assert.equal(b.children[0].text, 'Título');
});

test('negrita produce mark strong', () => {
  const [b] = mdToPortable('Esto es **fuerte** aquí.');
  const strong = b.children.find((c) => c.marks.includes('strong'));
  assert.equal(strong.text, 'fuerte');
});

test('código inline produce mark code', () => {
  const [b] = mdToPortable('Usa `npm run build` ya.');
  const code = b.children.find((c) => c.marks.includes('code'));
  assert.equal(code.text, 'npm run build');
});

test('enlace produce markDef link con href', () => {
  const [b] = mdToPortable('Ver [el sitio](https://codewithgabo.com).');
  assert.equal(b.markDefs.length, 1);
  assert.equal(b.markDefs[0].href, 'https://codewithgabo.com');
  const linked = b.children.find((c) => c.marks.includes(b.markDefs[0]._key));
  assert.equal(linked.text, 'el sitio');
});

test('lista con viñetas produce listItem bullet', () => {
  const blocks = mdToPortable('- uno\n- dos');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].listItem, 'bullet');
  assert.equal(blocks[1].children[0].text, 'dos');
});

test('lista numerada produce listItem number', () => {
  const [b] = mdToPortable('1. primero');
  assert.equal(b.listItem, 'number');
});

test('cita produce style blockquote', () => {
  const [b] = mdToPortable('> una cita');
  assert.equal(b.style, 'blockquote');
});

test('bloque de código produce style code, nunca _type codeBlock', () => {
  const [b] = mdToPortable('```js\nconst a = 1;\nconst b = 2;\n```');
  assert.equal(b._type, 'block');
  assert.equal(b.style, 'code');
  assert.equal(b.children[0].text, 'const a = 1;\nconst b = 2;');
});

test('todo bloque lleva _key único', () => {
  const blocks = mdToPortable('uno\n\ndos\n\ntres');
  const keys = blocks.map((b) => b._key);
  assert.equal(new Set(keys).size, 3);
});
```

**Step 2: Ejecutar el test y verificar que falla**

Run: `node --test scripts/__tests__/md-to-portable.test.mjs`
Expected: FAIL — `Cannot find module '../md-to-portable.mjs'`

**Step 3: Implementar el conversor**

`scripts/md-to-portable.mjs` exporta `mdToPortable(markdown) -> PtBlock[]`. Requisitos:
- Parte el markdown en bloques por línea en blanco, salvo dentro de vallas ``` ```.
- Encabezados `##`/`###`/`####` → `style: h2/h3/h4`. `#` no se usa (el título ya va en el campo `title`).
- `> ` → `blockquote`. `- ` → `listItem: 'bullet', level: 1`. `1. ` → `listItem: 'number', level: 1`.
- Vallas de código → un único block con `style: 'code'` y el contenido crudo en un solo span sin marks.
- Inline: `**x**` → `strong`, `*x*`/`_x_` → `em`, `` `x` `` → `code`, `[t](url)` → span con mark que apunta a un `markDefs` `{_type:'link', _key, href}`.
- `_key` generado con `crypto.randomUUID().slice(0,12)` en bloques, spans y markDefs.
- Cada block lleva siempre `markDefs: []` aunque esté vacío.

**Step 4: Ejecutar los tests y verificar que pasan**

Run: `node --test scripts/__tests__/md-to-portable.test.mjs`
Expected: PASS — 10/10

**Step 5: Commit**

```bash
git add scripts/md-to-portable.mjs scripts/__tests__/md-to-portable.test.mjs
git commit -m "feat(scripts): markdown to Portable Text converter for blog posts"
```

---

## Task 2: Post 1 — Auditoría del portfolio

**Files:**
- Create: `docs/drafts/2026-08-20-auditoria-portfolio.md`

**Step 1: Escribir el markdown**

Título: *Le hice una auditoría a mi propio portfolio y encontré 20 problemas*
Slug: `auditoria-portfolio-20-problemas` · ~2.000 palabras · español, primera persona.

Estructura obligatoria:
1. Apertura: por qué audité mi propio sitio y qué esperaba encontrar.
2. Método: cómo se hizo (leer cada ruta, recorrer las 10 páginas públicas a 375px y escritorio, `npm audit`, análisis del tamaño del build).
3. Los cinco hallazgos, cada uno con síntoma → causa → arreglo → cifra:

| Hallazgo | Cifra verificada | Commit |
|---|---|---|
| Hero PNG sin optimizar | 993 KB → 23 KB WebP (−98%) | `67b479f` |
| `nobggabo` en toda página pública | 358 KB → 45 KB (−87%) | `67b479f` |
| Sitemap sin posts | 0 de 9 → generado en build con GROQ | `f5d9807` |
| 404 colgado en "Loading post..." | `/:slug` sombreaba `*`; `OnePost` ahora separa cargando de inexistente | `bf6b1a0` |
| Badge "New" invisible | `Portfolio.tsx` no pasaba la prop a `Card` | `18f0030` |
| Chunk de recharts | 405 KB → 3 KB, `ChartCard` lazy de 411 KB | `18e765e` |

4. Cierre: checklist accionable para que el lector audite el suyo.

Reglas de contenido:
- Nada de cifras inventadas. Solo las de la tabla, que salen de los mensajes de commit.
- Al menos dos bloques de código reales del repo (el fallo del badge y el estado `notFound` de `OnePost`).
- Tono: directo, primera persona, admitiendo los errores como propios.

**Step 2: Verificar cada cifra contra git**

Run: `git show --stat 67b479f 18e765e bf6b1a0 18f0030 | head -60`
Expected: las cifras del post coinciden literalmente con los mensajes de commit.

**Step 3: Commit**

```bash
git add docs/drafts/2026-08-20-auditoria-portfolio.md
git commit -m "docs(drafts): post on auditing my own portfolio"
```

---

## Task 3: Post 2 — Programar con Claude Code

**Files:**
- Create: `docs/drafts/2026-08-20-claude-code-flujo-real.md`

**Step 1: Escribir el markdown**

Título: *Cómo programo con Claude Code: mi flujo real en un proyecto de verdad*
Slug: `como-programo-con-claude-code-flujo-real` · ~2.000 palabras.

Estructura:
1. Qué es, en tres líneas, sin marketing.
2. Mi setup: el repo, `.claude/`, los skills, cómo arranco una sesión.
3. Tres tareas reales delegadas en este mismo sitio:
   - La auditoría completa del portfolio (`docs/plans/2026-04-29-portfolio-audit.md`, 20 hallazgos en 4 áreas).
   - La migración de Express a Vercel Functions (post publicado en abril, coste a $0/mes).
   - El sitemap generado desde Sanity en `prebuild` (`scripts/generate-sitemap.mjs`).
4. Dónde falla — sección obligatoria y honesta: contexto que se pierde, cambios que hay que revisar, cuándo sale más caro que hacerlo a mano.
5. Cómo empezar mañana.

Reglas: enlazar a los posts propios ya publicados donde encaje. Nada de afirmaciones sobre precios o límites de la herramienta que no se puedan verificar.

**Step 2: Commit**

```bash
git add docs/drafts/2026-08-20-claude-code-flujo-real.md
git commit -m "docs(drafts): post on my real Claude Code workflow"
```

---

## Task 4: Post 3 — Editor propio vs Sanity Studio

**Files:**
- Create: `docs/drafts/2026-08-20-editor-propio-vs-sanity-studio.md`

**Step 1: Escribir el markdown**

Título: *Por qué construí mi propio editor de posts en vez de usar Sanity Studio*
Slug: `editor-propio-vs-sanity-studio` · ~1.800 palabras.

Estructura:
1. El problema: Studio es otro deploy, otra UI, otro login. Fricción para un blog de un solo autor.
2. Qué construí: `/admin/write` y `/admin/write/:id` con BlockNote.
3. La pieza interesante: `src/utils/blocknoteToPortable.ts` — mapeo bidireccional. Mostrar la tabla de mapeo real del propio archivo y el fallback de bloques no soportados que extrae texto plano para no perder contenido.
4. El costo admitido: el chunk del `PostEditor` pesa 1,3 MB (hallazgo D4 de la auditoría).
5. Cuándo NO hacer esto: varios autores, flujos de revisión, contenido no textual, equipos no técnicos.

Reglas: los fragmentos de código se copian literales del archivo, no se parafrasean.

**Step 2: Verificar que los fragmentos coinciden con el archivo**

Run: `grep -n "SUPPORTED\|inlineToSpans\|portableToBlocks" src/utils/blocknoteToPortable.ts`
Expected: los nombres citados en el post existen tal cual en el archivo.

**Step 3: Commit**

```bash
git add docs/drafts/2026-08-20-editor-propio-vs-sanity-studio.md
git commit -m "docs(drafts): post on building a custom editor over Sanity Studio"
```

---

## Task 5: Portadas SVG → PNG

**Files:**
- Create: `scripts/covers/auditoria.svg`, `scripts/covers/claude-code.svg`, `scripts/covers/editor.svg`
- Create: `scripts/build-covers.sh`

**Step 1: Diseñar los tres SVG a 1200×630**

Paleta del sitio: `#0F172A` (fondo slate), `#6366F1` (indigo), `#38BDF8` (sky), `#E2E8F0` (texto tenue).
Cada portada: fondo oscuro, una forma geométrica distinta por post, el título en 2-3 líneas a 64-72px, y `codewithgabo.com` abajo en sky.
Usar solo `Helvetica, Arial, sans-serif` — QuickLook no carga fuentes web.
Las tres deben distinguirse a simple vista en la parrilla de `/allpost`.

**Step 2: Rasterizar y recortar**

`scripts/build-covers.sh` hace, por cada SVG:
```bash
qlmanage -t -s 1200 -o "$OUT" "$svg"        # produce 1200x1200 con relleno
sips -c 630 1200 "$OUT/$name.svg.png" --out "$OUT/$name.png"   # recorta al centro 1200x630
```

**Step 3: Verificar dimensiones**

Run: `sips -g pixelWidth -g pixelHeight scripts/covers/out/*.png`
Expected: `pixelWidth: 1200` y `pixelHeight: 630` en los tres.

**Step 4: Revisar las portadas visualmente**

Abrir los tres PNG con la herramienta Read y confirmar que el texto se lee, no se desborda, y que las tres se distinguen entre sí. Si alguna falla, corregir el SVG y repetir.

**Step 5: Commit**

```bash
git add scripts/covers scripts/build-covers.sh
git commit -m "feat(scripts): branded SVG post covers and rasterizer"
```

---

## Task 6: Subir las portadas a Sanity

**Files:** ninguno (operación de red)

**Step 1: Subir cada PNG**

```bash
TOKEN=$(grep '^ADMIN_TOKEN=' analytics-backend/.env | cut -d= -f2-)
curl -sS -X POST "https://analytics-backend-seven.vercel.app/api/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-File-Type: image/png" \
  -H "X-File-Name: auditoria-portfolio.png" \
  --data-binary "@scripts/covers/out/auditoria.png"
```
Expected: `201` con `{"_id":"image-...","url":"https://cdn.sanity.io/..."}`

Nunca imprimir `$TOKEN`. Guardar los tres `_id` en `/tmp/.../scratchpad/asset-ids.json`.

**Step 2: Verificar que los assets existen**

Consultar por MCP `query_documents`:
`*[_id in $ids]{_id, url, mimeType, metadata{dimensions}}`
Expected: 3 resultados, `mimeType: "image/png"`, dimensiones 1200×630.

---

## Task 7: Generar los cuerpos en Portable Text

**Files:**
- Create: `scripts/build-posts.mjs`

**Step 1: Escribir el script**

Lee los tres markdown de `docs/drafts/`, les quita el bloque de metadatos de cabecera, los pasa por `mdToPortable`, y escribe `scratchpad/posts.json` con los tres payloads listos para `/api/posts`:

```js
{
  title, slug: { _type: 'slug', current },
  body,                    // Portable Text
  excerpt,                 // 2 frases, para SEO y tarjetas
  tags: [...],
  mainImage: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
  publishedAt,             // hoy, escalonado por minutos
  sponsored: false, affiliateDisclosure: false
}
```

**Step 2: Validar la salida antes de tocar la red**

Run: `node scripts/build-posts.mjs && node -e "const p=require('./scratchpad/posts.json'); ..."`
Verificar en los tres:
- Ningún bloque con `_type: 'codeBlock'` (romperían el render).
- Todo `_key` presente y único dentro de cada documento.
- Todo `markDefs[]._key` referenciado por algún span.
- `body.length > 40` bloques en cada post.
Expected: las cuatro comprobaciones pasan en los 3.

**Step 3: Commit**

```bash
git add scripts/build-posts.mjs
git commit -m "feat(scripts): build Sanity post payloads from markdown drafts"
```

---

## Task 8: PUNTO DE CONFIRMACIÓN — publicar

**No ejecutar sin un sí explícito de Gabriel en el chat.**

Publicar es una acción de cara al público. Antes de tocar `/api/posts`:
1. Resumirle los tres posts: título, slug, número de palabras, tags.
2. Enseñarle las tres portadas.
3. Preguntar si publica los tres, algunos, o ninguno.

Solo con su sí, por cada post aprobado:

```bash
curl -sS -X POST "https://analytics-backend-seven.vercel.app/api/posts" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @scratchpad/post-1.json
```
Expected: `201` con el `_id` del documento creado. `/api/posts` usa `client.create()`, así que queda publicado, sin prefijo `drafts.`.

---

## Task 9: Verificación tras publicar

**Step 1: Confirmar en el Content Lake**

MCP `query_documents`, `perspective: "published"`:
`*[_type=="post" && slug.current in $slugs]{title, "slug": slug.current, publishedAt, tags, excerpt, "img": mainImage.asset->url, "bloques": count(body)}`
Expected: 3 documentos, todos con `img` no nulo y `bloques > 40`.

**Step 2: Comprobar el render en el navegador**

Arrancar el preview y revisar:
- `/allpost` — las tres tarjetas nuevas arriba, con portada visible (nada de imagen rota).
- Los tres slugs — portada, cuerpo, encabezados y bloques de código renderizando.
- Modo claro y oscuro.

**Step 3: Capturar prueba**

Screenshot de `/allpost` y de un post abierto. Adjuntar en la respuesta final.

**Step 4: Regenerar el sitemap**

Run: `npm run prebuild && grep -c "<url>" public/sitemap.xml`
Expected: aumenta en 3 respecto al valor previo, y los tres slugs nuevos aparecen.

**Step 5: Commit**

```bash
git add public/sitemap.xml
git commit -m "chore(seo): regenerate sitemap with three new posts"
```

---

## Criterio de terminado

- [ ] Los 3 posts consultables en Sanity con `perspective: published`
- [ ] `/allpost` muestra 3 tarjetas nuevas, todas con portada
- [ ] Los 3 slugs abren y renderizan cuerpo y código
- [ ] Ningún `_type: 'codeBlock'` en ningún body
- [ ] `sitemap.xml` con los 3 slugs nuevos
- [ ] Los markdown fuente versionados en `docs/drafts/`
