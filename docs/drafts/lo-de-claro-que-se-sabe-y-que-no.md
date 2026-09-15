El 13 de septiembre apareció en un foro la afirmación de que alguien había accedido a los sistemas de Claro en República Dominicana y sacado una base con **2,889,256 registros de clientes**. La cifra se repitió rápido, amplificada desde X, y en cuestión de horas medio país la daba por hecha.

Vale la pena separar dos cosas que se mezclaron enseguida: lo que se afirmó y lo que está comprobado. No son lo mismo, y la diferencia cambia qué deberías hacer tú.

## Qué se afirmó

Según la publicación, cada registro incluiría:

- Número de identificación
- Número de teléfono
- Información de la suscripción
- Estado de la cuenta
- Categoría del plan
- Fecha de activación
- Ciclo de facturación
- Códigos internos
- **ICCID**, el identificador único de cada tarjeta SIM

Ese último campo es el que más dice. El ICCID no es un dato de mercadeo: identifica una SIM en concreto.

## Qué no está comprobado

Prácticamente todo lo demás.

La afirmación **no se ha podido comprobar de forma independiente**. Las muestras difundidas no permiten establecer por sí solas el origen de los datos, ni demuestran que la información sea reciente, completa, ni que salga de los sistemas de la empresa.

Claro Dominicana **no ha confirmado públicamente** ningún incidente. Al momento de escribir esto tampoco aparecen investigaciones ni notificaciones anunciadas por autoridades dominicanas.

Así que el estado real es: una alegación difundida en redes, no una filtración confirmada.

## Por qué eso no te deja tranquilo

Aquí es donde casi todo el mundo saca la conclusión equivocada, en una dirección o en la otra.

Unos leen "no está confirmado" y siguen igual. Otros leen la cifra y entran en pánico. Las dos reacciones tratan la incertidumbre como si fuera información.

Míralo por el costo:

- **Si la filtración es falsa** y tú moviste tu autenticación de dos pasos fuera del SMS, perdiste veinte minutos.
- **Si es real** y esperaste la confirmación oficial, esperaste justo durante la ventana en que esos datos valen más.

No es simétrico. Y la confirmación, cuando llega, suele llegar tarde: primero hay que verificar, luego decidir qué se comunica, y eso toma días o semanas. Mientras tanto, lo que estuviera circulando ya circuló.

La ausencia de confirmación no es confirmación de ausencia.

## Qué haría alguien con esos datos, si fueran reales

No hace falta imaginar escenarios de película. Con cédula, teléfono, plan y ciclo de facturación, dos ataques normales se vuelven mucho más fáciles.

**El primero es la llamada que sabe cosas de ti.** El esquema de siempre —"le llamamos de su compañía telefónica"— falla porque el que llama no sabe nada. Con esos campos sí sabe: tu nombre, tu cédula, qué plan tienes y cuándo te facturan. Toda la pregunta de seguridad que tu banco te hace por teléfono está en esa lista.

**El segundo es el cambio de SIM.** Si alguien convence a un punto de servicio de que es tú y se lleva tu número a otra SIM, hereda tus mensajes. Y ahí es donde duele: **el SMS sigue siendo el segundo factor de casi todo en el país.** Tu banco, tu correo, tus redes. Quien controla tu número puede pedir el código de recuperación de todo lo demás.

Por eso el dato del ICCID no es un detalle técnico aburrido. Es el que convierte una lista de clientes en una lista de objetivos.

## Qué hacer esta semana

Ninguna de estas cosas depende de que la filtración se confirme.

**Saca tu segundo factor del SMS.** Correo, banco, redes: donde se pueda, usa una app de autenticación. Es el cambio con más efecto por minuto invertido, y es el único que te protege si tu número deja de ser tuyo.

**Pregunta en tu compañía qué hace falta para cambiar tu número de SIM.** Si la respuesta es "una llamada", eso es el problema. Pide que exija presencia física o una clave adicional, si lo ofrecen.

**Ponle PIN a la SIM.** Es el menú de seguridad del teléfono, toma un minuto, y bloquea el caso simple de que te roben el equipo y saquen la tarjeta.

**Cambia tu regla mental sobre quién te llama.** Que alguien sepa tu cédula ya no prueba nada. Nunca fue una buena prueba; ahora ni siquiera es una mala. Si te llaman de tu banco, cuelga y llama tú al número de la tarjeta.

**Y nunca leas un código en voz alta.** Ningún banco, ninguna telefónica y ninguna app te va a pedir por teléfono el código que te acaba de llegar.

## Lo que nos toca a los que construimos software

Si tú haces sistemas para clientes dominicanos, esto cambia dos supuestos.

**El primero: la cédula y el teléfono no son secretos.** Nunca lo fueron del todo, pero cualquier sistema que verifique identidad preguntando la cédula está haciendo teatro. Si tu recuperación de cuenta se apoya en "dime tu número de documento", tu recuperación de cuenta es pública.

**El segundo: el OTP por SMS es un factor prestado.** No lo controlas tú, lo controla la operadora, y su seguridad es la de su punto de atención al cliente. Si tu app protege dinero o datos sensibles, ofrece al menos la opción de una app de autenticación.

Y hay un tercero, más incómodo, que aplica aunque este caso resulte falso: **tú también estás a un export de distancia.** Casi toda base de datos de clientes puede volcarse completa desde adentro. Las preguntas útiles no son de firewall:

- ¿Cuántos campos guardas que nunca usas? Cada uno es superficie.
- ¿Quién puede exportar la tabla de clientes completa, y queda registrado?
- Si mañana aparece un volcado con tu esquema, ¿podrías decir en horas si es tuyo y de cuándo?

Esa última es la que separa una respuesta creíble de un silencio de dos semanas.

## El marco legal, y su hueco

En República Dominicana la referencia es la **Ley 172-13**, del 13 de diciembre de 2013, sobre protección de datos de carácter personal. Lo que sí establece con claridad:

- El tratamiento de datos exige consentimiento previo, libre, inequívoco y específico del titular, salvo las excepciones que la propia ley contempla.
- Quien trata datos debe adoptar **medidas técnicas y organizativas** para evitar accesos no autorizados o alteraciones.
- Tú tienes derecho a que rectifiquen, actualicen o supriman tus datos, y el responsable tiene un plazo máximo de **diez días hábiles** desde tu reclamo.

Lo que no encontré en las fuentes que revisé es una obligación explícita de **notificar una brecha** a los afectados. Si existe en algún reglamento posterior, no me topé con ella, y me parece relevante decirlo así en vez de afirmar lo contrario.

Ese hueco explica bastante. Cuando no hay un reloj legal corriendo, "no comentamos" es una estrategia viable. En Europa no lo sería: el reglamento allá obliga a notificar en 72 horas. Aquí el incentivo apunta al otro lado.

## Cómo funciona un cambio de SIM fraudulento

Vale la pena entenderlo, porque la defensa se vuelve obvia cuando ves el orden de los pasos.

1. **Quien ataca ya sabe quién eres.** Nombre, cédula, número, plan. Con eso no necesita adivinar nada.
2. **Llama o se presenta como tú** y pide un reemplazo de SIM: que se le perdió el teléfono, que la tarjeta se dañó. Responde las preguntas de verificación porque las respuestas están en la lista.
3. **Tu teléfono se queda sin señal.** Esa es la única señal de alarma que recibes, y es fácil confundirla con un problema de red. Ese detalle es el que hace que el ataque funcione de noche.
4. **Ahora tus SMS llegan a otro equipo.** Entra a tu correo con "olvidé mi contraseña", recibe el código, y desde el correo cae todo lo demás.

Fíjate dónde está el punto débil: no es tu contraseña, ni tu teléfono, ni siquiera tus datos. Es el mostrador donde alguien decide si el que llama eres tú. Tu seguridad depende del entrenamiento de una persona que no conoces, que atiende a cien clientes al día.

Por eso mover el segundo factor fuera del SMS es la única defensa que no depende de esa persona.

## Cómo leer la próxima afirmación de filtración

Va a haber otra. Conviene tener criterios antes, no durante.

**¿Hay muestra verificable?** No "capturas de pantalla": registros que alguien independiente pueda cruzar con datos reales conocidos. Una captura no prueba origen; un CSV con mil filas que cuadran, sí.

**¿Los campos son internos o de catálogo?** Un teléfono y un nombre pueden salir de cualquier lado. Un ICCID, un código interno o un ciclo de facturación no aparecen en un formulario público. Los campos que solo existen dentro del sistema son la parte difícil de falsificar.

**¿Los datos son frescos?** La pregunta que más filtraciones tumba. Si en la muestra no hay una sola línea activada este año, probablemente estás viendo datos viejos, de otra brecha, revendidos con etiqueta nueva.

**¿Alguien cruzó la muestra con filtraciones anteriores?** Reempaquetar volcados viejos y venderlos como nuevos es un negocio, no una excepción. Es la explicación más aburrida y por eso la más frecuente.

**¿Y quién lo está contando?** Una cuenta que agrega filtraciones no es una fuente que las verifica. Amplificar y comprobar son dos oficios distintos.

Con esos cinco filtros, la mayoría de los sustos de internet se resuelven solos en un día.

## Qué debería publicar una empresa para cerrar el tema

Aquí hay una asimetría que casi nadie nota: **la empresa es la única que puede cerrar esto barato.**

Quien afirma tener los datos no puede probar el origen sin exponerse. Quien los revisa desde fuera solo puede decir "parece plausible". Pero la empresa tiene el esquema de su propia base. Sabe si un campo llamado como aparece en la muestra existe en sus sistemas, sabe si ese formato de código interno es suyo, y sabe si las fechas de activación corresponden a su historia.

Un comunicado útil tiene tres frases:

- **Revisamos la muestra**, y estos campos corresponden o no corresponden a nuestro esquema.
- **Si corresponden**, este es el alcance y estas son las cuentas afectadas.
- **Esto es lo que debes hacer tú**, con instrucciones concretas.

Un comunicado inútil dice que la seguridad de los clientes es prioritaria.

El silencio tiene un costo que no se ve en el momento: deja a todo el mundo gestionando el peor caso por su cuenta. Y deja vivo el rumor, que es más difícil de matar en dos semanas que en dos días.

## Cómo termina esto, probablemente

Hay tres finales posibles. Que alguien verifique las muestras y resulten auténticas. Que se demuestre que son datos viejos, recombinados de filtraciones anteriores —pasa más de lo que uno cree—. O que no pase nada y la historia se apague en dos semanas sin que nadie sepa.

El tercero es el más probable. Y es el peor, porque deja a todo el mundo con la misma duda y sin ninguna razón para cambiar nada.

Por eso el consejo de arriba no depende del final. Mover tu segundo factor fuera del SMS te conviene igual si esto resultó ser humo, igual si resultó ser cierto, e igual la próxima vez que aparezca una lista con tu nombre.

**Fuentes:** [N Digital](https://n.com.do/2026/09/13/usuario-asegura-haber-accedido-a-datos-de-casi-2-9-millones-de-clientes-de-claro-en-rd/) · [EyR](https://eyr.com.do/presunta-filtracion-datos-clientes-claro-dominicana/) · [Ley 172-13, texto oficial](https://www.one.gob.do/media/u5ohmfyp/ley-172-13.pdf)
