Hay una categoría de código que nadie revisa nunca: el truco que escribiste hace tres años porque CSS no podía hacer algo, y que sigue ahí porque tú sigues creyendo que CSS no puede hacerlo.

Esa creencia tiene fecha de caducidad y nadie te avisa cuando se vence.

Cuatro de esos trucos se vencieron este año. Los cuatro son Baseline *newly available*, que quiere decir que funcionan en las versiones actuales de Chrome, Edge, Firefox y Safari, en escritorio y en móvil. No quiere decir que funcionen en el celular viejo de tu tía — eso sigue siendo decisión tuya — pero sí quiere decir que ya es una fecha que puedes mirar, en vez de una corazonada.

## 1. `contrast-color()` borra tu función de luminancia

Si alguna vez dejaste que el usuario escogiera un color, escribiste esto o algo parecido:

```js
function contrastColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return L > 0.179 ? '#000' : '#fff';
}
```

Y después tuviste que meter el resultado en una variable CSS desde JavaScript, lo que significa que el color del texto de tu botón ahora depende de que un script haya corrido. Todo eso para decidir entre blanco y negro.

Ahora es una línea de CSS:

```css
.boton {
  background: var(--color-usuario);
  color: contrast-color(var(--color-usuario));
}
```

`contrast-color()` recibe cualquier color y devuelve blanco o negro, el que más contraste haga contra él. Si los dos empatan, devuelve blanco. La función apunta al mínimo AA de WCAG, que son 4.5:1, y los navegadores pueden usar algoritmos mejores.

Está disponible desde abril de 2026.

Ojo con lo que **no** hace: devuelve blanco o negro, nada más. Si tu marca exige un gris específico o un azul oscuro, esto no te sirve. Resuelve el caso común, que es exactamente el caso donde uno se cansa y pone blanco fijo.

## 2. `@scope` borra la disciplina de nombrar clases

El problema de siempre: quieres estilar las imágenes de un bloque, pero no las que están dentro de un `figure` adentro de ese bloque. La solución histórica fue no anidar nunca y bautizar cada cosa con una convención que todo el equipo tenía que recordar.

```css
@scope (.feature) to (figure) {
  img {
    border: 5px solid black;
    background-color: goldenrod;
  }
}
```

Eso se llama *donut scope*: la raíz `.feature` marca el borde de arriba, incluido; el límite `figure` marca el de abajo, excluido. Todo lo que quede entre los dos recibe el estilo, y lo de adentro del `figure` no.

Lo interesante no es la sintaxis, es qué elimina. BEM y compañía existen porque el alcance de un selector no se podía declarar, así que había que codificarlo en el nombre. Ahora se declara.

Baseline desde marzo de 2026.

## 3. Las style queries borran la clase que solo existía para avisar

Esta es la más nueva de las cuatro — Baseline en mayo de 2026 — y es la que menos gente conoce.

Las container queries que todo el mundo usa preguntan por tamaño. Las style queries preguntan por el valor de una propiedad personalizada del contenedor:

```css
@property --theme {
  syntax: "<color>";
  inherits: true;
  initial-value: red;
}

@container style(--theme: red) {
  output { font-weight: bold; }
}

@container style(--theme: green) or style(--theme: blue) {
  output { color: var(--theme); }
}
```

Acepta `not`, `and` y `or`, así que puedes combinar condiciones.

El detalle que hace que valga la pena: **no hace falta poner `container-type`.** Cualquier elemento sirve de contenedor de estilo. El valor por defecto, `container-type: normal`, evita que sea contenedor de tamaño pero lo deja funcionar como contenedor de estilo.

Lo que borra: esa clase `.tema-oscuro` que ponías en el padre únicamente para que los hijos supieran en qué modo estaban, duplicando una información que ya vivía en una variable CSS dos líneas más arriba.

## 4. `:open` borra el listener

```css
details:open summary {
  border-bottom: 1px solid currentColor;
}
```

Antes eso era un `addEventListener('toggle')` que ponía o quitaba una clase. Un listener, una clase, y un bug esperando el día que alguien abriera el `details` por otro camino.

`:open` empata con los elementos que tienen estado abierto mientras están abiertos. Baseline desde mayo de 2026.

En el mismo lote llegó `ToggleEvent.source`, que te devuelve el elemento de control que disparó el toggle de un popover — que es la pregunta que uno siempre termina respondiendo con una variable global.

## Lo que también se movió, por si acaso

- `lh` y `rlh` como unidades de longitud: `lh` es el line-height calculado del elemento, `rlh` el del elemento raíz. Ya son *widely available*.
- `:user-invalid`, que solo empata con un campo inválido **después** de que el usuario lo tocó. El fin de los formularios que te gritan en rojo antes de que escribas la primera letra.
- `clip-path` y `Navigator.userActivation`, ambos ya widely available.
- `text-decoration-skip-ink: all`, para forzar que el subrayado esquive todos los glifos.
- `SharedWorker`, accesible desde varias pestañas o iframes a la vez.

## La parte honesta

*Newly available* no significa "seguro para todo tu tráfico". Significa que funciona en las versiones actuales de los cuatro navegadores grandes, y que puede no funcionar en dispositivos o navegadores viejos. Quién usa tu sitio lo dicen tus analíticas, no un artículo.

Pero esa no era la pregunta. La pregunta era si el truco que llevas cargando todavía hace falta, y esa sí tiene respuesta: una línea en MDN, con mes y año.

Vale la pena leer esa línea antes de escribir la próxima función de luminancia. Ya la escribiste una vez.

**Fuentes:** [contrast-color() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color) · [@scope — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) · [Container size and style queries — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries) · [Baseline monthly digest, mayo 2026 — web.dev](https://web.dev/blog/baseline-digest-may-2026)
