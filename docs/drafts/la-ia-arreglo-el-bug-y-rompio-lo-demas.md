Esta semana hice un reel para Instagram: le pido a la IA que arregle un bug, "solo ese", y me contesta que listo, que de paso renombró mis variables, actualizó 14 dependencias, pasó el login a otro framework y borró unos tests que fallaban. "De nada."

Es un chiste exagerado, pero cada pedazo pasa de verdad. En la encuesta de Stack Overflow de 2025, la frustración número uno con las herramientas de IA, para el 66 % de quienes respondieron, fueron las soluciones que están "casi bien, pero no del todo". La segunda, para el 45 %, fue que depurar código generado por IA toma más tiempo.

Lo de los tests tampoco es invento. Cuando Anthropic lanzó Claude 4, en mayo de 2025, una de las mejoras que anunció fue que los modelos nuevos eran 65 % menos propensos que Sonnet 3.7 a tomar atajos o aprovechar huecos para completar una tarea, en las tareas más propensas a eso. Si el propio fabricante lo mide, es porque pasa.

Yo programo con Claude Code ([aquí conté cómo](https://codewithgabo.com/como-programo-con-claude-code-flujo-real)), y estas son las cinco cosas que hago para que un agente no me entregue un "arreglado" que rompe todo lo demás.

## 1. Pido con alcance y con salida

"Arregla el bug del login" deja la puerta abierta a todo. Yo pido así: qué está mal, dónde creo que está, qué no se toca y qué hacer si hace falta tocarlo. Por ejemplo:

> El login falla cuando el correo tiene mayúsculas. Arréglalo en `auth/login.ts`. No toques los tests ni las dependencias; si crees que hace falta, para y dime por qué.

La última parte es la importante. Un agente que no tiene cómo decirte "esto es más grande de lo que pediste" va a resolver lo grande por su cuenta.

## 2. Miro el tamaño antes que el cambio

Antes de leer una sola línea, corro esto:

```
git diff --stat
```

Si pedí un bug y veo treinta archivos, no leo nada: pregunto por qué. El tamaño del diff es la primera prueba y la más barata.

## 3. Leo los tests primero

Si el cambio toca tests, esos los leo antes que el código:

```
git diff -- '*.test.*'
```

Un test que cambió junto con el código que prueba es la señal que busco. A veces el cambio es correcto, porque el comportamiento cambió a propósito. Pero un test que pasó de fallar a pasar porque ahora espera otra cosa, o que desapareció, no arregló nada.

## 4. Hago que saltarse una prueba se vea

Esta es la que más me ha servido. Los reels de @codewithgabo salen de una suite que armé en Remotion, y antes de exportar, un probe revisa que el video cambie cada dos segundos. Si se queda quieto, el export se cancela. Hay una salida, y está puesta a propósito: `"allowStatic": true` en el archivo de la pieza. Es una línea, y queda en el diff con su nombre.

Esta semana, pasando dos reels a un diseño nuevo, el probe marcó un tramo de dos segundos por debajo del mínimo, que es 0.6 %. La salida corta era esa línea. El agente arregló el reel: el texto del final ahora se escribe a mano y se subraya, y el tramo subió a 1.3 %. No sé si otro día habría tomado la línea. Lo que sé es que, si la toma, la veo.

Lo mismo vale para cualquier suite de tests:

- **Que `.only` y `.skip` no lleguen a main.** Playwright y Mocha tienen `--forbid-only`, Vitest no deja pasar un `.only` en CI por defecto, y los plugins de ESLint para Jest y Vitest traen las reglas `no-focused-tests` y `no-disabled-tests`.
- **Que los tests tengan dueño.** Con un archivo `CODEOWNERS` en GitHub y la regla de rama que exige la revisión del dueño, un cambio en la carpeta de tests no entra sin que alguien lo mire.
- **Que el agente también tenga reglas.** En Claude Code, un hook `PreToolUse` puede bloquear que edite ciertas rutas, como tus tests, o hacer que te pida permiso antes.

## 5. No me fío de cómo me sentí

En julio de 2025, METR midió a 16 programadores con experiencia trabajando en sus propios proyectos: con IA tardaron 19 % más, y al terminar creían que habían ido 20 % más rápido. En febrero de 2026, METR publicó datos nuevos, con herramientas más recientes, que apuntan a que ahora sí ayudan. Pero el mismo METR dijo que, por cómo quedaron seleccionadas las tareas, esos datos son "evidencia muy débil", y está cambiando el diseño del estudio.

O sea, todavía no sabemos bien cuánto nos acelera. Lo que sí quedó claro es que lo que uno siente no es una medida. Por eso las cuatro reglas de arriba son chequeos que no dependen de cómo me fue.

## Lo que no cambia

La IA escribe rápido, y cada vez escribe mejor. Revisar sigue siendo mi trabajo, y el tuyo. El agente que "arregló" el bug borrando el test no te engañó: cumplió con lo único que midió como éxito, que el test pasara.

**Fuentes:** [Encuesta de Stack Overflow 2025, sección de IA](https://survey.stackoverflow.co/2025/ai) · [Anthropic, lanzamiento de Claude 4 (22 de mayo de 2025)](https://www.anthropic.com/news/claude-4) · [METR, estudio de julio de 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) · [METR, actualización de febrero de 2026](https://metr.org/blog/2026-02-24-uplift-update/) · [Vitest: allowOnly](https://vitest.dev/config/allowonly) · [Playwright: forbidOnly](https://playwright.dev/docs/api/class-testconfig#test-config-forbid-only) · [ESLint para Jest: no-disabled-tests](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-disabled-tests.md) · [ESLint para Vitest: no-disabled-tests](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-disabled-tests.md) · [GitHub: CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · [Claude Code: hooks](https://code.claude.com/docs/en/hooks)
