Esta semana saqué Create React App de un proyecto y dejé escrito el plan para sacarlo de otro. Los dos eran de 2022 y 2023, y los dos seguían funcionando. Eso es lo engañoso: seguir funcionando y seguir siendo la forma correcta de hacerlo son cosas distintas, y entre una y otra pasaron cuatro cambios grandes en React que no se enteran solos.

Ninguno es un rumor. Los cuatro están publicados en el blog oficial, con fecha.

## 1. El compilador ya borra tu `useMemo`

**React Compiler llegó a la versión 1.0 el 7 de octubre de 2025.** No es beta, no es experimento: memoriza automáticamente componentes y hooks, funciona en React y en React Native, y se instala con Babel, Vite o Rsbuild.

Lo que eso significa en la práctica es que la mayoría de tus `useMemo` y `useCallback` dejaron de ser trabajo tuyo. Los escribías para evitar renders; el compilador hace esa optimización en tiempo de compilación, sin reescribir nada.

Hay un detalle de instalación que se come a mucha gente: **si tenías `eslint-plugin-react-compiler`, ya no va.** Se elimina y se usa `eslint-plugin-react-hooks@latest`, porque las reglas del compilador ahora viajan dentro de sus presets `recommended` y `recommended-latest`.

El compilador se apoya en las Reglas de React. Si tu componente las rompe, el compilador lo detecta y se salta ese componente en lugar de optimizarlo mal. Por eso las advertencias del linter dejaron de ser cosmética: ahora determinan si tu código se optimiza o no.

## 2. Si sirves Server Components, ahora tienes calendario de parches

Este es el cambio que menos se comenta y más te puede costar.

El **3 de diciembre de 2025**, React publicó una vulnerabilidad crítica en React Server Components: **CVE-2025-55182, con CVSS 10.0**, la puntuación máxima. Un atacante sin autenticar podía mandar una petición HTTP a cualquier endpoint de Server Function que, al deserializarse, lograba **ejecución remota de código en el servidor**.

Afectaba a `react-server-dom-webpack`, `react-server-dom-parcel` y `react-server-dom-turbopack` en las versiones 19.0, 19.1.0, 19.1.1 y 19.2.0. Se arregló en **19.0.1, 19.1.2 y 19.2.1**.

Y la lista de frameworks afectados es la lista de lo que la gente usa: `next`, `react-router`, `waku`, `@parcel/rsc`, `@vitejs/plugin-rsc` y `rwsdk`.

**Ocho días después llegó la segunda tanda.** El 11 de diciembre se publicaron dos más:

- **Denegación de servicio** (CVE-2025-55184, CVE-2025-67779 y CVE-2026-23864, CVSS 7.5): peticiones maliciosas a endpoints de Server Function provocaban bucles infinitos que cuelgan el proceso, se comen el CPU y terminan en caídas o en falta de memoria.
- **Exposición de código fuente** (CVE-2025-55183, CVSS 5.3): una petición podía devolver el código de tus Server Functions.

El detalle de esa última merece leerse con cuidado, porque decide si te afecta:

```js
'use server';

export async function serverFunction(name) {
  const conn = db.createConnection('SECRET KEY'); // expuesto
  const user = await conn.createUser(name);
  return {
    id: user.id,
    message: `Hello, ${name}!` // expuesto
  }
}
```

Solo se exponen los secretos **escritos a mano en el código**. Los que vienen de `process.env` no. O sea: si alguna vez pegaste una llave directo en un archivo con `'use server'` para probar, ese es el archivo.

Se arregló en **19.0.4, 19.1.5 y 19.2.4**.

La conclusión operativa es sencilla y no es sobre React: si tu aplicación sirve Server Components, dejó de ser una dependencia que se actualiza cuando hay tiempo. Y si no usas RSC ni servidor, ninguna de estas te toca.

## 3. React 19.3 trajo cosas que antes se resolvían fuera de React

**Salió el 9 de septiembre de 2026**, hace días.

**`<ViewTransition>`** te deja animar elementos cuando entran, salen, se mueven o cambian de tamaño, usando la View Transition API del navegador:

```js
import { ViewTransition } from 'react';

{isShowing && (
  <ViewTransition>
    <Component />
  </ViewTransition>
)}
```

React decide qué animación correr según cómo cambió el árbol: entrada, salida, actualización o compartida. Y si necesitas que la misma actualización de estado se anime distinto según **por qué** ocurrió, `addTransitionType` marca la causa:

```js
function nextSlide() {
  startTransition(() => {
    addTransitionType('next');
    setCurrentSlide(c => c + 1);
  });
}
```

```js
<ViewTransition
  enter={{
    'next': 'from-right',
    'previous': 'from-left',
  }}
  exit={{
    'next': 'to-left',
    'previous': 'to-right',
  }}
>
  <Page />
</ViewTransition>
```

**Los refs en `Fragment`** resuelven el problema de querer tocar el DOM de un grupo de elementos sin envolverlo en un `div` que no necesitabas:

```js
<Fragment ref={fragmentRef}>
  {posts.map(post => (
    <Heading key={post.id}>{post.title}</Heading>
  ))}
</Fragment>
```

El `FragmentInstance` trae un conjunto acotado de métodos: `addEventListener`, `removeEventListener`, `dispatchEvent`, `focus`, `focusLast`, `blur`, `observeUsing`, `unobserveUsing`, `getClientRects`, `getRootNode`, `compareDocumentPosition` y `scrollIntoView`.

Ese `observeUsing` es el que a mí me importa: conectar un `IntersectionObserver` a una lista sin fabricar un contenedor solo para tener dónde agarrarse.

**`browser()`** le dice a un componente que no se renderice en el servidor:

```js
import { use } from 'react';
import { browser } from 'react-dom';

function Component() {
  use(browser());
  // ...
}
```

Durante el renderizado en servidor se muestra el `fallback` del `Suspense` más cercano. Cuando el componente hidrata en el cliente, `use(browser())` ya no suspende y todo sigue normal. Es la versión oficial del truco del `useEffect` con `isClient` que todos hemos escrito.

También llegó **integración con Trusted Types**, que ayuda contra XSS basado en DOM: React ahora pasa esos valores sin convertirlos a texto, para que el navegador pueda validarlos.

Y una que no se ve pero se siente: **las transiciones ahora se renderizan de forma independiente** en vez de enredarse en un solo render. Una transición lenta ya no retrasa a las otras.

## 4. React ya no depende solo de Meta

En octubre de 2025 se anunció la **React Foundation**, y el 24 de febrero de 2026 se publicó su nueva casa: la **Linux Foundation**.

Ocho miembros fundadores platino: Amazon, Callstack, Expo, Huawei, Meta, Microsoft, Software Mansion y Vercel. Una junta directiva con representantes de cada uno y Seth Webster como director ejecutivo.

Con una aclaración que conviene leer completa: **la gobernanza técnica de React es independiente de la junta.** La dirección técnica la siguen marcando quienes contribuyen y mantienen React, no los miembros de la fundación.

Para el que solo escribe componentes, esto no cambia nada mañana. Cambia el riesgo a cinco años, que es el que uno realmente asume cuando escoge un framework.

## Qué hacer con todo esto

Si tuviera que ordenarlo por urgencia:

1. **Si sirves Server Components, revisa tu versión hoy.** Un CVSS 10.0 no se negocia.
2. **Si escribes `useMemo` por reflejo, prueba el compilador.** Y si tenías el plugin viejo de ESLint, quítalo.
3. **Si tienes un proyecto en Create React App**, React dejó de recomendarlo el 14 de febrero de 2025. Migrar toma menos de lo que parece.
4. **Lo de 19.3 puede esperar**, pero léelo: hay cosas ahí que estás resolviendo a mano ahora mismo.

**Fuentes:** [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) · [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) · [Vulnerabilidad crítica en RSC](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) · [DoS y exposición de código en RSC](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) · [The React Foundation](https://react.dev/blog/2026/02/24/the-react-foundation)
