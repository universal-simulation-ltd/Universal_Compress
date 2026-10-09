import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'Lo básico',
    title: 'Qué hace realmente la compresión',
    summary: 'Cómo un archivo puede guardar lo mismo en menos bytes.',
    body: `Cada archivo de su dispositivo es una larga fila de números llamados bytes. Comprimir consiste en describir lo mismo con menos bytes.

## Encontrar patrones

La mayoría de los archivos están llenos de repeticiones. Una página de texto usa las mismas palabras una y otra vez. Una foto de un cielo azul tiene miles de píxeles vecinos casi del mismo color. La grabación de alguien que habla tiene largos tramos de casi silencio.

Un compresor busca esos patrones y los anota de forma abreviada. En lugar de guardar «azul, azul, azul, azul» mil veces, puede guardar «azul, mil veces». El archivo resultante es más pequeño, y un programa que entiende esa abreviatura reconstruye la imagen, el sonido o la página cuando usted lo abre.

## Prescindir de lo que no notaría

Las imágenes, el vídeo y el sonido pueden reducirse mucho más si además se descartan detalles que difícilmente se perciben: pequeñas variaciones de color, sonidos tapados por otros más fuertes, texturas finas en una escena rápida. De ahí salen los ahorros más grandes, y ahí es también donde la calidad puede resentirse si se exagera.

## Por qué importa

Un archivo más pequeño se envía antes, cabe en los límites de los adjuntos de correo, ocupa menos espacio en el teléfono y se carga más rápido en una página web. El equilibrio siempre se reduce a la misma pregunta: ¿cuánto está dispuesto a ceder para conseguirlo? Universal Compress hace esa pregunta una sola vez, con **Light** (ligero), **Balanced** (equilibrado) o **Maximum** (máximo), y resuelve los detalles para cada tipo de archivo.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'Lo básico',
    title: 'Compresión sin pérdida y con pérdida',
    summary: 'La diferencia entre reempaquetar un archivo y volver a codificarlo.',
    body: `Hay dos familias de compresión, y saber cuál se está usando le indica qué esperar del resultado.

## Sin pérdida

La compresión sin pérdida conserva cada byte del original. Al abrir el archivo, se reconstruye exactamente como era, hasta el último detalle. Los archivos ZIP funcionan así, igual que el formato de imagen PNG.

El inconveniente es que el ahorro es limitado. Solo se pueden eliminar repeticiones, y una vez eliminadas no queda nada más que quitar.

## Con pérdida

La compresión con pérdida reconstruye algo que se ve o se oye muy parecido al original, pero no idéntico. Las fotos JPEG, el audio MP3 y AAC y casi todo el vídeo funcionan así. Como el detalle se descarta para siempre, estos formatos pueden hacer los archivos muchas veces más pequeños.

De ello se derivan dos cosas:

- **La pérdida es permanente.** Comprimir una copia no tiene problema; conserve el original si puede necesitar la calidad completa más adelante.
- **Repetirlo se acumula.** Cada compresión con pérdida descarta un poco más, así que volver a comprimir un archivo ya comprimido suele costar calidad a cambio de un ahorro pequeño.

## En Universal Compress

- Un PDF en **Light** se reempaqueta sin pérdida. El texto sigue siendo seleccionable y se puede buscar, y el ahorro suele ser modesto.
- Un PDF en **Balanced** o **Maximum** convierte cada página en una imagen. El ahorro suele ser grande, sobre todo en documentos escaneados, pero el texto ya no se puede seleccionar ni buscar.
- Las imágenes, el vídeo y el audio se vuelven a codificar en formatos con pérdida. El nivel elegido fija cuánto detalle se cambia por tamaño, y las opciones de Fine-tune le permiten fijar los valores exactos usted mismo.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'Lo básico',
    title: 'Por qué algunos archivos apenas se reducen',
    summary: 'Archivos ya comprimidos, y por qué se rechazan los ZIP.',
    body: `A veces comprime un archivo y sale casi del mismo tamaño, o incluso más grande. No es un fallo: normalmente significa que el archivo ya estaba comprimido.

## La compresión solo funciona una vez

La compresión elimina repeticiones. Cuando eso ya se ha hecho bien, el resultado parece casi aleatorio, y los datos aleatorios no tienen patrones que quitar. Un segundo compresor no encuentra nada que hacer, y sus propios datos de control pueden incluso hacerlo algo mayor.

Suelen estar ya comprimidos:

- **Los archivos comprimidos** como ZIP, RAR, 7z y .gz.
- **Los documentos de Office** en los formatos modernos de Word, Excel y PowerPoint, que por dentro son archivos ZIP.
- **Las fotos y los vídeos** tal como salen del teléfono, que ya se guardan en formatos con pérdida.
- **Los PDF** creados con cuidado por el programa que los generó.

## Qué hace Universal Compress al respecto

- No intenta comprimir archivos ZIP, RAR, 7z o .gz, ni archivos de Word, Excel y PowerPoint. Los mantiene en la lista con una frase que explica el motivo. Para una presentación o un documento, suele ser mejor exportarlo primero a PDF y comprimir ese PDF.
- Si al comprimir un archivo el resultado fuera del mismo tamaño o mayor, la aplicación le devuelve **su archivo original** y lo indica en su fila, en lugar de entregarle algo peor.
- Antes de empezar, cada nivel muestra una estimación del tamaño que produciría, para que vea de antemano si merece la pena un ajuste más fuerte.

## Conseguir un ahorro mayor

Si una foto o un vídeo apenas se reduce en Light, pruebe Balanced o Maximum. Estos niveles también reducen el tamaño de la imagen en píxeles, que es donde suele estar el ahorro real. En un PDF de páginas escaneadas, Balanced suele marcar una gran diferencia.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'Cómo funciona',
    title: 'Cómo funciona Universal Compress',
    summary: 'Un solo ajuste de intensidad, adaptado a cada tipo de archivo.',
    body: `Suelte cualquier mezcla de archivos y la aplicación los ordena por tipo: PDF, vídeos, imágenes y audio. Cada tipo tiene su propio panel de opciones, pero todos comparten un mismo control.

## Light, Balanced, Maximum

El control de intensidad hace la misma pregunta para cada archivo: ¿cuánto hay que comprimir? Luego cada tipo de archivo convierte su respuesta en sus propios ajustes:

- **PDF.** Light reempaqueta el archivo sin pérdida. Balanced convierte las páginas en imágenes con resolución de impresión. Maximum hace lo mismo con resolución de pantalla.
- **Vídeo.** Light mantiene el tamaño de imagen original. Balanced limita la imagen a 1080p y reduce la tasa de bits. Maximum la limita a 720p con la tasa de bits más baja.
- **Imágenes.** Light vuelve a codificar con calidad alta y a tamaño completo. Balanced limita el lado más largo a 2560 píxeles. Maximum lo limita a 1600 píxeles con menor calidad.
- **Audio.** Light es 192 kbps, Balanced 128 kbps y Maximum 96 kbps mezclado en mono.

En vídeo, imágenes y audio, todo lo que elige un nivel se muestra en **Fine-tune**, donde puede cambiar cualquier valor.

## Conviene saber

- **Formatos de salida.** El vídeo sale en MP4. El audio sale en MP3 o M4A. Las fotos JPEG y WebP mantienen su formato por defecto, y AVIF también cuando el navegador puede escribirlo. Las imágenes PNG, BMP, GIF estáticos y HEIC de iPhone pasan a WebP por defecto, porque suele ser mucho más pequeño. Puede elegir JPEG o WebP en su lugar.
- **Los GIF animados siguen animados.** Reciben un tratamiento propio, y en Maximum se elimina uno de cada dos fotogramas manteniendo la duración de la animación.
- **El vídeo necesita un navegador compatible.** La compresión de vídeo usa el codificador de vídeo integrado en el navegador, presente en Chrome, Edge y Safari 16.4 o posterior. Los PDF, las imágenes y el audio funcionan en cualquier navegador actual.
- **Algunos contenedores de vídeo no son compatibles.** MP4, M4V y MOV funcionan. MKV, WebM, AVI, WMV y FLV deben convertirse primero a MP4.
- **¿No tiene un archivo a mano?** **Try with an example photo**, en la primera pantalla, carga una foto de ejemplo incluida en la aplicación, para que vea lo que hace antes de usar sus propios archivos. Como todo lo demás, nunca sale de su dispositivo.
- **Guardar.** Descargue los archivos de uno en uno, o todos a la vez en un ZIP. Ese ZIP solo agrupa los resultados; no los comprime más.
- **Pruebe de nuevo cuando quiera.** Cambie el nivel y vuelva a comprimir toda la lista para comparar tamaños.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Privacidad y seguridad',
    title: 'Sus archivos se quedan en su dispositivo',
    summary: 'Qué se envía a un servidor y qué nunca se envía.',
    body: `Universal Compress hace todo su trabajo en su propio dispositivo. Sus archivos no se suben a ningún sitio para comprimirlos.

## Dónde se hace el trabajo

Cuando suelta un archivo, lo lee la aplicación que se ejecuta en su dispositivo. Los PDF se procesan con bibliotecas PDF de código abierto que funcionan dentro de la aplicación. Las imágenes se vuelven a codificar con las herramientas de imagen de su navegador. El vídeo usa el codificador de vídeo integrado en su navegador. El audio lo descodifica su navegador y lo codifica un codificador MP3 o AAC que funciona dentro de la aplicación. Los resultados se guardan directamente en su dispositivo, o se pasan al menú de compartir en un teléfono.

Sus archivos solo se mantienen en memoria mientras la aplicación está abierta. La aplicación no los almacena, y desaparecen al cerrarla.

Como no se sube nada, no hay límite de tamaño ni cupo diario. El único límite es la memoria de su dispositivo.

## Qué envía la aplicación

La aplicación sí hace algunas peticiones pequeñas que no tienen nada que ver con sus archivos:

- **Iniciar sesión**, si usted lo decide. Nada en la aplicación exige una cuenta.
- **Un aviso de «aplicación abierta»** cuando ha iniciado sesión, para que la actividad de su Universal ID sea correcta. No dice nada de sus archivos.
- **Una señal de «aplicación en uso»** cada 45 segundos mientras la aplicación está abierta y en pantalla. Contiene el nombre de la aplicación, un identificador aleatorio creado en su dispositivo y su cuenta si ha iniciado sesión. Sirve para mostrar cuántas personas usan la aplicación.
- **La búsqueda de actualizaciones** y la descarga de la lista de novedades.

No hay publicidad ni seguimiento de terceros.

## Compruébelo usted mismo

La prueba más sencilla es desconectar internet y comprimir algo. Sigue funcionando, porque nada necesita salir de su dispositivo. La aplicación además es de código abierto, así que cualquiera puede leer exactamente lo que hace.`,
  },
]

export default articles
