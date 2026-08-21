## El problema no es de software, es de libreta

Entra a cualquier colmado, repostería o tienda de ropa en Santo Domingo y pregunta cómo reciben los pedidos. La respuesta casi siempre es la misma: por WhatsApp.

Y funciona. La gente ya tiene WhatsApp, no hay que enseñarle a nadie a usarlo, no hay app que descargar. El problema aparece después, cuando el negocio crece un poco.

El dueño termina con veinte chats abiertos y ningún lugar donde esté escrito lo que pasa:

- El catálogo es una foto que mandó hace tres semanas, con precios que ya cambiaron.
- El pedido está regado en seis mensajes: "mándame dos", "ah no, mejor tres", un audio de treinta segundos, y una ubicación.
- No hay estados. ¿Ese pedido se preparó? ¿Salió? ¿Se entregó? Vive en la cabeza de alguien.
- Al cerrar el mes nadie sabe qué se vendió más. Se sabe "más o menos".
- Si el dueño se enferma o se va de viaje, el negocio se apaga, porque el WhatsApp es de él.

La solución que le venden a ese dueño casi siempre es "hazte una app" o "monta un ecommerce". Ambas le piden lo mismo: que sus clientes cambien de hábito. Que descarguen algo, que se registren, que aprendan una interfaz nueva. Ese es el punto donde la mayoría de esos proyectos se muere.

NegocioRD parte de lo contrario: el cliente no cambia nada. Sigue escribiendo por WhatsApp, como siempre. El que cambia es el negocio.

## Qué es NegocioRD

Es una plataforma para pymes dominicanas que venden por WhatsApp. En la portada lo digo así: *"Tu negocio en WhatsApp, automatizado"*.

En lenguaje de negocio, hace cuatro cosas:

**Atiende cuando el dueño no puede.** Un bot con inteligencia artificial responde en el chat, enseña el menú o catálogo, contesta precios y disponibilidad, y arma el pedido. A la hora que sea.

**Convierte la conversación en un pedido de verdad.** Lo que en el chat era un reguero de mensajes entra al sistema como un pedido con productos, cantidades, total y un estado que se puede mover: recibido, en preparación, en camino, entregado.

**El catálogo se actualiza de una vez.** El dueño cambia un precio o marca algo agotado desde el panel, y el bot deja de ofrecerlo en ese mismo momento. Se acabó la foto vieja del menú circulando por ahí.

**Dice qué está pasando.** Un panel con productos más vendidos, ventas por día y tendencia. No para hacer un doctorado en datos, sino para saber qué reponer el lunes.

Los precios están publicados y son en pesos: plan **Gratis** en RD$0 con 50 pedidos al mes, bot básico y un negocio; plan **Pro** en **RD$1,500 al mes** con pedidos ilimitados, bot avanzado con IA, estadísticas completas y soporte prioritario.

Todo está en español y en inglés, porque en este mercado eso no es opcional: hay negocios que atienden turistas y clientes de fuera, y el bot tiene que responder en el idioma del que escribe, no en el del dueño.

## Las decisiones que importan, y por qué

### WhatsApp en vez de una app propia

Esta es la decisión que define todo lo demás. Una app propia te da control total del producto y cero usuarios. El costo de instalación no es técnico, es humano: le estás pidiendo a la señora que te compra hace cinco años que descargue algo.

WhatsApp ya está instalado. El costo de adopción para el cliente final es cero. A cambio, yo pierdo control: no diseño la interfaz, no controlo la plataforma, y juego con las reglas de otro. Lo acepté porque un producto que nadie instala no resuelve nada.

### Un bot que toma el pedido, no un menú de opciones

Pude haber hecho un menú numerado: "responde 1 para ver el catálogo, 2 para hacer un pedido". Es más barato, más predecible y más fácil de probar.

No lo hice porque la gente aquí no escribe así. Escribe "buenas, tiene de la de pollo?", manda audios, escribe sin tildes, mezcla español e inglés, y dice "lo mismo de la vez pasada". Un árbol de opciones obliga al cliente a hablar como la máquina. Un modelo de lenguaje (uso Claude) le permite hablar como habla.

El precio de esa decisión es que ahora tengo un componente que no es determinista, y eso complicó todo. Vuelvo a eso en la próxima sección.

### Suscripción en vez de pago único

Un pago único suena mejor para el dueño de la pyme, y hasta se vende más fácil. Pero el producto tiene costos que corren todos los meses: infraestructura, base de datos, y sobre todo cada conversación que pasa por el modelo de IA. Un cobro único con un costo recurrente detrás es un negocio que pierde plata mientras más lo usan.

La suscripción también alinea los incentivos: si el negocio deja de venderme valor, se va, y yo me entero rápido. Un pago único me deja con clientes que no usan la plataforma y no me dicen por qué.

El plan gratis con 50 pedidos al mes existe por una razón concreta: nadie en este mercado le va a dar una tarjeta a una plataforma que no ha visto funcionando con sus propios productos y sus propios clientes.

### El stack

Next.js, React 19, TypeScript, Tailwind, Prisma sobre PostgreSQL, Stripe para la facturación, Claude para el bot, Recharts para las gráficas y SSE para las notificaciones en tiempo real.

Nada exótico a propósito. Es un producto que tiene que sostener un desarrollador, y elegir tecnología aburrida es parte de que eso sea posible.

## Lo que de verdad fue difícil

Si me quedo en lo de arriba esto es un folleto. Estas son las partes feas.

**Que el bot no invente.** Un modelo de lenguaje quiere ayudar, y ayudando se inventa cosas. Un bot que le confirma a un cliente un producto que no existe, o un precio viejo, no es un bug simpático: es un cliente molesto y un negocio quedando mal. La mayor parte del trabajo del chatbot no fue hacerlo conversar, fue ponerle bozal: que solo pueda ofrecer lo que está en el catálogo en ese momento, que los precios y totales los calcule el sistema y no el modelo, y que cuando no sepa algo lo diga en vez de improvisar. Sigo encontrando casos donde se sale del carril. [DATO: porcentaje de conversaciones que terminan en un pedido correcto sin intervención humana]

**El dueño rompe el flujo, y hace bien.** Diseñé un flujo de estados limpio. La realidad es que el dueño entra al chat y le responde al cliente él mismo, o le da un descuento por lo bajo, o le dice "te lo mando ahorita" sin tocar el sistema. Ahí el panel y la conversación quedan diciendo cosas distintas, y el que está equivocado es el panel. Diseñar para que la intervención manual no rompa el registro fue más difícil que el bot completo.

**Los estados del pedido no existen en abstracto.** "En preparación" en una repostería y "en preparación" en una tienda de ropa no son lo mismo. Empecé con un flujo genérico que no le servía bien a nadie y tuve que decidir entre un modelo rígido que aprieta o uno configurable que abruma al que apenas se está registrando. Sigo sin estar convencido de haberlo resuelto bien.

**Cobrar en un mercado que no paga como Stripe espera.** Los precios están en pesos dominicanos y la facturación corre por Stripe. Ahí hay una fricción real: buena parte de las pymes de aquí opera en efectivo y transferencia bancaria, no con tarjeta atada a una suscripción recurrente. Es el punto del producto donde la tecnología y la realidad local menos se entienden. [DATO: cuántos de los negocios interesados desistieron específicamente por el método de pago]

**Las reglas de WhatsApp mandan.** La plataforma de negocios de WhatsApp no te deja escribirle a un cliente cuando te dé la gana: hay una ventana de 24 horas después de que el cliente escribe, y fuera de ahí solo se pueden usar plantillas aprobadas. Eso condiciona algo tan básico como avisar "tu pedido salió". El producto se tuvo que diseñar alrededor de esa regla, no al revés.

**El costo por conversación es un costo variable.** Cada mensaje que pasa por el modelo cuesta plata. Un plan gratis con 50 pedidos mensuales y un cliente conversador puede costarme más de lo que aporta. Es el número que más me falta y el que decide si el precio publicado se sostiene. [DATO: costo promedio en IA por pedido completado, y por conversación que no termina en pedido]

## Para quién NO es esta plataforma

Prefiero decirlo antes de que alguien pague:

- **Negocios que no venden por WhatsApp.** Si tus pedidos entran por teléfono, por Instagram o en el mostrador, esto no te toca. La plataforma no arregla un canal que no usas.
- **Inventario serio.** Si manejas lotes, vencimientos, múltiples almacenes o variantes complicadas, necesitas un POS o un ERP. El catálogo de aquí es intencionalmente sencillo.
- **Quien ya tiene ecommerce con carrito y pasarela funcionando.** Si tus clientes ya compran en tu web sin problema, meter WhatsApp en el medio te agrega trabajo, no lo quita.
- **Ventas de ticket alto o consultivas.** Si tu conversación de venta es negociación, especificaciones o levantamiento de requisitos, un bot que toma pedidos no aplica. Ahí la conversación es el producto.
- **Quien no soporta que una máquina hable por su marca.** El bot va a decir cosas que tú no dirías. Se puede ajustar, pero nunca va a sonar exactamente como tú. Si eso te quita el sueño, es un no.
- **Negocios sin nadie pendiente del panel.** Automatizar la entrada de pedidos no automatiza cumplirlos. Si nadie mira los pedidos que entran, el bot solo va a decepcionar clientes más rápido.

## Dónde está

La plataforma está publicada en [negocio-rd.vercel.app](https://negocio-rd.vercel.app) con los dos planes visibles y registro abierto. Si tienes un negocio que vende por WhatsApp y quieres decirme dónde esto se te rompe, esa es la conversación que más me sirve ahora mismo.

## Datos que faltan

Marcadores usados en el texto, para rellenar antes de publicar:

1. **[DATO: porcentaje de conversaciones que terminan en un pedido correcto sin intervención humana]** — en la sección "Que el bot no invente".
2. **[DATO: cuántos de los negocios interesados desistieron específicamente por el método de pago]** — en la sección "Cobrar en un mercado que no paga como Stripe espera".
3. **[DATO: costo promedio en IA por pedido completado, y por conversación que no termina en pedido]** — en la sección "El costo por conversación es un costo variable".

Cifras adicionales que fortalecerían mucho el post si existen y no están puestas en ningún lado todavía: cantidad de negocios registrados, cantidad de pedidos procesados hasta la fecha, tiempo promedio entre el primer mensaje del cliente y el pedido confirmado, y cuántos negocios pasaron del plan gratis al Pro.