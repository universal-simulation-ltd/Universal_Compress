import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'Le basi',
    title: 'Che cosa fa davvero la compressione',
    summary: 'Come un file può contenere la stessa cosa in meno byte.',
    body: `Ogni file sul tuo dispositivo è una lunga fila di numeri chiamati byte. Comprimere significa descrivere la stessa cosa usandone di meno.

## Trovare gli schemi

Quasi tutti i file sono pieni di ripetizioni. Una pagina di testo usa sempre le stesse parole. La foto di un cielo azzurro ha migliaia di pixel vicini quasi dello stesso colore. La registrazione di una persona che parla ha lunghi tratti di quasi silenzio.

Un compressore individua questi schemi e li annota in forma abbreviata. Invece di scrivere «azzurro, azzurro, azzurro, azzurro» mille volte, può scrivere «azzurro, mille volte». Il file che ne esce è più piccolo, e un programma che capisce l’abbreviazione ricostruisce l’immagine, il suono o la pagina quando lo apri.

## Tralasciare ciò che non noteresti

Immagini, video e suoni si possono ridurre molto di più eliminando anche dettagli che difficilmente si notano: piccole variazioni di colore, suoni coperti da altri più forti, trame sottili in una scena veloce. Da qui arrivano i risparmi più grandi, ed è anche qui che la qualità può risentirne se si esagera.

## Perché è utile

Un file più piccolo si invia prima, rientra nei limiti degli allegati email, occupa meno spazio sul telefono e si carica più in fretta in una pagina web. Il compromesso si riduce sempre alla stessa domanda: quanto sei disposto a cedere per arrivarci? Universal Compress fa questa domanda una volta sola, con **Light** (leggera), **Balanced** (bilanciata) o **Maximum** (massima), e sistema i dettagli per ogni tipo di file.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'Le basi',
    title: 'Compressione senza perdita e con perdita',
    summary: 'La differenza tra riorganizzare un file e ricodificarlo.',
    body: `Esistono due famiglie di compressione, e sapere quale è in uso ti dice cosa aspettarti dal risultato.

## Senza perdita

La compressione senza perdita conserva ogni byte dell’originale. Quando il file viene aperto, è ricostruito esattamente com’era, fino all’ultimo dettaglio. Gli archivi ZIP funzionano così, come il formato immagine PNG.

Il limite è che il risparmio è contenuto. Si possono togliere solo le ripetizioni, e una volta tolte non resta altro.

## Con perdita

La compressione con perdita ricostruisce qualcosa che appare o suona molto simile all’originale, ma non identico. Le foto JPEG, l’audio MP3 e AAC e quasi tutti i video funzionano così. Poiché i dettagli vengono scartati per sempre, questi formati possono rendere i file molto più piccoli.

Ne derivano due cose:

- **La perdita è permanente.** Comprimere una copia va benissimo; conserva l’originale se in futuro potresti aver bisogno della qualità piena.
- **Ripetere si somma.** Ogni compressione con perdita scarta un po’ di più, quindi ricomprimere un file già compresso di solito costa qualità in cambio di un piccolo risparmio.

## In Universal Compress

- Un PDF con **Light** viene riorganizzato senza perdita. Il testo resta selezionabile e ricercabile, e il risparmio di solito è modesto.
- Un PDF con **Balanced** o **Maximum** trasforma ogni pagina in un’immagine. Il risparmio è spesso grande, soprattutto per le scansioni, ma il testo non si può più selezionare né cercare.
- Immagini, video e audio vengono ricodificati in formati con perdita. Il livello che scegli stabilisce quanto dettaglio scambiare con la dimensione, e le opzioni in Advanced ti permettono di impostare i valori esatti.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'Le basi',
    title: 'Perché alcuni file si riducono appena',
    summary: 'File già compressi, e perché gli ZIP vengono rifiutati.',
    body: `A volte comprimi un file e ne esce quasi della stessa dimensione, o persino più grande. Non è un errore: di solito significa che il file era già compresso.

## La compressione funziona una volta sola

La compressione elimina le ripetizioni. Quando questo lavoro è già stato fatto bene, il risultato sembra quasi casuale, e i dati casuali non hanno schemi da togliere. Un secondo compressore non trova nulla da fare, e le sue informazioni di servizio possono perfino ingrandire un po’ il file.

Di solito sono già compressi:

- **Gli archivi** come ZIP, RAR, 7z e .gz.
- **I documenti Office** nei formati moderni di Word, Excel e PowerPoint, che al loro interno sono archivi ZIP.
- **Foto e video** appena usciti dal telefono, già salvati in formati con perdita.
- **I PDF** creati con cura dal programma che li ha prodotti.

## Che cosa fa Universal Compress

- Non prova a comprimere archivi ZIP, RAR, 7z o .gz, né file Word, Excel e PowerPoint. Li lascia nell’elenco con una frase che spiega il motivo. Per una presentazione o un documento, esportarlo prima in PDF e comprimere quel PDF è spesso la strada migliore.
- Se la compressione desse un file della stessa dimensione o più grande, l’app ti restituisce **il tuo file originale** e lo indica sulla sua riga, invece di darti qualcosa di peggiore.
- Prima di iniziare, ogni livello mostra una stima della dimensione che produrrebbe, così vedi in anticipo se conviene un’impostazione più forte.

## Ottenere un risparmio maggiore

Se una foto o un video si riduce appena con Light, prova Balanced o Maximum. Questi livelli riducono anche le dimensioni in pixel dell’immagine, ed è lì che di solito si trova il vero risparmio. Per un PDF fatto di pagine scansionate, Balanced spesso fa una grande differenza.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'Come funziona',
    title: 'Come funziona Universal Compress',
    summary: 'Un’unica impostazione di intensità, adattata a ogni tipo di file.',
    body: `Trascina qualsiasi combinazione di file e l’app li ordina per tipo: PDF, video, immagini e audio. Ogni tipo ha il proprio pannello di opzioni, ma tutti condividono un unico comando.

## Light, Balanced, Maximum

Il comando di intensità fa la stessa domanda per ogni file: quanto bisogna comprimere? Ogni tipo di file traduce poi la tua risposta nelle proprie impostazioni:

- **PDF.** Light riorganizza il file senza perdita. Balanced trasforma le pagine in immagini a risoluzione di stampa. Maximum fa lo stesso a risoluzione da schermo.
- **Video.** Light mantiene le dimensioni originali del fotogramma. Balanced limita l’immagine a 1080p e abbassa il bitrate. Maximum la limita a 720p con il bitrate più basso.
- **Immagini.** Light ricodifica ad alta qualità e a dimensione piena. Balanced limita il lato più lungo a 2560 pixel. Maximum lo limita a 1600 pixel con qualità più bassa.
- **Audio.** Light è 192 kbps, Balanced 128 kbps e Maximum 96 kbps mixato in mono.

Per video, immagini e audio, tutto ciò che un livello sceglie è visibile in **Advanced**, dove puoi modificare qualsiasi valore.

## Buono a sapersi

- **Formati di uscita.** Il video esce in MP4. L’audio esce in MP3 o M4A. Le foto JPEG e WebP mantengono il loro formato per impostazione predefinita, e anche AVIF quando il browser è in grado di scriverlo. Le immagini PNG, BMP, GIF statiche e HEIC dell’iPhone diventano WebP per impostazione predefinita, perché di solito è molto più piccolo. Puoi scegliere JPEG o WebP.
- **Le GIF animate restano animate.** Hanno un trattamento dedicato, e con Maximum viene eliminato un fotogramma su due mantenendo la durata dell’animazione.
- **Il video richiede un browser adatto.** La compressione video usa il codificatore video integrato nel browser, presente in Chrome, Edge e Safari 16.4 o successivi. PDF, immagini e audio funzionano in qualsiasi browser recente.
- **Alcuni contenitori video non sono supportati.** MP4, M4V e MOV funzionano. MKV, WebM, AVI, WMV e FLV vanno prima convertiti in MP4.
- **Nessun file a portata di mano?** **Try with an example photo**, nella prima schermata, carica una foto di esempio inclusa nell’app, così puoi vedere cosa fa prima di usare i tuoi file. Come tutto il resto, non lascia mai il tuo dispositivo.
- **Salvataggio.** Scarica i file uno alla volta, oppure tutti insieme in uno ZIP. Quello ZIP si limita a raccogliere i risultati; non li comprime ulteriormente.
- **Riprova quando vuoi.** Cambia livello e comprimi di nuovo tutto l’elenco per confrontare le dimensioni.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Privacy e sicurezza',
    title: 'I tuoi file restano sul tuo dispositivo',
    summary: 'Che cosa viene inviato a un server, e che cosa mai.',
    body: `Universal Compress svolge tutto il lavoro sul tuo dispositivo. I tuoi file non vengono caricati da nessuna parte per essere compressi.

## Dove avviene il lavoro

Quando trascini un file, viene letto dall’app in esecuzione sul tuo dispositivo. I PDF sono elaborati da librerie PDF open source che girano nell’app. Le immagini sono ricodificate dagli strumenti per immagini del tuo browser. Il video usa il codificatore video integrato nel browser. L’audio viene decodificato dal browser e codificato da un codificatore MP3 o AAC che gira nell’app. I risultati vengono salvati direttamente sul tuo dispositivo, oppure passati al menu di condivisione sul telefono.

I tuoi file restano in memoria solo finché l’app è aperta. L’app non li conserva, e spariscono quando la chiudi.

Poiché non viene caricato nulla, non c’è un limite di dimensione né una quota giornaliera. L’unico limite è la memoria del tuo dispositivo.

## Che cosa invia l’app

L’app fa alcune piccole richieste che non hanno niente a che fare con i tuoi file:

- **L’accesso**, se scegli di farlo. Niente nell’app richiede un account.
- **Una nota di «app aperta»** quando hai effettuato l’accesso, perché l’attività del tuo Universal ID sia corretta. Non dice nulla dei tuoi file.
- **Un segnale di «app in uso»** ogni 45 secondi mentre l’app è aperta e visibile. Contiene il nome dell’app, un identificativo casuale creato sul tuo dispositivo e il tuo account se hai effettuato l’accesso. Serve a mostrare quante persone usano l’app.
- **Il controllo degli aggiornamenti** e il recupero dell’elenco delle novità.

Non ci sono pubblicità né tracciamento di terze parti.

## Verificalo tu stesso

La prova più semplice è disattivare la connessione a internet e comprimere qualcosa. Funziona lo stesso, perché nulla deve lasciare il tuo dispositivo. L’app è anche open source, quindi chiunque può leggere esattamente che cosa fa.`,
  },
]

export default articles
