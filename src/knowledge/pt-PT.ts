import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'O essencial',
    title: 'O que a compressão faz realmente',
    summary: 'Como um ficheiro pode guardar o mesmo em menos bytes.',
    body: `Cada ficheiro no seu dispositivo é uma longa fila de números chamados bytes. Comprimir é descrever o mesmo usando menos bytes.

## Encontrar padrões

A maioria dos ficheiros está cheia de repetições. Uma página de texto usa as mesmas palavras vezes sem conta. Uma fotografia de um céu azul tem milhares de píxeis vizinhos quase da mesma cor. A gravação de alguém a falar tem longos trechos de quase silêncio.

Um compressor encontra esses padrões e regista-os de forma abreviada. Em vez de guardar «azul, azul, azul, azul» mil vezes, pode guardar «azul, mil vezes». O ficheiro resultante é mais pequeno, e um programa que entende essa abreviatura reconstrói a imagem, o som ou a página quando o abre.

## Deixar de fora o que não notaria

Imagens, vídeo e som podem ser reduzidos muito mais se forem também descartados pormenores que dificilmente se notam: pequenas variações de cor, sons encobertos por outros mais fortes, texturas finas numa cena rápida. É daí que vêm as poupanças realmente grandes, e é também aí que a qualidade pode sofrer se se exagerar.

## Porque é que isto importa

Ficheiros mais pequenos enviam-se mais depressa, cabem nos limites dos anexos de e-mail, ocupam menos espaço no telemóvel e carregam mais rapidamente numa página web. O compromisso resume-se sempre à mesma pergunta: de quanto está disposto a abdicar para lá chegar? O Universal Compress faz essa pergunta uma única vez, com **Light** (ligeiro), **Balanced** (equilibrado) ou **Maximum** (máximo), e trata dos pormenores para cada tipo de ficheiro.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'O essencial',
    title: 'Compressão sem perdas e com perdas',
    summary: 'A diferença entre reempacotar um ficheiro e recodificá-lo.',
    body: `Existem duas famílias de compressão, e saber qual está a ser usada diz-lhe o que esperar do resultado.

## Sem perdas

A compressão sem perdas mantém cada byte do original. Quando o ficheiro é aberto, é reconstruído exatamente como era, até ao último pormenor. Os ficheiros ZIP funcionam assim, tal como o formato de imagem PNG.

O senão é que a poupança é limitada. Só se podem remover repetições e, uma vez removidas, não resta mais nada para tirar.

## Com perdas

A compressão com perdas reconstrói algo que parece ou soa muito próximo do original, mas não idêntico. As fotografias JPEG, o áudio MP3 e AAC e quase todo o vídeo funcionam assim. Como os pormenores são descartados para sempre, estes formatos podem tornar os ficheiros muitas vezes mais pequenos.

Daqui resultam duas coisas:

- **A perda é permanente.** Comprimir uma cópia não tem problema; guarde o original se puder vir a precisar da qualidade total.
- **Repetir acumula.** Cada compressão com perdas descarta um pouco mais, por isso voltar a comprimir um ficheiro já comprimido costuma custar qualidade em troca de pouca poupança.

## No Universal Compress

- Um PDF em **Light** é reempacotado sem perdas. O texto continua selecionável e pesquisável, e a poupança costuma ser modesta.
- Um PDF em **Balanced** ou **Maximum** transforma cada página numa imagem. A poupança é muitas vezes grande, sobretudo em documentos digitalizados, mas o texto deixa de poder ser selecionado ou pesquisado.
- Imagens, vídeo e áudio são recodificados em formatos com perdas. O nível escolhido define quanto pormenor é trocado por tamanho, e as opções em Advanced permitem-lhe definir os valores exatos.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'O essencial',
    title: 'Porque é que alguns ficheiros quase não diminuem',
    summary: 'Ficheiros já comprimidos, e porque é que os ZIP são recusados.',
    body: `Por vezes comprime um ficheiro e ele fica quase do mesmo tamanho, ou até maior. Não é uma avaria: normalmente significa que o ficheiro já estava comprimido.

## A compressão só funciona uma vez

A compressão remove repetições. Quando isso já foi bem feito, o resultado parece quase aleatório, e dados aleatórios não têm padrões para remover. Um segundo compressor não encontra nada para fazer, e as suas próprias informações de controlo podem até torná-lo ligeiramente maior.

Costumam já estar comprimidos:

- **Arquivos** como ZIP, RAR, 7z e .gz.
- **Documentos do Office** nos formatos modernos do Word, Excel e PowerPoint, que por dentro são arquivos ZIP.
- **Fotografias e vídeos** tirados diretamente do telemóvel, que já são guardados em formatos com perdas.
- **PDFs** criados com cuidado pelo programa que os produziu.

## O que o Universal Compress faz quanto a isso

- Não tenta comprimir arquivos ZIP, RAR, 7z ou .gz, nem ficheiros do Word, Excel e PowerPoint. Mantém-nos na lista com uma frase que explica porquê. Para uma apresentação ou um documento, exportá-lo primeiro para PDF e comprimir esse PDF é muitas vezes o melhor caminho.
- Se comprimir um ficheiro o deixasse do mesmo tamanho ou maior, a aplicação devolve-lhe **o seu ficheiro original** e indica-o na respetiva linha, em vez de lhe entregar algo pior.
- Antes de começar, cada nível mostra uma estimativa do tamanho que produziria, para que veja antecipadamente se vale a pena uma definição mais forte.

## Conseguir uma poupança maior

Se uma fotografia ou um vídeo quase não diminui em Light, experimente Balanced ou Maximum. Estes níveis também reduzem as dimensões da imagem em píxeis, que é onde costuma estar a verdadeira poupança. Para um PDF feito de páginas digitalizadas, Balanced faz muitas vezes uma grande diferença.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'Como funciona',
    title: 'Como funciona o Universal Compress',
    summary: 'Uma única definição de intensidade, adaptada a cada tipo de ficheiro.',
    body: `Largue qualquer mistura de ficheiros e a aplicação separa-os por tipo: PDFs, vídeos, imagens e áudio. Cada tipo tem o seu próprio painel de opções, mas todos partilham um mesmo controlo.

## Light, Balanced, Maximum

O controlo de intensidade faz a mesma pergunta para cada ficheiro: quanto comprimir? Cada tipo de ficheiro traduz depois a sua resposta nas próprias definições:

- **PDF.** Light reempacota o ficheiro sem perdas. Balanced transforma as páginas em imagens com resolução de impressão. Maximum faz o mesmo com resolução de ecrã.
- **Vídeo.** Light mantém o tamanho original da imagem. Balanced limita a imagem a 1080p e reduz a taxa de bits. Maximum limita-a a 720p com a taxa de bits mais baixa.
- **Imagens.** Light recodifica com qualidade alta e no tamanho completo. Balanced limita o lado maior a 2560 píxeis. Maximum limita-o a 1600 píxeis com menor qualidade.
- **Áudio.** Light corresponde a 192 kbps, Balanced a 128 kbps e Maximum a 96 kbps misturado em mono.

Para vídeo, imagens e áudio, tudo o que um nível escolhe é mostrado em **Advanced**, onde pode alterar qualquer valor.

## Convém saber

- **Formatos de saída.** O vídeo sai em MP4. O áudio sai em MP3 ou M4A. As fotografias JPEG e WebP mantêm o formato por predefinição, e o AVIF também quando o navegador o consegue escrever. As imagens PNG, BMP, GIF estáticos e HEIC do iPhone passam a WebP por predefinição, porque costuma ser bastante mais pequeno. Pode escolher JPEG ou WebP.
- **Os GIF animados continuam animados.** Têm um tratamento próprio e, em Maximum, é descartada uma em cada duas imagens, mantendo a duração da animação.
- **O vídeo exige um navegador compatível.** A compressão de vídeo usa o codificador de vídeo integrado no navegador, presente no Chrome, no Edge e no Safari 16.4 ou posterior. PDFs, imagens e áudio funcionam em qualquer navegador atual.
- **Alguns contentores de vídeo não são suportados.** MP4, M4V e MOV funcionam. MKV, WebM, AVI, WMV e FLV têm de ser primeiro convertidos para MP4.
- **Guardar.** Transfira os ficheiros um a um, ou todos de uma vez num ZIP. Esse ZIP apenas junta os resultados; não os comprime mais.
- **Experimente de novo à vontade.** Mude o nível e comprima novamente a lista inteira para comparar tamanhos.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Privacidade e segurança',
    title: 'Os seus ficheiros ficam no seu dispositivo',
    summary: 'O que é enviado para um servidor, e o que nunca é.',
    body: `O Universal Compress faz todo o trabalho no seu próprio dispositivo. Os seus ficheiros não são carregados para lado nenhum para serem comprimidos.

## Onde o trabalho acontece

Quando larga um ficheiro, este é lido pela aplicação que está a correr no seu dispositivo. Os PDFs são processados por bibliotecas de PDF de código aberto que correm na aplicação. As imagens são recodificadas pelas ferramentas de imagem do seu navegador. O vídeo usa o codificador de vídeo integrado no navegador. O áudio é descodificado pelo navegador e codificado por um codificador MP3 ou AAC que corre na aplicação. Os resultados são guardados diretamente no seu dispositivo ou, num telemóvel, passados para o menu de partilha.

Os seus ficheiros ficam em memória apenas enquanto a aplicação está aberta. A aplicação não os guarda, e desaparecem quando a fecha.

Como nada é carregado, não existe limite de tamanho nem quota diária. O único limite é a memória do seu dispositivo.

## O que a aplicação envia

A aplicação faz alguns pequenos pedidos que nada têm a ver com os seus ficheiros:

- **Iniciar sessão**, se assim o entender. Nada na aplicação exige uma conta.
- **Um aviso de «aplicação aberta»** quando tem sessão iniciada, para que a atividade do seu Universal ID esteja correta. Não diz nada sobre os seus ficheiros.
- **Um sinal de «aplicação em utilização»** a cada 45 segundos enquanto a aplicação está aberta e no ecrã. Contém o nome da aplicação, um identificador aleatório criado no seu dispositivo e a sua conta, se tiver sessão iniciada. Serve para mostrar quantas pessoas usam a aplicação.
- **A procura de atualizações** e a obtenção da lista de novidades.

Não há publicidade nem rastreio por terceiros.

## Confirme por si

O teste mais simples é desligar a ligação à internet e comprimir alguma coisa. Continua a funcionar, porque nada precisa de sair do seu dispositivo. A aplicação é também de código aberto, pelo que qualquer pessoa pode ler exatamente o que faz.`,
  },
]

export default articles
