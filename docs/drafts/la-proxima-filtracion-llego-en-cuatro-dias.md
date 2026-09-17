El 15 de septiembre publiqué [un análisis de lo de Claro](https://codewithgabo.com/lo-de-claro-que-se-sabe-y-que-no) con una sección titulada "cómo leer la próxima afirmación de filtración". Escribí que iba a haber otra.

Llegó hoy. Cuatro días después de la de Claro.

Una cuenta que monitorea canales de cibercrimen, VECERT Analyzer, publicó una alerta: alguien compartió un enlace de descarga que **supuestamente** contiene registros del Sistema Policial de Gestión de Denuncias, el SPGD de la Policía Nacional. Un archivo de 10,000 líneas en una plataforma de alojamiento temporal.

La misma alerta lo dice en su primera línea: **estado, no confirmado.** Hay evidencia visible —el enlace existe, y quien lo publicó adjuntó el escudo de la institución— pero la autenticidad de los registros, su vigencia y el alcance de cualquier compromiso están sin verificar.

Al momento de escribir esto no encontré un solo medio dominicano cubriéndolo, ni una respuesta de la Policía.

Así que voy a hacer lo que dije que había que hacer: pasarle los cinco filtros, en público, sin saber de antemano qué sale.

## Por qué esta importa más que la de Claro

Antes de los filtros, el contexto. El SPGD no es una lista de clientes.

Según la propia Policía Nacional, al sistema se migraron **más de cuatro millones de registros**, y se alimenta desde más de 170 centros de recepción en todo el país. El portal público acepta denuncias oficiales, denuncias anónimas y denuncias de **violencia de género**, y le pide al ciudadano sus datos personales, el relato detallado del hecho y sus datos de contacto.

Ese mismo portal hace una promesa, textual: *"Se garantizará la protección de la identidad de la persona denunciante y/o de la persona afectada."*

Una lista de teléfonos filtrada facilita estafas. Una base de denuncias identifica a quien denunció, a quién denunció, y qué contó. Si la alegación fuera cierta, lo que se habría roto es esa promesa exacta.

Por eso este caso exige más cuidado que el anterior, no menos. Y por eso hay algo que va primero que cualquier filtro:

**No busques ese archivo. No lo bajes. No lo compartas.** Si es falso, es un anzuelo — un archivo de origen criminal que alguien quiere que abras. Si es real, adentro hay personas que denunciaron a un agresor creyendo que nadie más lo sabría. Yo no lo descargué para escribir esto, y nada en este análisis lo necesita.

## Filtro 1: ¿hay muestra verificable?

Hay más que en el caso de Claro: no una captura, sino un enlace a un archivo. Pero "existe un archivo" y "el archivo es lo que dicen" son afirmaciones distintas, y nadie independiente ha verificado la segunda. La propia alerta lo reconoce.

Veredicto: evidencia de que alguien publicó algo. Nada más.

## Filtro 2: ¿los campos son internos o de catálogo?

La alerta no dice qué campos trae el archivo. No hay esquema, no hay muestra descrita, no hay nada contra qué comparar. Este filtro es el que más separa una filtración real de un refrito, y aquí no se puede ni empezar a aplicar.

Veredicto: sin datos.

## Filtro 3: ¿los datos son frescos?

Tampoco se sabe. Y aquí hay una trampa específica de este sistema: como al SPGD se migraron millones de registros históricos, datos viejos no probarían que sea falso — el sistema real los contiene. Lo que haría falta para probar acceso actual son registros recientes, y nadie ha mostrado ninguno.

Veredicto: sin datos.

## Filtro 4: ¿alguien lo cruzó con filtraciones anteriores?

No que se haya publicado. Con una aritmética sencilla encima: 10,000 líneas contra más de cuatro millones de registros es el **0.25%** del sistema. Eso puede ser una muestra para probar acceso, puede ser todo lo que alguien tiene, o puede ser un recorte de otra cosa. Las tres explicaciones producen exactamente el mismo enlace.

Veredicto: sin datos.

## Filtro 5: ¿quién lo está contando?

Un agregador. Que, para su crédito, etiqueta la alerta como no confirmada desde la primera línea. El riesgo viene después: cada vez que alguien la reenvíe, esa etiqueta es lo primero que se cae. "Alegada filtración, sin confirmar" se convierte en "hackearon a la Policía" en dos reenvíos.

Y un detalle que vale anotar: el alias al que se atribuye esta publicación **difiere en un carácter** del que los medios atribuyeron a lo de Claro. Puede ser la misma persona, un error de transcripción de alguien, o un imitador montado en el nombre del momento. Yo no lo sé, y quien te diga que sí tampoco lo sabe.

Veredicto: fuente honesta sobre su propia incertidumbre. Los reenvíos no lo serán.

## El marcador

Cinco filtros: uno con evidencia parcial, tres sin datos, uno que describe al mensajero. **Eso no es "falso". Es "no se sabe".** Y no se sabe es una respuesta completa — la única honesta hoy.

## Qué hacer si tú denunciaste algo

Aquí el consejo no es el de Claro. No hay segundo factor que mover.

**Si te llaman "de la Policía" con detalles de tu caso, eso ya no prueba nada.** Conocer tu denuncia no demuestra que quien llama es un agente. Si te piden dinero, datos o que vayas a algún sitio: cuelga, y verifica tú en tu destacamento o por los canales oficiales.

**Si denunciaste a un agresor y esto te preocupa**, la Línea Mujer del Ministerio de la Mujer es el `*212`: gratuita, confidencial, 24 horas, y se marca desde cualquier celular de Altice, Claro o Viva. No esperes a que alguien confirme nada para llamar.

**Y no vayas a buscar si apareces en el archivo.** Es la reacción natural y es exactamente la que aprovecha un anzuelo.

## Lo que nos toca a los que construimos sistemas

La recomendación técnica de la alerta es la parte más útil, y aplica a cualquiera: auditar los registros de acceso para identificar qué usuario o qué IP hizo consultas masivas o exportó 10,000 registros recientemente.

La pregunta incómoda es si tu sistema puede responderla. ¿Queda registrado quién exporta? ¿Salta una alerta cuando una cuenta lee diez mil filas en una tarde? Un sistema con más de 170 puntos de entrada tiene más de 170 conjuntos de credenciales; la pregunta nunca es si una se va a comprometer, sino cuánto puede leer antes de que alguien lo note.

Esa capacidad —poder decir en horas "sí fue nuestro" o "no lo fue"— es la misma que pedí en el post de Claro. Cuatro días después vuelve a ser la pieza que falta.

**Fuentes:** la alerta es de VECERT Analyzer, marcada como no confirmada por la propia cuenta · [Policía Nacional, sobre el SPGD](https://www.policianacional.gob.do/policia-nacional-moderniza-certificaciones-vehiculares-y-denuncias-con-plataforma-digital/) · [Portal de denuncias](https://denuncias.policia.gob.do/) · [Línea Mujer *212](https://mujer.gob.do/index.php/servicios/linea-mujer-212)
