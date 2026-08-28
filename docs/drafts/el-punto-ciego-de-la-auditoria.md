Publiqué un post que se llamaba "Le hice una auditoría a mi propio portfolio y encontré 20 problemas". Era un inventario: recorrí mi propio sitio —una SPA de React 19 + Vite con Sanity como CMS—, anoté todo lo que estaba mal, arreglé lo que importaba y puse los números de antes y después al lado de cada punto. Si no lo has leído, la única parte que importa aquí es la metodología, y una línea de ella en particular:

> Analicé el tamaño del build, chunk por chunk, en `build/assets/`.

Lo llamé el paso que más duele y el que más gente se salta. Sigo pensando que es verdad. También es el paso que garantizó que se me escapara el problema más grande que tenía el sitio.

## El paso que funcionó

Pesar la salida del build funcionó exactamente como prometía. El hallazgo 1 de esa auditoría fue un PNG sin optimizar de una ilustración de desarrollador en `/gabriel-abreu`, mi página de contacto, 993 KB, servidos a cada visitante que caía ahí. Quedó en 23 KB. Una segunda imagen, el recorte mío que aparece en las tres variantes del componente `Greeting`, pasó de 358 KB a 45 KB.

Esas dos son assets empaquetados. Un componente importa una:

```tsx
import p from "../assets/developer-illustration.webp";
```

Vite sigue esa importación, le pone un hash al archivo y lo emite en `build/assets/`. Después del build es un archivo en disco con un tamaño. Listar el directorio lo encuentra. Ordenar el listado por tamaño lo encuentra de primero. No hay forma de servirlo sin que aparezca en ese paso.

Así que el método era sólido dentro de su dominio: esas dos imágenes son assets empaquetados, y el paso encontró las dos.

El 23 de agosto abrí el índice del blog en un navegador y miré lo que pedía de verdad. Dieciséis portadas de posts, 9.88 MB.

Nada de eso podía haber aparecido en la auditoría. No porque ese día estuviera descuidado, sino por el lugar del que vienen esos bytes.

## Dos ciclos de vida

Un asset empaquetado existe en tiempo de build. Una importación lo convierte en entrada del build, el bundler lo convierte en salida del build, y cualquier cosa que lea la salida del build lo ve.

Una imagen del CMS nunca es una entrada del build. Nadie la importa. Llega como un string en el resultado de una consulta, después de que la página ya cargó. Esta es la consulta que alimenta el índice del blog:

```groq
*[_type == "post"] | order(publishedAt desc){
  title,
  slug,
  mainImage{ asset->{ _id, url } },
  publishedAt
}
```

Eso corre en un `useEffect` después del montaje. La `url` que regresa apunta a `cdn.sanity.io`, React la mete en un `img src`, y el navegador la baja de un CDN que yo no construyo. En ningún momento del ciclo de vida de esa imagen aterriza un archivo en `build/assets/`.

Dos ciclos de vida distintos, y el paso más riguroso de mi auditoría solo podía observar uno de ellos. No "no lo observó de casualidad". No podía, por diseño. La balanza estaba bien. No estaba pesando toda la carga.

## Lo que de verdad había en la página

Cuando medí con el Accept header real de un navegador en vez de con un listado de directorio:

```
/allpost, 16 post covers ........ 9.88 MB
one post page, 4 images ......... 4.54 MB
peor imagen suelta .............. 3.13 MB  (PNG 2160x2700, mostrada a ~250px)
another cover ................... 2.27 MB  (rendered at 433x227)
```

Las dos imágenes que atrapó la auditoría sumaban 1,351 KB entre las dos. Una sola ruta estaba sirviendo 9.88 MB.

Todos mis cross-posts en dev.to cierran con un enlace a `/allpost`. La ruta más pesada que medí era la página a la que mando a la gente.

## `urlFor` se llamaba una sola vez

Sanity trae un builder de URLs de imagen, `urlFor`, que aplica transformaciones en el CDN: ancho, fit, formato. Antes del arreglo, `urlFor` se llamaba exactamente una vez en toda la aplicación. No una vez por componente. Una. Estaba en `OnePost.tsx`, dentro del serializador de PortableText para las imágenes incrustadas en el cuerpo de un artículo:

```tsx
const src = value?.asset
  ? urlFor(value).width(1600).fit("max").auto("format").url()
  : value?.url;
```

Ancho topado, `fit: max` para que nada se escale hacia arriba, `auto: format` para que los navegadores modernos reciban WebP. Esa es la llamada correcta. Vale para las imágenes que un autor soltó en medio de un párrafo, las que un lector casi ni nota.

`AllPosts.tsx` no tenía ni una sola referencia a él. El encabezado del post tampoco. Esas tarjetas renderizaban `mainImage.asset.url` —el archivo original subido, directo del CDN— y dejaban que el CSS lo encogiera dentro de una caja de 250px. El navegador se baja los 3.13 MB completos primero y después lo pinta pequeño.

El sitio se veía como uno que servía sus imágenes del tamaño correcto. No lo era.

## El arreglo

Las consultas que alimentan esas tarjetas proyectan `asset->{url}`, no el objeto de referencia que `urlFor` quiere, así que pasar por el constructor significaba reescribir las consultas. En vez de eso, el helper toma la URL que la consulta ya devuelve:

```ts
export function sizedImage(url: string | undefined | null, width: number): string {
  if (!url) return "";
  // Non-Sanity URLs (the BlockNote editor stores upload-endpoint URLs directly)
  // do not understand these parameters.
  if (!url.includes("cdn.sanity.io")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${width}&fit=max&auto=format&q=75`;
}
```

`auto=format` negocia según el Accept header de la petición, así que un navegador moderno recibe WebP y uno viejo recibe el formato original. `fit=max` solo escala hacia abajo, así que un original pequeño nunca se agranda. El chequeo de `cdn.sanity.io` está ahí porque mi editor BlockNote guarda directamente URLs del endpoint de subida y esas no entienden los parámetros: agregárselos habría roto imágenes que estaban funcionando.

Medidas otra vez de la misma manera, esas dieciséis portadas sumaron 182 KB, 56 veces menos que antes. El PNG de 2160x2700 pesa 24 KB.

Ese es el número de esas imágenes en esas rutas, medido con un navegador y en un solo día. No he medido el tiempo de carga en una conexión real, y no te voy a decir que ahora el sitio es rápido.

## El alcance es la afirmación que no audité

Una auditoría contesta la pregunta que le hagas, y nada más. La mía preguntaba: ¿qué pesa mucho dentro de lo que sirvo? La respuesta era correcta.

Pero "lo que sirvo" es una frontera que dibuja el bundler, y el navegador no sabe que esa frontera existe. Pide lo que la página le dice que pida, venga de donde venga. Mi método trataba un artefacto de build como sustituto de una carga de página, y en un sitio como este esas dos cosas se traslapan sin ser el mismo conjunto.

Lo que hacía que ese paso se sintiera riguroso es lo mismo que lo hacía estrecho: era mecánico. Un directorio, una lista de archivos, tamaños, ordenados. Una medición que puede ser exhaustiva es exhaustiva sobre su propio dominio y muda sobre todo lo demás, y no parece incompleta: parece terminada. Veinte hallazgos, todos reales, y 9.88 MB saliendo todavía por la ruta que anuncio.

La lista de hallazgos es la parte de una auditoría que sí se revisa. El alcance también es una afirmación —una afirmación sobre dónde pueden estar los problemas— y es la que sale sin examinar. La próxima vez voy a escribir esa afirmación al lado del método, en el mismo documento: esto fue lo que medí, y esto es lo que esta medición no puede ver.
