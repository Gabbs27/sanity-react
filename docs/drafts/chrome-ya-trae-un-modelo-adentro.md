Casi escribo otro post.

Iba a ser sobre el Prompt API: Gemini Nano corriendo dentro de Chrome, sin servidor, sin llave de API, sin costo por token. Lo leí en varios sitios y todos decían lo mismo, que Chrome 148 lo dejó estable. Chrome 148 salió estable el 5 de mayo de 2026, así que la fecha cuadraba.

Fui a la tabla de estado de la documentación oficial antes de escribir. Dice otra cosa.

- **Translator** — estable, desde Chrome 138
- **Language Detector** — estable, desde Chrome 138
- **Summarizer** — estable, desde Chrome 138
- **Prompt API en extensiones** — estable, desde Chrome 138
- **Prompt API en la web** — origin trial, Chrome 148
- **Writer, Rewriter y Proofreader** — developer trial, sin publicar

Ahí está la línea que se les perdió a los titulares. El Prompt API está estable **para extensiones**. Para una página web es un origin trial, que es otra cosa: te registras, te dan un token para tu dominio, y se vence.

Lo interesante es lo que apareció cuando fui a comprobar eso: hay tres APIs de IA que llevan estables desde Chrome 138, que sí puedes usar hoy en una página normal, y de las que casi nadie está escribiendo.

## Lo que sí puedes mandar a producción hoy

Traducción, sin servidor:

```js
if ('Translator' in self) {
  // El API existe en este navegador.
}

const disponible = await Translator.availability({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});

const translator = await Translator.create({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});

await translator.translate('¿Dónde queda la próxima parada, por favor?');
```

Resumen, también sin servidor:

```js
const summarizer = await Summarizer.create({
  type: 'key-points',   // o 'tldr', 'teaser', 'headline'
  format: 'markdown',   // o 'plain-text'
  length: 'short',      // o 'medium', 'long'
});

await summarizer.summarize(textoLargo, { context: 'Para un lector apurado' });
```

Y hay versión en streaming, que para un resumen largo es la diferencia entre una pantalla congelada y texto apareciendo:

```js
for await (const chunk of summarizer.summarizeStreaming(textoLargo)) {
  salida.textContent += chunk;
}
```

El tercero es Language Detector, que hace exactamente lo que dice el nombre y es el que le falta a casi todo formulario de contacto multilingüe.

Ninguno de estos tres manda nada a ningún servidor. El texto del usuario no sale de su computadora.

## `availability()` tiene cuatro estados, no dos

Acá está la parte que hace que esto no se parezca a llamar una API normal. El modelo no viene con el navegador: se descarga a la máquina de quien te visita. Así que la pregunta "¿está disponible?" tiene cuatro respuestas posibles, no dos:

- `"unavailable"` — este equipo no puede
- `"downloadable"` — puede, pero todavía no lo bajó
- `"downloading"` — lo está bajando ahora mismo
- `"available"` — listo

Si tratas ese resultado como un booleano, el caso `downloadable` se te convierte en un spinner eterno. Hay que pedir la descarga y mostrar su progreso:

```js
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Descargado ${e.loaded * 100}%`);
    });
  },
});
```

Ese `downloadprogress` no es un detalle de lujo. Es la única forma que tienes de decirle a alguien por qué su navegador lleva dos minutos sin responderte.

## El costo que no sale en los titulares

Esto es lo que hay que saber antes de emocionarse, y sale de la misma documentación:

- **Sistemas:** Windows 10 u 11, macOS 13 o superior, Linux, o ChromeOS en Chromebook Plus.
- **Espacio libre:** 22 GB como mínimo.
- **Hardware:** más de 4 GB de VRAM en la GPU, o 16 GB de RAM y 4 núcleos de CPU.
- **Conexión:** sin límite de datos o no medida.
- **Móvil:** no. La documentación del Translator lo dice directo — estas APIs no funcionan en dispositivos móviles.

Súmalo: una laptop de 8 GB de RAM sin GPU decente queda fuera. Un celular queda fuera, y el celular es la mitad de tu tráfico o más.

También hay detalles finos. El Summarizer exige activación del usuario antes de inicializarse — no lo puedes arrancar solo porque cargó la página — y soporta inglés, japonés, español, alemán y francés. El Translator cubre más de 40 idiomas. Y fuera de Chrome, el Translator funciona en Edge 148; Firefox y Safari no lo tienen.

## Entonces, ¿sirve o no?

Sirve, con una condición: **nunca puede ser el único camino.**

La forma correcta es mejora progresiva. Tu resumen se hace en el servidor, o sencillamente no se hace y muestras el texto completo. Si el navegador resulta traer el modelo, se hace ahí: gratis, instantáneo y sin que el texto de tu usuario salga de su máquina. Si no, nadie se entera de que existía esa rama.

Eso da vuelta la economía de ciertas funciones. Un resumen por artículo cuesta tokens en un servidor y cero en el cliente. Una traducción de la interfaz cuesta una llamada por idioma, o cero. Y el argumento de privacidad es real y verificable: no hay petición de red que interceptar porque no hay petición de red.

## Y el Prompt API

Cuando llegue, es el grande. Acepta texto, imagen y audio de entrada, y —esto es lo que lo hace utilizable de verdad— permite restringir la salida a una expresión regular o a un esquema JSON. Ese es el problema que hace que integrar un modelo en código sea doloroso: no que se equivoque, sino que devuelva algo que tu parser no espera. Chrome 148 además agregó, también en origin trial, los parámetros de muestreo `temperature` y `topK`.

La sesión se maneja así:

```js
const session = await LanguageModel.create();
const texto = await session.prompt('Escríbeme un poema');

const stream = session.promptStreaming('Escríbeme un poema largo');
for await (const chunk of stream) { console.log(chunk); }

session.destroy();
```

Y tiene ventana de contexto, que se consulta con `session.contextUsage` contra `session.contextWindow`. Cuando se llena, se van botando los intercambios más viejos, menos el prompt de sistema. Si de plano no cabe, tira un `QuotaExceededError` que trae `requested` y `contextWindow`, para que sepas por cuánto te pasaste.

Todo eso es real y está documentado. Lo que no es, todavía, es estable en la web.

## Lo que me llevo

El dato que cambió este post no fue técnico. Fue que la palabra "estable" tiene un alcance, y el alcance no viene pegado a la palabra.

"El Prompt API está estable en Chrome 138" es cierto. Es cierto para extensiones. Para una página web es un origin trial, y la diferencia entre las dos cosas es si puedes construir un producto encima o no.

La tabla que aclara eso está a un clic de todos los artículos que leí. Lo barato no era averiguarlo. Lo barato era repetirlo.

**Fuentes:** [Built-in AI APIs — Chrome for Developers](https://developer.chrome.com/docs/ai/built-in-apis) · [Translator API](https://developer.chrome.com/docs/ai/translator-api) · [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api) · [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) · [Chrome 148 release notes](https://developer.chrome.com/release-notes/148)
