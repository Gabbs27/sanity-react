---
title: "Cómo programo con Claude Code: mi flujo real en un proyecto de verdad"
slug: como-programo-con-claude-code-flujo-real
tags: Claude Code, IA, Productividad, Desarrollo Web
excerpt: No otro tutorial de "escribe un prompt y mira la magia". Este es el flujo real que uso sobre este mismo sitio, con tres tareas que delegué de verdad y la parte que casi nadie cuenta, que es dónde falla.
---

Hay dos tipos de artículos sobre programar con IA. Los que te enseñan a generar una función de ordenamiento y concluyen que el oficio se acabó, y los que enseñan un bug tonto y concluyen que esto no sirve para nada.

Ninguno de los dos se parece a mi trabajo diario.

Este post es lo tercero: el flujo concreto que uso con Claude Code sobre este mismo sitio, con tres tareas que delegué de verdad, el rastro en el repositorio para probarlo, y una sección sobre dónde falla que va a ser tan larga como la de dónde funciona. Porque esa es la parte que a mí me habría servido leer.

## Qué es, sin marketing

Claude Code es un agente que corre en tu terminal, dentro de tu repositorio. Lee tus archivos, corre tus comandos, edita tu código y hace tus commits. No es autocompletado en el editor y no es una ventana de chat aparte donde copias y pegas fragmentos.

La diferencia importa más de lo que parece. Un asistente que ve un archivo te ayuda a escribir una función. Un agente que ve el repositorio entero, corre los tests y lee la salida puede encargarse de una tarea completa. Es la diferencia entre pedir consejo y delegar trabajo.

## Mi setup

Nada exótico:

- El repositorio de este sitio, que es un frontend en React con Vite, Sanity como CMS y un backend pequeño de funciones en Vercel.
- Una carpeta `.claude/` en el proyecto con la configuración local y los permisos.
- Una carpeta `docs/plans/` donde vive todo lo que se ha diseñado y planificado. Esta es la pieza clave y ahora explico por qué.
- Worktrees de git cuando una tarea grande merece aislarse del árbol de trabajo actual.

Y una regla propia, que es la que de verdad cambió mi resultado: **nada grande se escribe sin un plan escrito antes.**

## El flujo: diseñar, planificar, ejecutar

La tentación con un agente es abrir la terminal y decir "añádeme un panel de administración". A veces sale. Muchas veces sale algo que funciona pero que no es lo que querías, y lo descubres cuando ya hay seiscientas líneas escritas.

Así que separo en tres fases, y no dejo que se solapen:

**Uno, diseñar.** Antes de tocar código, una conversación. Qué problema resolvemos, dos o tres enfoques con sus contras, cuál elegimos y por qué. Sale un documento de diseño en `docs/plans/`. Corto, pero escrito.

**Dos, planificar.** Del diseño sale un plan por tareas. Qué archivos toca cada una, qué test se escribe primero, qué comando la verifica, dónde va el commit. En mi carpeta de planes hay archivos como `2026-04-28-slice-2-vercel-migration.md` o `2026-04-29-portfolio-audit-implementation.md`. Cada uno es un plan que se ejecutó tarea a tarea.

**Tres, ejecutar.** Ahora sí, código. Con el plan delante, la sesión no deriva. Si algo no encaja, se ve enseguida, porque hay un documento que dice qué debería estar pasando.

Suena a burocracia y al principio lo pensé. No lo es. El plan escrito es lo que convierte "el agente hizo algo raro" en "el agente se desvió del paso 4", que es un problema muy distinto y mucho más fácil de arreglar.

## Tres tareas que delegué de verdad

### La auditoría del portfolio

Le pedí que auditara este sitio como si fuera de un cliente. Leer cada componente público, recorrer las rutas en celular y escritorio, medir el tamaño de los chunks del build, contar los posts reales en Sanity.

Salieron **20 hallazgos en cuatro áreas**, cada uno con prioridad y esfuerzo estimado. Entre ellos: una ilustración de 993 KB sin optimizar, un sitemap con cero posts de nueve publicados, y una página 404 que se quedaba colgada para siempre en "Loading post...".

Lo escribí en detalle [en otro post](https://codewithgabo.com/auditoria-portfolio-20-problemas), pero lo relevante aquí es el reparto del trabajo: **la máquina encontró, yo prioricé.** El documento salió con hallazgos y sin arreglos, a propósito, para que yo decidiera qué tocaba y qué no. Tres de los veinte los descarté.

### La migración de Express a Vercel Functions

Tenía un servidor Express pequeño en Railway envolviendo la API de Google Analytics. Funcionaba, pero costaba dinero todos los meses por estar encendido 24/7 sirviendo un dashboard que casi nadie visita.

La migración a funciones sin servidor fue una tarea de manual: extraer los ayudantes a `api/_utils/`, convertir la ruta en un handler, mover las variables de entorno, verificar que el contrato externo no cambiara. El frontend nunca se enteró. La factura pasó a cero.

Esta es exactamente la clase de tarea donde delegar gana: mecánica, bien definida, con un criterio de éxito objetivo. No requiere criterio, requiere no equivocarse en veinte detalles seguidos. Eso lo hace mejor una máquina que yo a las once de la noche.

### El sitemap generado desde Sanity

Mi sitemap era un archivo estático que había que editar a mano cada vez que publicaba. O sea: nunca.

Ahora es un script que corre en `prebuild`, consulta Sanity con GROQ, y escribe el archivo con todos los posts y sus fechas reales. Son ochenta líneas de Node sin dependencias nuevas.

Tarea pequeña, y justamente por eso llevaba meses sin hacerla. Ese es el patrón que más he notado: lo que más me ha ahorrado no son las tareas grandes, sino las de cuarenta minutos que llevaban medio año en la lista porque nunca eran lo bastante urgentes.

## Dónde falla

Aquí es donde la mayoría de estos artículos se ponen borrosos. Vamos al grano.

**Acepta tu premisa demasiado rápido.** Si le dices "arregla este bug de CSS", va a buscar un bug de CSS. Si el problema real era el orden de las rutas, puede que te entregue un arreglo de CSS que tapa el síntoma. Ahora, cuando algo se rompe, describo el comportamiento y no mi diagnóstico. La diferencia en resultado es enorme.

**Es demasiado agradable con tus ideas.** Si propones un enfoque malo, la respuesta por defecto tiende a ser ayudarte a construirlo bien. Yo pido explícitamente que me den dos o tres opciones con contras antes de decidir nada, porque si no pido alternativas, no aparecen.

**El contexto se degrada en sesiones largas.** En una sesión de horas, las decisiones de la primera media hora se vuelven borrosas. Por eso el plan va a un archivo y no se queda en la conversación: el archivo no se olvida.

**No sabe qué es feo.** Puede escribir un componente correcto, accesible y que pasa los tests, y que se vea mal. El criterio visual sigue siendo tuyo. En este sitio he rehecho a mano bastante CSS que estaba técnicamente bien.

**Y lo más importante: sigues siendo responsable de lo que se mergea.** Reviso cada diff. No porque desconfíe más que de un compañero humano, sino exactamente igual que de un compañero humano. Un commit con mi nombre es mío, lo haya escrito quien lo haya escrito.

**Cuándo sale más caro:** tareas de menos de diez minutos que ya sé hacer, cambios de una línea, y cualquier cosa donde explicar el contexto tarde más que hacerlo. Escribir un buen prompt para un cambio trivial es trabajo neto negativo.

## Cómo empezar mañana

Si quieres probar sin quemarte:

1. **Empieza por una tarea aburrida y bien definida.** Migrar un formato, escribir tests de algo que ya existe, actualizar dependencias. No empieces por la funcionalidad estrella de tu producto.
2. **Pide un plan antes que código.** Aunque la tarea sea pequeña. Leer el plan te dice en treinta segundos si se entendieron, y corregir un plan es gratis comparado con corregir una implementación.
3. **Trabaja en una rama o en un worktree.** Para poder tirarlo todo sin pensarlo si se tuerce.
4. **Lee los diffs.** Enteros. Si no vas a leerlos, no delegues.
5. **Deja el contexto por escrito en el repositorio.** Las decisiones que viven solo en una conversación se pierden. Las que viven en `docs/plans/` siguen ahí en tres meses, cuando ya no te acuerdes de por qué elegiste eso.

## Lo que de verdad cambió

No programo más rápido. Programo con menos fricción en lo aburrido, que resulta ser la mayoría del trabajo.

Las tareas que antes se quedaban en la lista por pereza ahora se hacen, porque el coste de arrancarlas bajó lo suficiente. El sitemap llevaba meses pendiente. La auditoría llevaba más. Ninguna era difícil; las dos eran tediosas, y lo tedioso es exactamente lo que se me acumulaba.

Lo que no cambió: sigo decidiendo qué se construye, sigo revisando cada línea que entra, y sigo siendo el responsable cuando algo se rompe en producción.

Eso me parece bien. Es la parte del trabajo que me gusta.
