import { ANALYST_MODEL, trackedCreate, type UsageLog } from "./anthropic";
import { sc } from "./modelagens/buscar";

// Carrossel do Instagram como fonte de modelagem.
//
// A diferença que justifica um módulo próprio: num reel o roteiro está no ÁUDIO, e a transcrição
// resolve. Num carrossel o roteiro está ESCRITO NAS IMAGENS — não existe áudio para transcrever, e
// a legenda é só a moldura. Então a "transcrição" de um carrossel é a leitura dos slides, em ordem,
// pela visão do modelo. Depois disso o carrossel entra no pipeline como qualquer outro material:
// texto com estrutura, que a modelagem disseca.
//
// Custo por carrossel: 1 crédito ScrapeCreators (o post) + 1 chamada de visão com N imagens.
// ponytail: sem downscale das imagens — não há lib de imagem no projeto, e o teto abaixo já
// segura o custo. Se o custo por carrossel incomodar, cortar largura antes de mandar.

// O teto é o do Instagram (20 itens por carrossel), e não um número nosso, de propósito: cortar
// slide do fim seria pior que caro. O COMANDO de um carrossel vive na última tela, e o mapa da
// modelagem manda o analista buscá-lo exatamente ali — truncar em 10 entregava um "último slide"
// que era o slide do meio, e o campo comando virava chute. Se algum dia vier mais que isto, o
// corte continua sendo dito no texto (abaixo), nunca silencioso.
const SLIDES_MAX = 20;

interface IgNode {
  display_url?: string;
  is_video?: boolean;
}

interface IgCarrosselResp {
  data?: {
    xdt_shortcode_media?: IgNode & {
      owner?: { username?: string };
      edge_media_to_caption?: { edges?: { node?: { text?: string } }[] };
      edge_sidecar_to_children?: { edges?: { node?: IgNode }[] };
    };
  };
  error?: string;
  message?: string;
}

const MEDIA_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

// O CDN do Instagram serve URL assinada e de vida curta: baixamos os bytes aqui em vez de passar a
// URL para a API do Claude buscar (link expirado viraria erro de visão, não erro de download).
async function baixarImagem(url: string): Promise<{ media_type: string; data: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`imagem do slide respondeu ${res.status}`);
  const tipoServido = res.headers.get("content-type")?.split(";")[0]?.trim();
  const ext = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
  const media_type =
    tipoServido && tipoServido.startsWith("image/")
      ? tipoServido
      : (MEDIA_TYPES[ext as keyof typeof MEDIA_TYPES] ?? "image/jpeg");
  return { media_type, data: Buffer.from(await res.arrayBuffer()).toString("base64") };
}

const INSTRUCAO = `Estes são os slides de um carrossel do Instagram, na ordem em que o leitor desliza.

Transcreva o TEXTO ESCRITO em cada slide, um slide por bloco, neste formato exato:

SLIDE 1: <todo o texto do slide, preservando a hierarquia: título primeiro, depois o corpo, depois o que estiver em destaque ou em letra menor>
SLIDE 2: ...

Regras:
- transcreva literalmente, sem corrigir, resumir ou reescrever;
- preserve a ordem de leitura de cada slide (o que salta ao olho primeiro vem primeiro);
- slide sem texto: escreva "SLIDE N: [sem texto] " seguido de uma frase curta do que a imagem mostra, porque a imagem também carrega argumento;
- não comente, não analise, não elogie. Só a transcrição.`;

export interface LeituraDeCarrossel {
  titulo?: string;
  text: string;
}

/**
 * Lê um carrossel (ou post de imagem única) do Instagram e devolve o texto dos slides na ordem.
 * Lança com motivo legível: o chamador transforma isso na mensagem da tela.
 */
export async function lerCarrossel(url: string, log?: UsageLog): Promise<LeituraDeCarrossel> {
  if (!/instagram\.com\/(p|reels?|tv)\//.test(url))
    throw new Error("link não reconhecido; para carrossel eu suporto post do Instagram (instagram.com/p/...)");

  const resp = await sc<IgCarrosselResp>("/v1/instagram/post", { url });
  const m = resp.data?.xdt_shortcode_media;
  if (!m) throw new Error(resp.message ?? resp.error ?? "não consegui abrir esse post (privado, apagado, ou exige login)");

  const filhos = (m.edge_sidecar_to_children?.edges ?? []).map((e) => e.node).filter(Boolean) as IgNode[];
  // Post de imagem única não tem sidecar, e continua valendo como material: é um slide só.
  const nos = filhos.length ? filhos : [m];
  const todas = nos.filter((n) => !n.is_video && n.display_url);
  // Se um dia estourar o teto, o slide que NÃO pode cair é o último: é onde vive o comando.
  // Cortar do meio mantém abertura e fechamento, que são as duas pontas que a modelagem lê.
  const imagens =
    todas.length > SLIDES_MAX ? [...todas.slice(0, SLIDES_MAX - 1), todas[todas.length - 1]] : todas;

  if (!imagens.length) {
    // Vídeo colado no campo de carrossel: o caminho certo existe e é outro, então diga qual.
    if (m.is_video) throw new Error("esse link é de vídeo, não de carrossel; use o anexo de vídeo, que transcreve o áudio");
    throw new Error("não achei imagem nenhuma nesse post");
  }

  const baixadas = await Promise.all(imagens.map((n) => baixarImagem(n.display_url!)));

  const res = await trackedCreate(
    log,
    "carrossel",
    {
      model: ANALYST_MODEL,
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            ...baixadas.map((img) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: img.media_type as "image/jpeg", data: img.data },
            })),
            { type: "text" as const, text: INSTRUCAO },
          ],
        },
      ],
    },
    // Ler texto de imagem não é raciocínio: esforço baixo faz o mesmo trabalho por menos.
    "low"
  );

  const transcrito = res.content
    .filter((b): b is { type: "text"; text: string; citations: null } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!transcrito) throw new Error("não consegui ler o texto dos slides; cole o conteúdo do carrossel manualmente");

  const legenda = m.edge_media_to_caption?.edges?.[0]?.node?.text?.trim();
  const autor = m.owner?.username;
  const s = imagens.length > 1 ? "s" : "";
  // Corte declarado, e com o motivo: sem dizer que o meio caiu, o analista leria o salto de
  // numeração dos slides como falha de leitura e desconfiaria da transcrição inteira.
  const corte = imagens.length < todas.length ? ` de ${todas.length}, sem os slides do meio` : "";

  return {
    titulo: autor ? `Carrossel de @${autor}` : undefined,
    // O rótulo de carrossel fica DENTRO do texto porque é ele que viaja para a modelagem: sem isso
    // o analista lê "SLIDE 1" e supõe transcrição de vídeo mal formatada. Sem travessão: este texto
    // entra em prompt e aparece na tela (agents/kasparov.md §7 é a mesma regra da casa).
    text: [
      `[CARROSSEL DO INSTAGRAM: ${imagens.length} slide${s} lido${s}${corte}]`,
      transcrito,
      legenda ? `LEGENDA DO POST:\n${legenda}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
