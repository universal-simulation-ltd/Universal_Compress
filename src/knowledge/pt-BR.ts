import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'O básico',
    title: 'O que a compressão realmente faz',
    summary: 'Como um arquivo pode guardar a mesma coisa em menos bytes.',
    body: `Todo arquivo no seu dispositivo é uma longa fileira de números chamados bytes. Comprimir é descrever a mesma coisa usando menos deles.

## Encontrar padrões

A maioria dos arquivos é cheia de repetição. Uma página de texto usa as mesmas palavras várias vezes. Uma foto de céu azul tem milhares de pixels vizinhos quase da mesma cor. A gravação de alguém falando tem longos trechos de quase silêncio.

Um compressor encontra esses padrões e os anota de forma abreviada. Em vez de guardar "azul, azul, azul, azul" mil vezes, ele pode guardar "azul, mil vezes". O arquivo resultante é menor, e um programa que entende essa abreviação reconstrói a imagem, o som ou a página quando você o abre.

## Deixar de fora o que você não perceberia

Imagens, vídeo e som podem ser reduzidos muito mais se também forem descartados detalhes que dificilmente alguém percebe: pequenas variações de cor, sons encobertos por outros mais altos, texturas finas numa cena rápida. É daí que vêm as economias realmente grandes, e é também aí que a qualidade pode sofrer se houver exagero.

## Por que isso importa

Arquivos menores são enviados mais rápido, cabem nos limites de anexos de e-mail, ocupam menos espaço no celular e carregam mais depressa numa página da web. A troca sempre se resume à mesma pergunta: quanto você está disposto a abrir mão para chegar lá? O Universal Compress faz essa pergunta uma única vez, com **Light** (leve), **Balanced** (equilibrado) ou **Maximum** (máximo), e resolve os detalhes para cada tipo de arquivo.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'O básico',
    title: 'Compressão sem perdas e com perdas',
    summary: 'A diferença entre reempacotar um arquivo e recodificá-lo.',
    body: `Existem duas famílias de compressão, e saber qual está em uso diz o que esperar do resultado.

## Sem perdas

A compressão sem perdas mantém cada byte do original. Quando o arquivo é aberto, ele é reconstruído exatamente como era, até o último detalhe. Arquivos ZIP funcionam assim, assim como o formato de imagem PNG.

O problema é que a economia é limitada. Só dá para remover repetições, e depois que elas saem não sobra mais nada para tirar.

## Com perdas

A compressão com perdas reconstrói algo que parece ou soa muito próximo do original, mas não idêntico. Fotos JPEG, áudio MP3 e AAC e quase todo vídeo funcionam assim. Como os detalhes são descartados para sempre, esses formatos podem deixar os arquivos muitas vezes menores.

Disso resultam duas coisas:

- **A perda é permanente.** Comprimir uma cópia não tem problema; guarde o original se você puder precisar da qualidade total mais tarde.
- **Repetir se acumula.** Cada compressão com perdas descarta um pouco mais, então comprimir de novo um arquivo já comprimido costuma custar qualidade em troca de pouca economia.

## No Universal Compress

- Um PDF em **Light** é reempacotado sem perdas. O texto continua selecionável e pesquisável, e a economia costuma ser modesta.
- Um PDF em **Balanced** ou **Maximum** transforma cada página em uma imagem. A economia costuma ser grande, principalmente em documentos digitalizados, mas o texto deixa de poder ser selecionado ou pesquisado.
- Imagens, vídeo e áudio são recodificados em formatos com perdas. O nível escolhido define quanto detalhe é trocado por tamanho, e as opções em Advanced permitem que você defina os valores exatos.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'O básico',
    title: 'Por que alguns arquivos quase não diminuem',
    summary: 'Arquivos já comprimidos, e por que arquivos ZIP são recusados.',
    body: `Às vezes você comprime um arquivo e ele sai quase do mesmo tamanho, ou até maior. Isso não é um defeito: normalmente significa que o arquivo já estava comprimido.

## A compressão só funciona uma vez

A compressão remove repetições. Quando isso já foi bem feito, o resultado parece quase aleatório, e dados aleatórios não têm padrões para remover. Um segundo compressor não encontra nada a fazer, e as próprias informações de controle dele podem até deixar o arquivo um pouco maior.

Costumam já estar comprimidos:

- **Arquivos compactados** como ZIP, RAR, 7z e .gz.
- **Documentos do Office** nos formatos modernos do Word, Excel e PowerPoint, que por dentro são arquivos ZIP.
- **Fotos e vídeos** direto do celular, que já são salvos em formatos com perdas.
- **PDFs** gerados com cuidado pelo programa que os criou.

## O que o Universal Compress faz a respeito

- Ele não tenta comprimir arquivos ZIP, RAR, 7z ou .gz, nem arquivos do Word, Excel e PowerPoint. Eles ficam na lista com uma frase explicando o motivo. Para uma apresentação ou um documento, exportar primeiro para PDF e comprimir esse PDF costuma ser o melhor caminho.
- Se comprimir um arquivo o deixasse do mesmo tamanho ou maior, o app devolve **o seu arquivo original** e avisa na linha dele, em vez de entregar algo pior.
- Antes de começar, cada nível mostra uma estimativa do tamanho que produziria, para você ver de antemão se vale a pena uma configuração mais forte.

## Conseguir uma economia maior

Se uma foto ou um vídeo quase não diminui em Light, experimente Balanced ou Maximum. Esses níveis também reduzem as dimensões da imagem em pixels, que é onde costuma estar a economia real. Para um PDF feito de páginas digitalizadas, Balanced muitas vezes faz uma grande diferença.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'Como funciona',
    title: 'Como o Universal Compress funciona',
    summary: 'Uma única configuração de intensidade, adaptada a cada tipo de arquivo.',
    body: `Solte qualquer mistura de arquivos e o app os separa por tipo: PDFs, vídeos, imagens e áudio. Cada tipo tem seu próprio painel de opções, mas todos compartilham um mesmo controle.

## Light, Balanced, Maximum

O controle de intensidade faz a mesma pergunta para cada arquivo: quanto comprimir? Cada tipo de arquivo então transforma sua resposta nas próprias configurações:

- **PDF.** Light reempacota o arquivo sem perdas. Balanced transforma as páginas em imagens com resolução de impressão. Maximum faz o mesmo com resolução de tela.
- **Vídeo.** Light mantém o tamanho original da imagem. Balanced limita a imagem a 1080p e reduz a taxa de bits. Maximum limita a 720p com a menor taxa de bits.
- **Imagens.** Light recodifica em alta qualidade e no tamanho completo. Balanced limita o lado maior a 2560 pixels. Maximum limita a 1600 pixels com qualidade menor.
- **Áudio.** Light é 192 kbps, Balanced 128 kbps e Maximum 96 kbps mixado em mono.

Para vídeo, imagens e áudio, tudo o que um nível escolhe aparece em **Advanced**, onde você pode alterar qualquer valor.

## Vale a pena saber

- **Formatos de saída.** O vídeo sai em MP4. O áudio sai em MP3 ou M4A. Fotos JPEG e WebP mantêm o formato por padrão, e AVIF também quando o navegador consegue gravá-lo. Imagens PNG, BMP, GIF estáticos e HEIC do iPhone viram WebP por padrão, porque isso costuma ser bem menor. Você pode escolher JPEG ou WebP.
- **GIFs animados continuam animados.** Eles recebem um tratamento próprio, e em Maximum um a cada dois quadros é descartado, mantendo a duração da animação.
- **Vídeo exige um navegador compatível.** A compressão de vídeo usa o codificador de vídeo embutido no navegador, presente no Chrome, no Edge e no Safari 16.4 ou posterior. PDFs, imagens e áudio funcionam em qualquer navegador atual.
- **Alguns contêineres de vídeo não são suportados.** MP4, M4V e MOV funcionam. MKV, WebM, AVI, WMV e FLV precisam ser convertidos para MP4 antes.
- **Sem um arquivo à mão?** **Try with an example photo**, na primeira tela, carrega uma foto de exemplo que vem com o app, para você ver o que ele faz antes de usar seus próprios arquivos. Como todo o resto, ela nunca sai do seu dispositivo.
- **Salvar.** Baixe os arquivos um por um, ou todos de uma vez em um ZIP. Esse ZIP apenas junta os resultados; ele não os comprime mais.
- **Tente de novo à vontade.** Mude o nível e comprima a lista inteira de novo para comparar os tamanhos.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Privacidade e segurança',
    title: 'Seus arquivos ficam no seu dispositivo',
    summary: 'O que é enviado a um servidor, e o que nunca é.',
    body: `O Universal Compress faz todo o trabalho no seu próprio dispositivo. Seus arquivos não são enviados para lugar nenhum para serem comprimidos.

## Onde o trabalho acontece

Quando você solta um arquivo, ele é lido pelo app que está rodando no seu dispositivo. PDFs são processados por bibliotecas de PDF de código aberto que rodam no app. Imagens são recodificadas pelas ferramentas de imagem do seu navegador. O vídeo usa o codificador de vídeo embutido no navegador. O áudio é decodificado pelo navegador e codificado por um codificador MP3 ou AAC que roda no app. Os resultados são salvos direto no seu dispositivo, ou passados para o menu de compartilhamento no celular.

Seus arquivos ficam na memória apenas enquanto o app está aberto. O app não os armazena, e eles somem quando você o fecha.

Como nada é enviado, não há limite de tamanho nem cota diária. O único limite é a memória do seu dispositivo.

## O que o app envia

O app faz algumas pequenas solicitações que não têm nada a ver com seus arquivos:

- **Entrar na conta**, se você quiser. Nada no app exige uma conta.
- **Um aviso de "app aberto"** quando você está conectado, para que a atividade do seu Universal ID fique correta. Ele não diz nada sobre seus arquivos.
- **Um sinal de "app em uso"** a cada 45 segundos enquanto o app está aberto e na tela. Ele contém o nome do app, um identificador aleatório criado no seu dispositivo e a sua conta, se você estiver conectado. Serve para mostrar quantas pessoas usam o app.
- **A verificação de atualizações** e a busca da lista de novidades.

Não há publicidade nem rastreamento de terceiros.

## Confira você mesmo

O teste mais simples é desligar a internet e comprimir alguma coisa. Continua funcionando, porque nada precisa sair do seu dispositivo. O app também é de código aberto, então qualquer pessoa pode ler exatamente o que ele faz.`,
  },
]

export default articles
