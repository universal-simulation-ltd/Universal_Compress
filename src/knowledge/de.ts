import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'Grundlagen',
    title: 'Was Komprimierung eigentlich macht',
    summary: 'Wie eine Datei dasselbe mit weniger Bytes speichern kann.',
    body: `Jede Datei auf Ihrem Gerät ist eine lange Reihe von Zahlen, den sogenannten Bytes. Komprimieren heißt, dasselbe mit weniger Bytes zu beschreiben.

## Muster erkennen

Die meisten Dateien stecken voller Wiederholungen. Eine Textseite verwendet immer wieder dieselben Wörter. Ein Foto von blauem Himmel hat Tausende benachbarter Pixel in fast derselben Farbe. Die Aufnahme einer sprechenden Person enthält lange Abschnitte nahezu ohne Ton.

Ein Kompressor findet solche Muster und notiert sie in Kurzform. Statt tausendmal „blau, blau, blau, blau“ zu speichern, kann er „blau, tausendmal“ speichern. Die entstehende Datei ist kleiner, und ein Programm, das diese Kurzform versteht, baut Bild, Ton oder Seite beim Öffnen wieder auf.

## Weglassen, was Sie nicht bemerken würden

Bilder, Video und Ton lassen sich noch viel stärker verkleinern, wenn zusätzlich Details entfernt werden, die kaum jemand bemerkt: winzige Farbunterschiede, Töne, die von lauteren überdeckt werden, feine Strukturen in einer schnellen Szene. Daher kommen die wirklich großen Einsparungen, und genau hier kann auch die Qualität leiden, wenn man es übertreibt.

## Warum das wichtig ist

Kleinere Dateien sind schneller verschickt, passen unter die Größengrenzen für E-Mail-Anhänge, belegen weniger Platz auf dem Telefon und laden auf einer Webseite schneller. Der Kompromiss läuft immer auf dieselbe Frage hinaus: Wie viel sind Sie bereit dafür aufzugeben? Universal Compress stellt diese Frage nur einmal, mit **Light** (leicht), **Balanced** (ausgewogen) oder **Maximum**, und regelt die Einzelheiten für jede Dateiart.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'Grundlagen',
    title: 'Verlustfreie und verlustbehaftete Komprimierung',
    summary: 'Der Unterschied zwischen dem Neupacken und dem Neucodieren einer Datei.',
    body: `Es gibt zwei Arten der Komprimierung, und wenn Sie wissen, welche gerade arbeitet, wissen Sie auch, was Sie vom Ergebnis erwarten können.

## Verlustfrei

Verlustfreie Komprimierung behält jedes Byte des Originals. Beim Öffnen wird die Datei exakt so wiederhergestellt, wie sie war, bis ins letzte Detail. ZIP-Archive arbeiten so, ebenso das Bildformat PNG.

Der Haken: Die Einsparung ist begrenzt. Entfernt werden können nur Wiederholungen, und sind diese einmal entfernt, bleibt nichts mehr übrig.

## Verlustbehaftet

Verlustbehaftete Komprimierung stellt etwas her, das dem Original sehr ähnlich sieht oder klingt, aber nicht identisch ist. JPEG-Fotos, MP3- und AAC-Audio und nahezu jedes Video arbeiten so. Weil Details dauerhaft verworfen werden, können diese Formate Dateien um ein Vielfaches verkleinern.

Daraus folgt zweierlei:

- **Der Verlust ist endgültig.** Eine Kopie zu komprimieren ist unproblematisch; behalten Sie das Original, falls Sie später die volle Qualität brauchen.
- **Wiederholung summiert sich.** Jede verlustbehaftete Komprimierung verwirft etwas mehr. Eine bereits komprimierte Datei erneut zu komprimieren kostet daher meist Qualität für eine kleine Einsparung.

## In Universal Compress

- Ein PDF wird mit **Light** verlustfrei neu gepackt. Der Text bleibt markierbar und durchsuchbar, die Einsparung ist meist bescheiden.
- Mit **Balanced** oder **Maximum** wird jede Seite eines PDFs zu einem Bild. Die Einsparung ist oft groß, besonders bei Scans, aber der Text lässt sich danach nicht mehr markieren oder durchsuchen.
- Bilder, Video und Audio werden in verlustbehaftete Formate neu codiert. Die gewählte Stufe legt fest, wie viel Detail gegen Größe getauscht wird, und unter Advanced können Sie die genauen Werte selbst einstellen.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'Grundlagen',
    title: 'Warum manche Dateien kaum kleiner werden',
    summary: 'Bereits komprimierte Dateien und warum ZIPs abgelehnt werden.',
    body: `Manchmal komprimieren Sie eine Datei, und sie ist danach fast genauso groß oder sogar größer. Das ist kein Fehler, sondern bedeutet meist, dass die Datei schon komprimiert war.

## Komprimierung wirkt nur einmal

Komprimierung entfernt Wiederholungen. Ist das bereits gut erledigt, wirkt das Ergebnis fast zufällig, und zufällige Daten enthalten keine Muster mehr, die man entfernen könnte. Ein zweiter Kompressor findet nichts zu tun, und seine eigenen Verwaltungsdaten können die Datei sogar etwas vergrößern.

Meist schon komprimiert sind:

- **Archive** wie ZIP, RAR, 7z und .gz.
- **Office-Dokumente** in den modernen Formaten von Word, Excel und PowerPoint, die intern ZIP-Archive sind.
- **Fotos und Videos** direkt vom Telefon, die bereits in verlustbehafteten Formaten gespeichert sind.
- **PDFs**, die das erzeugende Programm sorgfältig erstellt hat.

## Was Universal Compress dagegen tut

- Es versucht nicht, ZIP-, RAR-, 7z- oder .gz-Archive oder Word-, Excel- und PowerPoint-Dateien zu komprimieren. Sie bleiben mit einem erklärenden Satz in der Liste. Bei einer Präsentation oder einem Dokument ist es oft besser, zuerst ein PDF zu exportieren und dieses zu komprimieren.
- Würde eine Datei durch das Komprimieren gleich groß oder größer, gibt Ihnen die App **Ihre Originaldatei** zurück und vermerkt das in der entsprechenden Zeile, statt Ihnen etwas Schlechteres zu liefern.
- Vor dem Start zeigt jede Stufe eine Schätzung der zu erwartenden Größe, damit Sie vorab sehen, ob sich eine stärkere Einstellung lohnt.

## Mehr einsparen

Wird ein Foto oder Video mit Light kaum kleiner, versuchen Sie Balanced oder Maximum. Diese Stufen verringern auch die Pixelmaße des Bildes, und dort liegt meist die eigentliche Einsparung. Bei einem PDF aus gescannten Seiten macht Balanced oft einen großen Unterschied.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'So funktioniert es',
    title: 'So funktioniert Universal Compress',
    summary: 'Eine Stärke-Einstellung, übersetzt für jede Dateiart.',
    body: `Ziehen Sie eine beliebige Mischung von Dateien hinein, und die App sortiert sie nach Art: PDFs, Videos, Bilder und Audio. Jede Art hat ihr eigenes Optionsfeld, aber alle teilen sich einen Regler.

## Light, Balanced, Maximum

Der Stärke-Regler stellt für jede Datei dieselbe Frage: Wie stark soll komprimiert werden? Jede Dateiart übersetzt Ihre Antwort dann in ihre eigenen Einstellungen:

- **PDF.** Light packt die Datei verlustfrei neu. Balanced macht die Seiten zu Bildern in Druckauflösung. Maximum tut dasselbe in Bildschirmauflösung.
- **Video.** Light behält die ursprüngliche Bildgröße. Balanced begrenzt das Bild auf 1080p und senkt die Bitrate. Maximum begrenzt es auf 720p mit der niedrigsten Bitrate.
- **Bilder.** Light codiert in hoher Qualität und voller Größe neu. Balanced begrenzt die längste Kante auf 2560 Pixel. Maximum begrenzt sie auf 1600 Pixel bei geringerer Qualität.
- **Audio.** Light entspricht 192 kbit/s, Balanced 128 kbit/s und Maximum 96 kbit/s in Mono.

Bei Video, Bildern und Audio wird alles, was eine Stufe festlegt, unter **Advanced** angezeigt, wo Sie jeden Wert ändern können.

## Gut zu wissen

- **Ausgabeformate.** Video wird als MP4 ausgegeben, Audio als MP3 oder M4A. JPEG- und WebP-Fotos behalten standardmäßig ihr Format, AVIF ebenfalls, sofern der Browser es schreiben kann. PNG-, BMP-, unbewegte GIF- und iPhone-HEIC-Bilder werden standardmäßig zu WebP, weil das meist deutlich kleiner ist. Stattdessen können Sie JPEG oder WebP wählen.
- **Animierte GIFs bleiben animiert.** Sie werden gesondert behandelt, und mit Maximum wird jedes zweite Einzelbild entfernt, während die Animation ihre Länge behält.
- **Video braucht einen geeigneten Browser.** Die Videokomprimierung nutzt den eingebauten Video-Encoder des Browsers, den Chrome, Edge und Safari ab 16.4 mitbringen. PDFs, Bilder und Audio funktionieren in jedem aktuellen Browser.
- **Manche Videocontainer werden nicht unterstützt.** MP4, M4V und MOV funktionieren. MKV, WebM, AVI, WMV und FLV müssen zuerst in MP4 umgewandelt werden.
- **Speichern.** Laden Sie die Dateien einzeln herunter oder alle zusammen als ZIP. Dieses ZIP bündelt die Ergebnisse nur; es komprimiert sie nicht weiter.
- **Beliebig oft ausprobieren.** Ändern Sie die Stufe und komprimieren Sie die ganze Liste erneut, um die Größen zu vergleichen.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Datenschutz und Sicherheit',
    title: 'Ihre Dateien bleiben auf Ihrem Gerät',
    summary: 'Was an einen Server geht und was nie.',
    body: `Universal Compress erledigt die gesamte Arbeit auf Ihrem eigenen Gerät. Ihre Dateien werden zum Komprimieren nirgendwohin hochgeladen.

## Wo die Arbeit stattfindet

Wenn Sie eine Datei hineinziehen, liest die App sie auf Ihrem Gerät. PDFs werden von Open-Source-PDF-Bibliotheken verarbeitet, die in der App laufen. Bilder werden mit den Bildwerkzeugen Ihres Browsers neu codiert. Video nutzt den eingebauten Video-Encoder Ihres Browsers. Audio wird von Ihrem Browser decodiert und von einem MP3- oder AAC-Encoder codiert, der in der App läuft. Die Ergebnisse werden direkt auf Ihrem Gerät gespeichert oder auf dem Telefon an das Teilen-Menü übergeben.

Ihre Dateien liegen nur so lange im Arbeitsspeicher, wie die App geöffnet ist. Die App speichert sie nicht, und beim Schließen sind sie weg.

Da nichts hochgeladen wird, gibt es weder eine Größengrenze noch ein Tageskontingent. Die einzige Grenze ist der Arbeitsspeicher Ihres Geräts.

## Was die App sendet

Die App stellt einige kleine Anfragen, die nichts mit Ihren Dateien zu tun haben:

- **Die Anmeldung**, falls Sie sich dafür entscheiden. Nichts in der App erfordert ein Konto.
- **Eine Meldung „App geöffnet“**, wenn Sie angemeldet sind, damit die Aktivität Ihrer Universal ID stimmt. Sie enthält nichts über Ihre Dateien.
- **Ein Signal „App in Benutzung“** alle 45 Sekunden, solange die App geöffnet und sichtbar ist. Es enthält den Namen der App, eine zufällige, auf Ihrem Gerät erzeugte Kennung und Ihr Konto, falls Sie angemeldet sind. Damit wird angezeigt, wie viele Menschen die App nutzen.
- **Die Suche nach Updates** und das Abrufen der Liste der Neuerungen.

Es gibt keine Werbung und kein Tracking durch Dritte.

## Prüfen Sie es selbst

Der einfachste Test: Trennen Sie die Internetverbindung und komprimieren Sie etwas. Es funktioniert trotzdem, weil nichts Ihr Gerät verlassen muss. Die App ist außerdem Open Source, sodass jeder genau nachlesen kann, was sie tut.`,
  },
]

export default articles
