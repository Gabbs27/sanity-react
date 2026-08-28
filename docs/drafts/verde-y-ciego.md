Escribí un mensaje de commit que dice que `SEO.tsx` "pone documentElement.lang" y "emite enlaces hreflang". Abrí un post en español en el navegador, miré el documento, y ahí estaba: `documentElement.lang === "es"`, y tres etiquetas `<link rel="alternate" hreflang>` para `es`, `en` y `x-default`. Idioma correcto, pares correctos, default correcto.

El mensaje de commit era exacto. El sitio también estaba sirviendo `<html lang="en">` en cada post en español, con cero anotaciones hreflang.

Las dos frases son ciertas. Pero cada una habla de una superficie distinta.

## La anotación que estaba y no estaba

Este sitio es una SPA de React 19 en Vercel con un paso de prerender en tiempo de build. El prerender escribe el `<head>` dentro del HTML estático para que los crawlers reciban títulos y meta tags sin ejecutar nada. `SEO.tsx` es un componente de React. Corre en el navegador, después de que React monta, y hace exactamente lo que dice su mensaje de commit.

`scripts/prerender.mjs` escribe el HTML que el servidor manda de verdad. En ese commit:

```
$ git show 86569b0:scripts/prerender.mjs | grep -c hreflang
0
```

El prerender reescribía solo el elemento `<head>`. Nunca tocaba la etiqueta `<html>`, así que el atributo `lang` se quedaba con lo que `index.html` traía de fábrica, que era `en`. Y no emitía ningún alternate, porque nada dentro de él sabía que la tabla de traducciones existía.

Lo confirmé con `curl` en las cuatro URLs emparejadas: original en inglés y traducción en español, en las dos direcciones. Después probé otra vez con un user-agent de Googlebot, por si Vercel estaba haciendo alguna jugada con los crawlers. Respuesta idéntica byte a byte. No había una segunda vía de entrega. El sitemap tampoco tenía alternates `xhtml:link`.

Aquí hay una trampa que vale la pena nombrar, porque es lo que deja que el error sobreviva un rato. Cada página del sitio sirve esto:

```html
<link rel="alternate" type="application/rss+xml" ...>
```

Le haces grep a `alternate` sobre el HTML servido y encuentras una coincidencia. Si estás revisando rápido, y ya estás bastante seguro de que la funcionalidad jala porque la viste funcionar, una coincidencia es suficiente. La cadena que buscaste estaba presente. Era el feed.

La consecuencia práctica es más limitada de lo que suena. Google renderiza JavaScript, así que para Google esto fue un retraso y no una pérdida. El riesgo estaba en los motores que no renderizan, que veían posts en español declarados como inglés y sin ninguna indicación de que existiera una traducción.

Arreglado el 21 de agosto. `prerender.mjs` ahora pone `lang` en el elemento `<html>` y emite los alternates, leyendo `src/config/translations.json`, el mismo archivo que lee `src/config/translations.ts`. La tabla vive en JSON porque un script de build en `.mjs` no puede importar un módulo `.ts`, y tener dos copias de ella es precisamente la forma en que las dos mitades se volverían a separar.

Verificado después: `lang="es"` en los dos posts en español, `lang="en"` en los dos en inglés, tres enlaces hreflang en cada uno de los cuatro posts emparejados, y cero en un post sin pareja como `/tailwind-css`, que es el número correcto, porque un hreflang que apunta a una traducción que no existe es una afirmación falsa.

Aquí no verifiqué lo equivocado. Verifiqué algo real en la superficie que era más fácil de alcanzar.

## El slot que ningún test estaba mirando

El segundo no se trata de revisar la superficie equivocada. No había superficie que revisar.

Cada post lleva dos unidades de anuncio: una dentro del artículo y otra al pie del post. El 20 de agosto a las 22:48 subí esta línea:

```js
setStatus(ins.getAttribute('data-ad-status') ?? 'no-response');
```

Tres segundos después del montaje, si AdSense no había escrito un veredicto sobre el elemento, el código se inventaba uno. El CSS colapsaba el contenedor en `no-response`, así que el slot pasaba a `display: none`, mientras AdSense todavía lo estaba midiendo. No se puede colocar un anuncio dentro de una caja oculta y de ancho cero. La suposición se cumplía sola.

Eso estuvo en producción unas diez horas. El arreglo, a las 08:46 de la mañana siguiente, quitó el timeout por completo: solo el veredicto propio de AdSense cambia el estado, y un veredicto ausente significa "pending", que reserva espacio en vez de colapsarlo.

Eso metió el mismo bug, pero al revés.

En producción, la unidad del final del post llega a `data-adsbygoogle-status="done"` y después nunca recibe `data-ad-status`. Con la regla nueva, "nunca" es indistinguible de "todavía no". Se quedaba en `pending` permanentemente. Medido en un navegador real el 23 de agosto, en /portfolio-audit-20-problems, los dos slots en el mismo momento:

```
slot 9344511662  (end of post)
  data-adsbygoogle-status   "done"
  data-ad-status            null
  iframes                   0
  height                    303px
  display                   block
  "Advertisement" label     visible

slot 2970675007  (in-article)
  data-adsbygoogle-status   "done"
  data-ad-status            "unfilled"
  height                    0px
  display                   none
```

Misma página, misma carga. La asimetría estaba en mi máquina de estados, no en AdSense.

Así que durante dos días y medio, cada post de este sitio terminaba con un rectángulo vacío etiquetado "Advertisement", de 303 píxeles de alto en la página que medí. Nada estaba en rojo. Ningún test falló. El build pasó, la página renderizó.

El arreglo de verdad: el periodo de gracia ahora empieza solo cuando el propio AdSense reporta `done`, y el observer se queda escuchando después para que un veredicto tardío igual gane. También lee el atributo una vez, de inmediato, al engancharse, porque un `MutationObserver` no te dice nada de lo que pasó antes de que llamaras a `observe()`. Verificado después: los dos slots en 0px, `display: none`.

## Verde porque nadie pregunta

Los dos fallos no tienen la misma forma.

En el caso del hreflang había un check, y estaba mirando el DOM del navegador en vez del cuerpo de la respuesta. Superficie equivocada, error honesto, encontrable.

En el caso del anuncio no había check. No uno débil: ninguno. Y desde afuera, "no hay check" y "el check pasó" producen una señal idéntica: un build que se pone verde. La ausencia de un test que falla se ve exactamente igual que la presencia de uno que pasa cuando lo único que puedes ver es el color. Un assert que falta no se anuncia. Uno roto sí.

Por eso la caja vacía duró dos días y medio y el bug del hreflang duró hasta que se me ocurrió correr `curl`.

## El hilo del que salió esto

Escribo esto por un comentario. En el cross-post de dev.to de "How I Actually Code with Claude Code", Heinrich Neb lo dijo mejor de lo que yo puedo: un check puede estar verde y ciego. Su ejemplo era un test que afirmaba que un número de benchmark aparecía en la salida de su servidor, y el número era una cadena escrita a mano. El check vigilaba la frase, no la medición. Se quedó verde durante semanas. Debashish Ghosal, en el mismo hilo, sugirió escribir una nota de resultado en cada archivo de plan después de ejecutarlo, que es otra manera de atacar el mismo problema: que el registro diga lo que pasó, no lo que se pretendía.

No tengo una solución general. No voy a terminar esto con una filosofía de testing, porque me la estaría inventando en el momento para que el post parezca terminado.

Lo que sí tengo es una costumbre: abrir un navegador, buscar el elemento específico y medirlo. No la idea que el framework tiene del elemento: el elemento. Hacerle `curl` a la URL en vez de confiar en el componente que escribe la etiqueta. Leer la altura de la caja en vez de confiar en el estado que decide la altura.

Así fue como aparecieron los dos: uno a la vez, a mano, porque se me ocurrió mirar. No habría encontrado un tercero.
