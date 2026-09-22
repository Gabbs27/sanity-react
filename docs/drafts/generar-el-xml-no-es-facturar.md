El sábado 12 de septiembre construí un emisor de comprobantes fiscales electrónicos, los e-CF de la DGII. Arma el XML de la factura, lo firma con el certificado digital del negocio, lo valida contra el esquema oficial y te imprime la representación con su código QR. Está en mi portafolio, con [una demo](https://invoice-generator-orpin-nine.vercel.app) que cualquiera puede probar.

En su primera pantalla dice, con estas palabras: *"usar esta herramienta no te hace emisor electrónico"*.

Esa frase no es modestia. Es lo más importante que aprendí construyéndolo, y es lo que más se confunde ahora que las fechas están encima: **generar el XML no es facturar.**

Las fechas son estas:

- **Grandes locales y medianos:** desde el **1 de noviembre** solo pueden emitir e-CF. Sus secuencias B valen hasta el 31 de octubre.
- **Pequeños, micro y no clasificados:** el plazo para implementar vence el **15 de noviembre**.

## Lo que dicen la ley y el reglamento

La Ley 32-23 le dio a cada grupo un plazo contado desde mayo de 2023: 12 meses a los grandes contribuyentes nacionales, 24 a los grandes locales y medianos, y 36 al resto. Así se ha ido cumpliendo:

- **Grandes nacionales:** su plazo venció el 15 de mayo de 2024. Sus comprobantes B se dieron por vencidos el 31 de diciembre de 2025.
- **Grandes locales y medianos:** plazo el 15 de mayo de 2025, prorrogado seis meses para quien ya había solicitado ser emisor. Solo e-CF desde el 1 de noviembre de 2026.
- **Pequeños, micro y no clasificados:** plazo el 15 de mayo de 2026, prorrogado seis meses de forma automática, hasta el 15 de noviembre.

Antes de apostar a otra prórroga, conviene leer dos artículos del reglamento de la ley, el Decreto 587-24. El artículo 8 dice que la prórroga es "de carácter único" y que no puede pasar de seis meses. La de los pequeños ya se dio, y fue de seis meses exactos. El artículo 55 dice que a quien no implemente a tiempo, la DGII le considera vencidos sus comprobantes.

A los dos grupos anteriores, la DGII les anunció después una fecha para dejar la serie B. A los pequeños todavía no se la ha anunciado, y eso no te da tiempo extra: el 15 de noviembre es la fecha para estar **autorizado como emisor electrónico**. Según el aviso de la prórroga, quien no haya implementado queda expuesto a las sanciones del artículo 27 de la ley, que remite al Código Tributario: multas de 5 a 30 salarios mínimos por incumplir deberes formales.

## Lo que construí, y lo que no hace

Mi emisor hace la parte que uno imagina cuando piensa en factura electrónica. Arma el XML de la factura de crédito fiscal (tipo 31) y de la factura de consumo (tipo 32), lo firma, lo valida y lo guarda. Cada comprobante lleva un e-NCF de 13 caracteres: una `E`, dos dígitos de tipo y diez de secuencia, como `E310000000001`.

La parte de generar, firmar, validar e imprimir me tomó un sábado, con Claude Code al lado.

Lo que no hace es enviarlo a la DGII, y eso lo cambia todo. La pregunta 1.4.12 de las preguntas frecuentes de la propia DGII lo dice sin rodeos: si Impuestos Internos no recibe el e-CF, este **carece de validez tributaria**, y el receptor no puede usar el crédito fiscal.

O sea, un PDF con su QR, firmado y validado, que la DGII nunca recibió, no le sirve a tu cliente para su crédito fiscal. Por eso la advertencia va en la primera pantalla y no escondida en el README.

## Lo que aprendí armando la parte fácil

La parte "fácil" también tiene trampas que no salen en ningún tutorial.

**Un espacio rompe el esquema de la factura de crédito fiscal.** Para validar un e-CF se usan los esquemas XSD que publica la DGII. El del tipo 31, la factura que se usa entre empresas, define uno de sus tipos así:

```
<xs:simpleType name=" IndicadorServicioTodoIncluidoType">
```

Fíjate en el espacio antes de `Indicador`. El resto del archivo busca ese tipo por su nombre, sin el espacio. El validador que trae Java recorta el espacio y sigue como si nada. libxml2 no lo hace. Es el motor de `xmllint`, de `lxml` en Python, de `DOMDocument` en PHP y del paquete de Node que usa mi emisor, y se niega a cargar el esquema:

```
The QName value 'IndicadorServicioTodoIncluidoType' does not resolve to a(n) type definition.
WXS schema e-CF 31 v.1.0.xsd failed to compile
```

Los esquemas de los tipos 32, 33, 34, 44 y 45 definen el mismo tipo sin el espacio. Hoy lo volví a comprobar contra lo que publica la DGII, y el archivo sigue igual.

Y confieso algo: yo tardé en verlo. En el repo dejé escrito que el esquema usaba un tipo que nunca definía. Sí lo definía, con un espacio de más, y mi búsqueda de texto no lo encontraba por ese mismo espacio.

**El ejemplo oficial de la firma trae tres URIs mal escritas.** La DGII publica un documento, *Firmado de e-CF*, con ejemplos de cómo firmar. El XML que muestra la estructura de la firma trae estas tres:

```
http://www.w3.org/TR/2001/RECxml-c14n-20010315
http://www.w3.org/2001/04/xmldsigmore#rsa-sha256
http://www.w3.org/2000/09/xmldsig#envelope d-signature
```

Deberían decir `REC-xml-c14n`, `xmldsig-more` y `enveloped-signature`. El ejemplo en TypeScript del mismo documento las escribe bien. Pero si armas tu firma copiando ese XML, no pasa: lo probé con `xml-crypto`, y contesta que ese algoritmo de canonicalización *"is not supported"*. Además, una firma inválida no es un error barato. Según la pregunta 1.4.18, si la DGII rechaza un e-CF por la firma, ese e-NCF no se puede volver a usar.

**El portal le contesta 403 a un script.** Los esquemas se bajan del portal de la DGII. Con `curl`, la respuesta es 403; con el User-Agent de un navegador, 200. Lo volví a probar hoy. Durante un rato di por hecho que la DGII bloqueaba las descargas automáticas, y lo escribí en el plan del proyecto. No las bloquea: filtra por User-Agent. Eso importa porque los esquemas hay que revisarlos antes de cada versión. Los de las notas de débito y de crédito cambiaron el 1 de abril de 2026, casi seis meses después que los demás.

**El riesgo de verdad no es el XML, es la secuencia.** Dos comprobantes no pueden llevar el mismo número, y no te puedes pasar del rango que te autorizó la DGII. En mi emisor, cada factura se guarda en un archivo que lleva su e-NCF como nombre, y se escribe así:

```js
writeFileSync(`datos/facturas/${encf}.xml`, xml, { flag: 'wx' });
```

Con `wx`, la escritura falla si el archivo ya existe. Cumple el mismo papel que un índice único en una base de datos: un duplicado explota en vez de pasar callado. Y el número siguiente se calcula leyendo lo que ya se emitió, no con un contador que se pueda equivocar.

## Emitir te obliga a recibir

Esta fue la sorpresa grande, y es la razón de fondo por la que mi emisor no te pone al día.

Uno piensa en la factura electrónica como algo que sale: tu sistema firma y manda. Pero el artículo 18 del reglamento dice que **todo emisor electrónico será también receptor electrónico**. Tus proveedores que ya emiten e-CF te los van a mandar a ti, y tu sistema tiene que recibirlos, acusar recibo y aprobarlos o rechazarlos.

Por eso, para certificarte con un sistema propio, la DGII te pide tres direcciones de servicios web. Una para **recibir** los e-CF que te emitan. Otra para recibir las **aprobaciones comerciales** de lo que tú emites. Y una de **autenticación**, donde se firma un archivo "semilla" con el certificado digital y se devuelve un token. Después vienen las pruebas de datos, de simulación y de comunicación.

Mi emisor solo escucha en `127.0.0.1`, es decir, en la computadora donde corre. Lo hice así a propósito, para que el certificado digital del negocio nunca salga de esa máquina. Para certificarse, tendría que abrirle tres puertas a internet. Esa es la tensión real, y no se resuelve con un XML bien hecho.

## Si tienes un negocio: tres caminos y una pregunta

La DGII reconoce tres vías para emitir: un sistema de desarrollo propio, un proveedor de servicios de facturación electrónica certificado, o su Facturador Gratuito.

- **El Facturador Gratuito** no cuesta nada y no te obliga a pasar la certificación. Está pensado para poco volumen: la DGII habla de unas 150 facturas al mes. Igual necesitas RNC, Alta NCF, acceso a la Oficina Virtual y un certificado digital para procedimientos tributarios. Ese certificado va a tu nombre o al de tu representante, no al del contador.
- **Un proveedor certificado** tiene que ofrecerte, por reglamento, el paquete completo: emitir y recibir, los acuses de recibo, las aprobaciones comerciales y el resguardo de tus comprobantes.
- **El desarrollo propio** es el camino de las tres direcciones y las pruebas de arriba. Con 55 días por delante, yo no lo empezaría hoy sin un equipo técnico detrás.

Si vas con un proveedor, hay una pregunta que vale más que la demo: **¿quién guarda mi certificado?** El artículo 22 del reglamento permite dos modelos. En uno, la firma se hace en tu infraestructura y el certificado se queda contigo. En el otro, el proveedor te da su software como servicio y **custodia tu certificado en la suya**. Para eso necesita una interconexión con una entidad de certificación autorizada por el INDOTEL, o un permiso del INDOTEL para firmar en nombre de otros. Ese certificado firma comprobantes a tu nombre ante la DGII. Pregunta en cuál de los dos modelos estás, y pide que te lo pongan por escrito.

## Si eres dev

Si te piden "hacer la factura electrónica", pregunta primero qué parte. Generar, firmar y validar el XML me tomó un sábado. Recibir, aprobar, autenticar, pasar la certificación y mantenerte al día cada vez que la DGII cambie un esquema ya es un producto.

Mi emisor sigue diciendo en su primera pantalla que no te hace emisor electrónico. Después de construirlo, es la frase de la que estoy más seguro.

**Fuentes:** [Aviso 14-26, emisión exclusiva de e-CF](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/14-26.pdf) · [Aviso 06-26, prórroga de pequeños, micro y no clasificados](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/06-26.pdf) · [Aviso 12-25](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/12-25.pdf) · [Aviso 25-25](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/25-25.pdf) · [Ley 32-23](https://dgii.gov.do/legislacion/leyesTributarias/Documents/Otras%20Leyes%20de%20Inter%C3%A9s/32-23.pdf) · [Decreto 587-24](https://dgii.gov.do/legislacion/decretos/Documents/2024/Decreto587-24.pdf) · [Preguntas frecuentes de e-CF](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas%20Frecuentes%20e-CF%20Generales.pdf) · [Preguntas frecuentes del Facturador Gratuito](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas-Frecuentes-Facturador-Gratuito.pdf) · [Documentación técnica y esquemas XSD](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/documentacionSobreE-CF.aspx) · [El código del emisor](https://github.com/Gabbs27/invoice-generator)
