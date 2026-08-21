---
title: Por qué construí mi propio editor de posts en vez de usar Sanity Studio
slug: editor-propio-vs-sanity-studio
tags: Sanity, React, BlockNote, Portable Text, TypeScript
excerpt: Sanity ya me daba un editor gratis, mantenido y con más funciones que el mío. Construí otro igualmente. Esta es la decisión, el código del conversor, y el precio que pagué por ella.
---

Sanity viene con Studio, un editor de contenido completo, mantenido por gente que sabe más que yo del tema, gratis y ya integrado con mi esquema. Y aun así escribí el mío.

Esto normalmente es mala señal. La mayoría de las veces que un desarrollador reconstruye algo que ya existía, la respuesta honesta es "porque me apetecía". Así que déjame defender la decisión con argumentos, enseñar el código de la parte interesante, y admitir lo que me costó. Al final hay una sección de cuándo **no** deberías hacer esto, que es probablemente la más útil.

## El problema no era el editor

Studio es bueno. El problema nunca fue la calidad del editor.

El problema era que publicar en mi propio blog requería salir de mi propio sitio. Studio corre aparte, con su propio despliegue, su propia interfaz y su propia sesión. Para escribir un post: abrir otra aplicación, entrar otra vez, escribir en una interfaz que no se parece en nada al sitio donde va a salir el texto, publicar, y volver a mi sitio a comprobar cómo quedó.

Para un equipo de contenido con varios autores, revisiones y permisos, ese es exactamente el producto correcto. Para **un blog de un solo autor que además es el desarrollador**, es fricción sin contrapartida. Y la fricción en publicar tiene un efecto muy medible: publicas menos.

Ya tenía sesión de administrador en mi sitio, un panel en `/admin`, y un backend con permisos de escritura sobre Sanity. Faltaba una pantalla.

## Qué construí

Dos rutas:

- `/admin/write` para un post nuevo
- `/admin/write/:id` para editar uno existente

Dentro, un editor de bloques con BlockNote, que da la experiencia tipo Notion que quería: menú de barra inclinada, arrastrar bloques, pegar imágenes directamente. Se conecta a mi tema claro/oscuro y a mi sesión de administrador, así que se siente parte del sitio y no un injerto.

La subida de imágenes va al mismo endpoint que ya tenía, así que pegar una imagen en el editor la sube a Sanity y devuelve el identificador del asset sin que yo salga de la pantalla.

Nada de esto es difícil. La parte difícil es otra.

## La pieza interesante: traducir entre dos formatos

Aquí está el trabajo real, y es el motivo por el que este post existe.

BlockNote guarda su contenido en su propio JSON de bloques. Sanity guarda el contenido enriquecido en **Portable Text**, que es un formato distinto con otra filosofía: en vez de HTML anidado, una lista plana de bloques donde el formato inline vive en marcas y los enlaces en definiciones separadas.

No son compatibles. Hace falta un traductor, y tiene que funcionar en las dos direcciones: al guardar, de BlockNote a Portable Text; al abrir un post existente para editarlo, de Portable Text a BlockNote.

Ese traductor vive en un archivo, `src/utils/blocknoteToPortable.ts`, y empieza declarando su propia tabla de equivalencias:

```
// Mapping table:
//   BN paragraph / heading / bulletListItem / numberedListItem  ->  PT block with style/listItem
//   BN inline content (text + styles bold/italic/code, link)    ->  PT spans with marks
//   BN image                                                    ->  PT type: image with asset reference
```

La conversión de formato inline es la parte que más se piensa. En BlockNote, un fragmento de texto lleva un objeto `styles` con banderas booleanas. En Portable Text, lleva un array de marcas con nombres:

```
if (styles.bold) marks.push('strong');
if (styles.italic) marks.push('em');
if (styles.code) marks.push('code');
```

Los enlaces son más sutiles, porque Portable Text no guarda la URL en el span. Guarda una definición aparte con una clave, y el span solo lleva esa clave entre sus marcas. Hay que generar la clave, registrar la definición, y luego pegársela a cada hijo del enlace:

```
const linkKey = makeKey();
markDefs.push({ _type: 'link', _key: linkKey, href: node.href });
const inner = inlineToSpans(node.content || []);
for (const span of inner.spans) {
  span.marks = [...(span.marks || []), linkKey];
  spans.push(span);
}
```

## La lección que me costó datos: nunca pierdas contenido

La primera versión hacía lo obvio con los tipos de bloque que no soportaba: ignorarlos.

Eso significa que si pegabas una tabla, o un archivo incrustado, y guardabas, ese contenido **desaparecía en silencio**. Sin aviso, sin error. Escribías algo, le dabas a guardar, y ya no estaba.

La versión actual, cuando encuentra un bloque que no sabe traducir, hace el mejor esfuerzo por rescatar el texto plano antes de rendirse:

```
// Unsupported block types (table, embed, file, audio, video, etc.) -
// best-effort extract plain text so content isn't lost on save.
if (block.type && !SUPPORTED.has(block.type)) {
  const fallback = Array.isArray(block.content)
    ? block.content
        .map((n) => (typeof n?.text === 'string' ? n.text : ''))
        .join('')
    : '';
```

El resultado queda feo: una tabla se convierte en un párrafo de texto corrido. Pero feo y recuperable es infinitamente mejor que limpio y perdido. Puedo arreglar un párrafo feo. No puedo recuperar un texto que se borró sin avisar.

Hay una defensa parecida en el manejo de contenido inline, con un comentario que documenta por qué existe:

```
// Some BlockNote versions return objects we can't iterate (e.g. for table
// cells, embeds). Skip rather than throw "T is not iterable".
```

Ese comentario es el resumen de una tarde entera. Lo dejé escrito para no repetirla.

**Si escribes un conversor entre dos formatos de contenido, esta es la regla:** cuando no sepas qué hacer con algo, degrada. Nunca descartes. El contenido del usuario, aunque el usuario seas tú, no es tuyo para perderlo.

## El precio

Toca ser honesto con los costes, porque son reales.

Cuando audité este sitio, uno de los hallazgos fue que **el chunk del `PostEditor` pesa 1,3 MB**. BlockNote más Mantine no son ligeros. Es tanto que dispara el aviso de tamaño de chunk de Vite en cada build.

El atenuante es que la ruta se carga de forma diferida, así que solo lo paga quien entra a `/admin/write`, que soy yo. Ningún visitante del blog descarga un solo byte de eso. Por eso quedó como prioridad baja y sigue ahí.

Pero el coste real no es el megabyte. Es que **ahora ese conversor es mío**. Cuando BlockNote cambie su formato de bloques en una versión mayor, el problema es mío. Cuando aparezca un caso raro de Portable Text que no contemplé, lo arreglo yo. Studio no me habría cobrado nada de eso nunca.

Escribir el código es la parte barata. Mantenerlo es la factura, y llega en cuotas.

## Cuándo NO deberías hacer esto

Con lo que sé ahora, usa Studio y no mires atrás si te reconoces en algo de esto:

- **Hay más de un autor.** En cuanto necesitas permisos, roles o saber quién cambió qué, estás reimplementando un producto entero, no una pantalla.
- **Hay revisión editorial.** Borradores, estados, programación de publicaciones, historial de versiones. Studio te da todo eso; tú no lo vas a construir en un fin de semana.
- **Tu contenido no es sobre todo texto.** Si tus documentos tienen referencias cruzadas, objetos anidados o campos complejos, los editores de Studio ya resuelven eso y a ti te tocaría inventarlo.
- **Quien escribe no eres tú.** Si el editor lo va a usar alguien no técnico, la interfaz pulida y mantenida vale mucho más que la integración con tu tema.
- **Tu fricción para publicar no es el problema.** Si publicas de forma constante y el cambio de contexto no te frena, no tienes el problema que esto resuelve. No construyas la solución.

Mi caso cumplía justo lo contrario: un autor, sin revisión, contenido casi todo texto, y una fricción para publicar que se notaba en la cadencia. Por eso salió a cuenta.

## Lo que haría igual

Volvería a construirlo. Pero la razón importa: no lo construí porque Studio fuera malo, sino porque mi problema no era el editor, era el cambio de contexto. Y ese, ninguna mejora de Studio me lo iba a quitar.

Antes de reconstruir algo que ya existe, la pregunta útil no es "¿puedo hacerlo mejor?". Casi siempre la respuesta es no. La pregunta es **"¿es mi problema el que esta herramienta resuelve?"**. Si no lo es, ninguna cantidad de calidad ajena te va a servir.

Ahora escribo un post desde el mismo sitio donde se publica, con mi tema, con mi sesión, sin cambiar de aplicación. Ese era el objetivo entero. Todo lo demás fue el precio.
