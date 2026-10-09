import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'Les bases',
    title: 'Ce que fait vraiment la compression',
    summary: 'Comment un fichier peut contenir la même chose en moins d’octets.',
    body: `Chaque fichier de votre appareil est une longue suite de nombres appelés octets. Compresser, c’est décrire la même chose avec moins d’octets.

## Repérer les motifs

La plupart des fichiers sont pleins de répétitions. Une page de texte réutilise sans cesse les mêmes mots. Une photo de ciel bleu contient des milliers de pixels voisins presque de la même couleur. L’enregistrement d’une personne qui parle comporte de longs passages de quasi-silence.

Un compresseur repère ces motifs et les note en abrégé. Au lieu d’écrire « bleu, bleu, bleu, bleu » mille fois, il peut écrire « bleu, mille fois ». Le fichier obtenu est plus petit, et un programme qui comprend cette abréviation reconstruit l’image, le son ou la page quand vous l’ouvrez.

## Laisser de côté ce que vous ne remarqueriez pas

Les images, la vidéo et le son peuvent être réduits bien davantage en supprimant aussi des détails que l’on remarque rarement : de légères variations de couleur, des sons masqués par d’autres plus forts, une texture fine dans une scène rapide. C’est de là que viennent les gains les plus importants, et c’est aussi là que la qualité peut souffrir si l’on va trop loin.

## Pourquoi c’est utile

Un fichier plus petit s’envoie plus vite, passe sous les limites des pièces jointes, prend moins de place sur votre téléphone et se charge plus vite sur une page web. Le compromis revient toujours à la même question : jusqu’où êtes-vous prêt à céder pour y arriver ? Universal Compress pose cette question une seule fois, avec **Light** (léger), **Balanced** (équilibré) ou **Maximum**, et règle les détails pour chaque type de fichier.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'Les bases',
    title: 'Compression sans perte et avec perte',
    summary: 'La différence entre réorganiser un fichier et le réencoder.',
    body: `Il existe deux familles de compression, et savoir laquelle est utilisée vous dit à quoi vous attendre.

## Sans perte

La compression sans perte conserve chaque octet de l’original. À l’ouverture, le fichier est reconstruit exactement tel qu’il était, jusqu’au moindre détail. Les archives ZIP fonctionnent ainsi, tout comme le format d’image PNG.

La limite, c’est que le gain reste modeste. On ne peut retirer que les répétitions, et une fois retirées, il ne reste plus rien à gagner.

## Avec perte

La compression avec perte reconstruit quelque chose de très proche de l’original, à l’œil ou à l’oreille, mais pas identique. Les photos JPEG, l’audio MP3 et AAC et presque toutes les vidéos fonctionnent ainsi. Comme des détails sont supprimés définitivement, ces formats peuvent rendre un fichier bien plus petit.

Deux conséquences :

- **La perte est définitive.** Compresser une copie ne pose aucun problème ; gardez l’original si vous risquez d’avoir besoin de la pleine qualité.
- **Les passages s’additionnent.** Chaque compression avec perte retire un peu plus, donc recompresser un fichier déjà compressé coûte en général de la qualité pour un petit gain.

## Dans Universal Compress

- Un PDF en **Light** est réorganisé sans perte. Le texte reste sélectionnable et consultable par recherche, et le gain est généralement modeste.
- Un PDF en **Balanced** ou **Maximum** transforme chaque page en image. Le gain est souvent important, surtout pour les documents numérisés, mais le texte ne peut plus être sélectionné ni recherché.
- Les images, la vidéo et l’audio sont réencodés dans des formats avec perte. Le niveau choisi fixe la quantité de détails échangée contre la taille, et les options de la section Advanced vous permettent de régler vous-même les valeurs exactes.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'Les bases',
    title: 'Pourquoi certains fichiers rétrécissent à peine',
    summary: 'Les fichiers déjà compressés, et pourquoi les ZIP sont refusés.',
    body: `Il arrive qu’un fichier compressé ressorte presque à la même taille, voire plus gros. Ce n’est pas une erreur : cela signifie en général que le fichier était déjà compressé.

## La compression ne fonctionne qu’une fois

La compression consiste à supprimer les répétitions. Une fois ce travail bien fait, le résultat ressemble presque à du hasard, et le hasard ne contient plus de motifs à retirer. Un second compresseur ne trouve rien à faire, et ses propres informations de gestion peuvent même l’alourdir légèrement.

Sont généralement déjà compressés :

- **Les archives** comme ZIP, RAR, 7z et .gz.
- **Les documents Office** aux formats récents de Word, Excel et PowerPoint, qui sont en réalité des archives ZIP.
- **Les photos et vidéos** issues directement d’un téléphone, déjà enregistrées dans des formats avec perte.
- **Les PDF** soigneusement produits par le logiciel qui les a créés.

## Ce que fait Universal Compress

- Il ne tente pas de compresser les archives ZIP, RAR, 7z ou .gz, ni les fichiers Word, Excel et PowerPoint. Il les garde dans la liste avec une phrase qui explique pourquoi. Pour une présentation ou un document, l’exporter d’abord en PDF puis compresser ce PDF est souvent la meilleure solution.
- Si la compression donnait un fichier de même taille ou plus gros, l’application vous rend **votre fichier d’origine** et l’indique sur sa ligne, plutôt que de vous remettre un résultat moins bon.
- Avant de commencer, chaque niveau affiche une estimation de la taille obtenue, pour que vous voyiez à l’avance si un réglage plus fort en vaut la peine.

## Obtenir un gain plus important

Si une photo ou une vidéo rétrécit à peine en Light, essayez Balanced ou Maximum. Ces niveaux réduisent aussi les dimensions de l’image en pixels, et c’est souvent là que se trouve le vrai gain. Pour un PDF composé de pages numérisées, Balanced fait souvent une grande différence.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'Fonctionnement',
    title: 'Comment fonctionne Universal Compress',
    summary: 'Un seul réglage d’intensité, adapté à chaque type de fichier.',
    body: `Déposez n’importe quel mélange de fichiers et l’application les trie par type : PDF, vidéos, images et audio. Chaque type a son propre panneau d’options, mais tous partagent une même commande.

## Light, Balanced, Maximum

La commande d’intensité pose la même question pour chaque fichier : jusqu’où faut-il compresser ? Chaque type de fichier traduit ensuite votre réponse en ses propres réglages :

- **PDF.** Light réorganise le fichier sans perte. Balanced transforme les pages en images à une résolution adaptée à l’impression. Maximum fait de même à une résolution adaptée à l’écran.
- **Vidéo.** Light conserve la taille d’image d’origine. Balanced limite l’image à 1080p et réduit le débit. Maximum la limite à 720p avec le débit le plus bas.
- **Images.** Light réencode en haute qualité et en taille réelle. Balanced limite le plus grand côté à 2560 pixels. Maximum le limite à 1600 pixels avec une qualité plus basse.
- **Audio.** Light correspond à 192 kbit/s, Balanced à 128 kbit/s, et Maximum à 96 kbit/s en mono.

Pour la vidéo, les images et l’audio, tout ce qu’un niveau choisit est affiché dans **Advanced**, où vous pouvez tout modifier.

## Bon à savoir

- **Formats de sortie.** La vidéo sort en MP4. L’audio sort en MP3 ou M4A. Les photos JPEG et WebP gardent leur format par défaut, et l’AVIF aussi lorsque le navigateur sait l’écrire. Les images PNG, BMP, GIF fixes et HEIC d’iPhone deviennent du WebP par défaut, car c’est généralement bien plus petit. Vous pouvez choisir JPEG ou WebP à la place.
- **Les GIF animés restent animés.** Ils bénéficient d’un traitement à part, et en Maximum une image sur deux est supprimée tandis que l’animation garde sa durée.
- **La vidéo demande un navigateur compatible.** La compression vidéo utilise l’encodeur vidéo intégré au navigateur, présent dans Chrome, Edge et Safari 16.4 ou plus récent. Les PDF, images et fichiers audio fonctionnent dans tout navigateur récent.
- **Certains conteneurs vidéo ne sont pas pris en charge.** MP4, M4V et MOV fonctionnent. MKV, WebM, AVI, WMV et FLV doivent d’abord être convertis en MP4.
- **Pas de fichier sous la main ?** **Try with an example photo**, sur le premier écran, charge une photo d’exemple fournie avec l’application, pour voir ce qu’elle fait avant d’utiliser vos propres fichiers. Comme tout le reste, elle ne quitte jamais votre appareil.
- **Enregistrement.** Téléchargez les fichiers un par un, ou tous ensemble dans un ZIP. Ce ZIP ne fait que regrouper les résultats ; il ne les compresse pas davantage.
- **Recommencez librement.** Changez de niveau et compressez de nouveau toute la liste pour comparer les tailles.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Confidentialité et sécurité',
    title: 'Vos fichiers restent sur votre appareil',
    summary: 'Ce qui est envoyé à un serveur, et ce qui ne l’est jamais.',
    body: `Universal Compress fait tout son travail sur votre propre appareil. Vos fichiers ne sont envoyés nulle part pour être compressés.

## Où se fait le travail

Quand vous déposez un fichier, il est lu par l’application qui tourne sur votre appareil. Les PDF sont traités par des bibliothèques PDF open source intégrées à l’application. Les images sont réencodées par les outils d’image de votre navigateur. La vidéo utilise l’encodeur vidéo intégré à votre navigateur. L’audio est décodé par votre navigateur puis encodé par un encodeur MP3 ou AAC qui tourne dans l’application. Les résultats sont enregistrés directement sur votre appareil, ou transmis au menu de partage sur un téléphone.

Vos fichiers ne sont gardés en mémoire que pendant que l’application est ouverte. L’application ne les conserve pas, et ils disparaissent quand vous la fermez.

Comme rien n’est envoyé, il n’y a ni limite de taille ni quota quotidien. La seule limite est la mémoire de votre appareil.

## Ce que l’application envoie

L’application effectue quelques petites requêtes sans aucun rapport avec vos fichiers :

- **La connexion**, si vous le souhaitez. Rien dans l’application n’exige de compte.
- **Une note « application ouverte »** lorsque vous êtes connecté, pour que l’activité de votre Universal ID soit exacte. Elle ne dit rien de vos fichiers.
- **Un signal « application en cours d’utilisation »** toutes les 45 secondes tant que l’application est ouverte et affichée. Il contient le nom de l’application, un identifiant aléatoire créé sur votre appareil et votre compte si vous êtes connecté. Il sert à indiquer combien de personnes utilisent l’application.
- **La recherche de mises à jour** et la récupération de la liste des nouveautés.

Il n’y a ni publicité ni suivi par des tiers.

## Vérifiez par vous-même

Le test le plus simple consiste à couper votre connexion internet et à compresser un fichier. Cela fonctionne toujours, car rien n’a besoin de quitter votre appareil. L’application est aussi open source : chacun peut lire exactement ce qu’elle fait.`,
  },
]

export default articles
