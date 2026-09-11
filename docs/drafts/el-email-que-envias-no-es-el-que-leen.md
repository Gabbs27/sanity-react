Escribes el HTML. Lo abres en tu cliente de correo. Se ve exactamente como lo diseñaste. Le das enviar.

Ahí empieza la parte que no viste. Entre tu botón de enviar y los ojos de quien lo recibe hay un programa que puede repintarte los colores, invertirte el fondo, tragarse tu logo, o no tocar absolutamente nada. Cuál de esas cuatro cosas pasa no depende de tu código. Depende de en qué aplicación abrió el correo esa persona.

"Se ve bien en mi cliente" es una afirmación verdadera. El problema es que se parece muchísimo a otra afirmación que no hiciste: "se ve bien".

## No hay un comportamiento de modo oscuro. Hay tres

La guía de Litmus sobre modo oscuro los agrupa así, y la diferencia entre los tres grupos es más grande de lo que uno se imagina:

**No cambian nada.** Apple Mail, Gmail en escritorio, AOL y Yahoo Mail dejan el HTML como llegó, sin importar si la interfaz del cliente está en oscuro.

**Invierten parcialmente.** Outlook.com y algunas apps de Outlook en celular convierten los fondos claros en oscuros y dejan tranquilos los que ya eran oscuros.

**Invierten todo.** La app de Gmail en iOS, Outlook 2021 en Windows y Office 365 en Windows invierten todos los colores, claros y oscuros por igual.

Lee ese último grupo otra vez. **Invierten también los fondos oscuros.** Si diseñaste una tarjeta oscura a propósito, en esos clientes sale clara. Tu decisión de diseño se convierte en un error de diseño sin que nadie tocara el código.

## Las dos etiquetas que declaran que te hiciste cargo

```html
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
```

Van en el `<head>` del correo y lo que hacen es avisarle al cliente que tú te ocupaste del modo oscuro, para que no te aplique su inversión automática por encima. Y el CSS:

```css
@media (prefers-color-scheme: dark) {
  body { background-color: #272623 !important; }
  h1, h2, p { color: #ffffff !important; }
}
```

Ese `!important` no es descuido. En email no compites contra tus propios estilos, compites contra los que el cliente inyecta encima de los tuyos.

## La trampa del blanco puro

Acá viene el detalle que se siente injusto y es real: si pones las etiquetas de arriba, **evita el blanco puro** (`#ffffff`) como fondo. Apple Mail lo invierte de todas formas. Un blanco roto, apenas fuera del blanco puro, se queda donde lo pusiste.

Y el logo. Si tu logo es un PNG con fondo transparente y letras oscuras, sobre un fondo oscuro desaparece — no se ve mal, se ve nada. La recomendación es darle un contorno translúcido para que siga siendo legible, o trabajar con tonos medios que tengan contraste suficiente contra los dos fondos.

Si quieres cambiar la imagen completa según el modo, `@media (prefers-color-scheme: dark)` te cubre la mayoría de los clientes, y para Outlook en Android hace falta el prefijo `[data-ogsc]`.

## Pero el modo oscuro no es tu problema más grande

Todo lo anterior es sobre cómo se ve. La investigación de Nielsen Norman Group es sobre algo más incómodo: cómo se lee.

Su reporte de usabilidad en newsletters viene de seis rondas de estudios a lo largo de dieciséis años, empezando en 2002, con usuarios reales en Estados Unidos, Australia, Inglaterra, Hong Kong, Japón y Suecia, probando más de 500 newsletters. De ahí salieron 199 guías de diseño en un documento de 537 páginas.

Los hallazgos que más cambian cómo escribes un correo:

**La gente escanea, no lee.** Esto lo sabemos para páginas web y se nos olvida para correos, que es donde más duele porque el correo compite contra otros cuarenta.

**Leer en el celular sigue siendo incómodo.** Los usuarios calificaron la facilidad de leer newsletters en el teléfono con un 3.3 sobre 7. No es un desastre; es mediocre, que es peor, porque nadie se queja.

**"Newsletter para móvil" es un nombre equivocado.** Solo el 7% de los newsletters se habrían leído únicamente en el teléfono. Lo normal es que la misma persona lo lea a veces en la computadora y a veces en el celular. No estás diseñando para un dispositivo, estás diseñando para una persona que cambia de dispositivo.

**El asunto y el remitente cargan casi todo el peso.** Y ahí la claridad le gana al ingenio siempre. El estudio cita un caso real de InterContinental Hotels: *"Open Your (I)s to the Wonders of the Sea"*. Un juego de palabras que alguien celebró en una reunión. La conclusión del estudio es que la gente sencillamente no tiene tiempo para descifrarlo.

**Lo valioso va al principio.** Cada vez menos gente pasa del primer bloque, así que enterrar lo bueno en el medio equivale a no haberlo escrito.

## La lista que sí se puede revisar antes de enviar

- **Texto alternativo descriptivo en cada imagen.** Cuando el cliente bloquea imágenes —y muchos lo hacen por defecto— el alt es el correo.
- **URLs absolutas.** Los clientes de correo no resuelven rutas relativas. Un `/imagenes/logo.png` sencillamente no existe ahí.
- **Imágenes en un host público.** Si están detrás de un login o de una red interna, nadie las va a ver.
- **Botones de 44 píxeles como mínimo.** Es el tamaño de un dedo, no una preferencia estética.
- **Contraste y tipografía.** La mayoría de los fallos de accesibilidad en correo se reducen a estas dos cosas, y son las dos que más fácil se revisan antes de enviar.

## Lo que no se arregla mirando

Todo lo de arriba se puede verificar. Lo que no se puede es mirar tu correo en tu cliente y concluir algo sobre el correo.

Es la misma trampa de siempre, con otro disfraz: comprobaste la superficie que tenías a mano, no la que lee tu destinatario. En un sitio web eso significa mirar el DOM en vez del HTML que sirve el servidor. En un correo significa mirar la única bandeja de entrada que tienes abierta y llamarle a eso una prueba.

La versión honesta de "se ve bien" es "se ve bien en Apple Mail, en modo claro, en una pantalla de laptop". Escrito así ya no se parece a una conclusión. Se parece a lo que es: un dato, de un cliente, de los tres grupos que existen.

**Fuentes:** [The Ultimate Guide to Dark Mode — Litmus](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers) · [E-Mail Newsletters: Increasing Usability — Nielsen Norman Group](https://www.nngroup.com/articles/e-mail-newsletters-usability/) · [Marketing Email and Newsletter Usability (reporte) — NN/g](https://www.nngroup.com/reports/email-newsletter-design/)
