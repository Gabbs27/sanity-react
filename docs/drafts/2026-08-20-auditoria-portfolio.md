---
title: Le hice una auditoría a mi propio portfolio y encontré 20 problemas
slug: auditoria-portfolio-20-problemas
tags: Auditoría, Performance, SEO, React, Vite
excerpt: Auditar el sitio de otro es fácil. Auditar el tuyo, cuando llevas dos años defendiendo cada decisión, es otra cosa. Encontré 20 problemas, y cinco me dolieron de verdad.
---

Auditar el sitio de otra persona es fácil. Abres las herramientas de desarrollo, señalas lo que está mal, cobras y te vas. Auditar el tuyo es otra cosa, porque cada decisión mala la tomaste tú, normalmente un martes a las once de la noche, y llevas meses convencido de que estaba bien.

Eso hice con codewithgabo.com: senté a revisarlo como si fuera de un cliente. Sin excusas, sin "eso lo arreglo después". Salieron **20 hallazgos** repartidos en cuatro áreas. Cinco me dolieron de verdad.

Este post es la lista honesta: qué encontré, por qué pasó, y qué número cambió al arreglarlo.

## Cómo audité

No hay magia. El método fue aburrido a propósito, porque lo aburrido es lo que encuentra cosas:

- Leí **cada componente público** y cada definición de ruta en `src/`.
- Recorrí las **10 rutas públicas** en el navegador, a 375px y en escritorio, anotando el `h1` de cada una, el número de caracteres, los enlaces internos y las imágenes rotas.
- Consulté Sanity para contar posts y palabras reales, no las que yo creía tener.
- Corrí `npm audit` y `npm outdated`.
- Analicé el tamaño del build, chunk por chunk, en `build/assets/`.

Ese último paso es el que más duele y el que más gente se salta. Mirar el peso real de lo que sirves es como pesarte después de las fiestas: sabes que va a estar mal, pero necesitas el número.

## Hallazgo 1: una ilustración de 993 KB

El peor. En `/gabriel-abreu` servía una ilustración de desarrollador en PNG sin optimizar. **993 KB.** Casi un megabyte para un dibujo decorativo.

Y no era el único. `nobggabo.png` pesaba 358 KB y se cargaba en **todas** las páginas públicas, porque lo importan las tres variantes del componente `Greeting` que uso en el inicio, en los posts y en los repositorios. Cada navegación pagaba esos 358 KB otra vez.

La solución no tiene ningún mérito técnico: convertir a WebP con calidad 80.

```
developer-illustration:  993 KB  ->  23 KB   (-98%)
nobggabo:                358 KB  ->  45 KB   (-87%)
```

Un 98%. Casi un megabyte por un dibujo que se ve exactamente igual. El mérito no está en la conversión, está en haberme molestado en mirar.

**La lección:** si no has revisado el peso de tus imágenes, ese es tu problema más grande ahora mismo. Estadísticamente, lo es.

## Hallazgo 2: el sitemap no tenía ni un solo post

Tenía 9 posts publicados. Mi `sitemap.xml` listaba **7 páginas estáticas y cero posts**. Las fechas de `lastmod`, además, estaban congeladas meses atrás.

O sea: llevaba tiempo escribiendo contenido y luego no se lo enseñaba a Google. Todo el trabajo de escribir, ninguno del de distribuir.

El problema de fondo era que el sitemap era un archivo estático que había que actualizar a mano. Y a mano significa nunca.

Ahora se genera en tiempo de build, con una consulta GROQ a Sanity, corriendo como `prebuild`:

```
*[_type=="post" && !(_id in path("drafts.**")) && defined(slug.current)]{
  "slug": slug.current,
  _updatedAt
}
```

Cada `npm run build` escribe un `sitemap.xml` fresco, con todos los posts y con fechas reales. Ya no depende de que yo me acuerde.

**La lección:** cualquier cosa que dependa de tu memoria, ya está rota. Solo que todavía no lo sabes.

## Hallazgo 3: mi página 404 no existía en la práctica

Este es el que más vergüenza me da, porque era un bug de verdad, no un descuido.

Si entrabas a `codewithgabo.com/cualquier-cosa`, el sitio se quedaba colgado para siempre en **"Loading post..."**. No mostraba un 404. No mostraba un error. Se quedaba ahí, girando, hasta que te aburrías y cerrabas la pestaña.

La causa: mi ruta comodín de posts, `/:slug`, capturaba cualquier URL desconocida antes de que llegara a la ruta `*` del componente `NotFound`. `OnePost` consultaba Sanity, no recibía nada, y como no distinguía entre "todavía cargando" y "esto no existe", se quedaba en el estado de carga eternamente.

El arreglo fue separar esos dos estados:

```
const [postData, setPostData] = useState<SanityPostData | null>(null);
const [notFound, setNotFound] = useState(false);

// ...

if (notFound) return <NotFound />;
if (!postData) return <LoadingSpinner message="Loading post..." />;
```

Tres líneas. Un `useState` más y dos returns en el orden correcto. Ese era el arreglo de un bug que llevaba meses echando visitantes del sitio en silencio.

Aproveché para darle a la página 404 un diseño real: el número grande, un encabezado bilingüe, y tres botones que llevan a algún sitio útil en vez de dejarte tirado.

**La lección:** un estado de carga que nunca termina se ve igual que "lento". Por eso nadie lo reporta.

## Hallazgo 4: una funcionalidad que llevaba meses sin renderizarse

En `data.ts` tengo tres proyectos marcados con `badge: "New"`: Analytics Dashboard, NegocioRD y A2C International. El componente `Card` acepta la prop `badge` y la renderiza como una pastilla.

La pastilla no aparecía nunca. Ni una sola vez.

¿Por qué? Porque `Portfolio.tsx` desestructuraba `image`, `title`, `description`, `url` y `languages` de cada proyecto... y se olvidaba de pasar `badge`. El dato existía. El componente que lo renderiza existía. Simplemente nadie los presentó.

```
  description={project.description}
  url={project.url}
  languages={project.languages}
+ badge={project.badge}
```

**Una línea.** Escribí el dato, escribí el componente, y se me olvidó el cable entre los dos. Llevaba meses así, y nunca lo noté porque nunca miré la parrilla preguntándome "¿esto se ve como debería?". La miraba preguntándome "¿carga?".

**La lección:** revisa tu interfaz contra lo que *debería* mostrar, no contra lo que muestra. Son preguntas distintas y solo una encuentra este bug.

## Hallazgo 5: 405 KB de librería de gráficos para gente que no los quería

Tengo un dashboard de analítica en `/dashboard-demo`, público, para que se vea el trabajo. Usa recharts.

Recharts es pesado. Y estaba metido dentro del chunk que se cargaba de forma eager al entrar en la ruta. Resultado: cualquiera que abriera la demo se descargaba **405 KB** de librería de gráficos antes de decidir si le interesaba siquiera.

La solución fue envolver `ChartCard` en `React.lazy` con `Suspense`, para que recharts se convierta en su propio chunk y solo baje cuando los gráficos van a montarse de verdad:

```
antes:  useAnalyticsData chunk = 405 KB   (recharts dentro)
después: useAnalyticsData chunk =   3 KB
         ChartCard chunk        = 411 KB  (lazy)
```

De 405 KB a 3 KB en la carga inicial. La librería sigue pesando lo mismo, claro. La diferencia es *cuándo* la pagas, y quién.

**La lección:** el código dividido no hace tu aplicación más pequeña. Hace que la gente que rebota no pague por lo que no llegó a usar.

## Los otros quince

No todos eran dramáticos. Hubo seis imágenes sin usar sumando más de un megabyte muerto en el repositorio. Una vulnerabilidad moderada en una dependencia. Una página, `/education`, que existía y renderizaba contenido pero no estaba enlazada desde ninguna parte del menú. `console.log` olvidados en cinco archivos. Ninguna página de política de privacidad ni de términos.

Y también hubo cosas bien, que conviene anotar para no volverse loco: el diseño móvil estaba limpio, la densidad de contenido era buena, y la configuración de anuncios estaba correcta. Una auditoría honesta también dice qué no hay que tocar.

## Cómo auditar el tuyo

Si te animas, este es el orden por el que yo iría. Está puesto de mayor a menor retorno por hora invertida:

1. **Pesa tus imágenes.** Ordena por tamaño y mira las tres primeras. Si hay algo por encima de 200 KB, ahí tienes tu tarde.
2. **Escribe una URL que no exista** en tu propio sitio. Mira qué pasa. Cuenta hasta diez. Si sigue cargando, tienes mi hallazgo número 3.
3. **Abre tu sitemap** y cuenta las URLs. ¿Está tu contenido de verdad ahí? ¿Las fechas son reales?
4. **Mira el tamaño de los chunks del build.** Cualquier cosa por encima de 300 KB que no sea imprescindible en la primera pintura, es candidata a carga diferida.
5. **Recorre cada página preguntándote qué debería mostrar**, no si carga. Ahí es donde salen los bugs como el badge.
6. **Corre `npm audit` y `npm outdated`.** Diez segundos.
7. **Busca `console.log` en todo el proyecto.** Otros diez segundos.

Los siete pasos caben en una tarde. Yo tardé una en encontrarlos y otra en arreglar lo importante.

## Lo que de verdad aprendí

Ninguno de estos problemas era difícil. Ni uno. El arreglo más complejo fueron tres líneas; el más impactante fue convertir un PNG a WebP, algo que se hace en un comando.

No estaban ahí porque fueran difíciles. Estaban ahí porque **nunca me senté a mirar**. Construir es más divertido que revisar, así que uno sigue construyendo encima, y las cosas rotas se quedan abajo, sosteniendo el edificio con un bug de meses.

Si tienes un portfolio, un blog o un proyecto paralelo que llevas tiempo sin revisar de verdad: agenda dos horas esta semana. No para añadir nada. Solo para mirar.

Vas a encontrar tu propio PNG de 993 KB. Te lo prometo.
