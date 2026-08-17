import { appDb, viralData } from "../db";
import { fmtNum } from "../format";
import { VIDEO_URL_RE, platformVideoId } from "../video-url";
import { autopsiaDeUrl, transcricaoDeUrl, type ModelagemResult } from "./modelagem";
import type { UsageLog } from "../anthropic";

// ────────────────────────────────────────────────────────────────────────────
// 018 §7 — o debate sobre um vídeo. Isto NÃO é um agente novo: é um bloco de
// prompt que entra no turno do Kasparov (agents/kasparov.md §8). Quem compõe o
// turno é a rota; aqui só se produz o texto.
//
// A regra que o módulo inteiro serve: o Kasparov só fala de um vídeo que ele
// leu, e só chama de dado o que é dado. Vídeo no acervo abre pelo RATIO; vídeo
// de fora abre dizendo que é opinião; vídeo que não deu para transcrever não
// vira debate nenhum (§11).
// ────────────────────────────────────────────────────────────────────────────

export interface VideoNoAcervo {
  url: string;
  titulo: string | null;
  views: number;
  seguidores: number;
  ratio: number;
  /** `corpus` = vídeo de cliente (videos + vm_video_stats); `pool` = vm_modelagem_pool. */
  fonte: "corpus" | "pool";
}

// Piso de seguidores igual ao de lib/modelagens/rank.ts:62 — conta nova (ou perfil sem
// leitura de seguidores) não vira ratio infinito. A fórmula é a mesma de rank.ts:115,
// views ÷ seguidores do autor, e é de propósito: ratio é a métrica da casa e só existe
// uma definição dela.
const SEGUIDORES_MINIMOS = 1000;

export const ratioDoVideo = (views: number, seguidores: number) => views / Math.max(seguidores, SEGUIDORES_MINIMOS);

// fmtRatio (lib/format) é o formato da TELA ("203.1x"); esta linha é prosa que o Kasparov
// fala, e o 018 §7 fixa a forma dela: "316k views com 1.556 seguidores — 203×".
const fmtX = (r: number) => `${r >= 10 ? Math.round(r) : Math.round(r * 10) / 10}×`;

export function linhaDeRatio(v: VideoNoAcervo): string {
  return `${fmtNum(v.views)} views com ${v.seguidores.toLocaleString("pt-BR")} seguidores — ${fmtX(v.ratio)}`;
}

// ── A URL dentro da frase ───────────────────────────────────────────────────
// No chat o link vem embrulhado em prosa ("olha esse aqui https://... o que você acha?").
// Quem decide se há vídeo em debate é a rota, e a decisão é esta função — puro texto, sem rede.
const URLS = /https?:\/\/[^\s<>"'`]+/g;

/**
 * Primeira URL de vídeo da mensagem, ou null. `platformVideoId` é o portão: link de PERFIL
 * passa no regex de domínio e não é vídeo nenhum — mandá-lo ao transcritor só produziria a
 * recusa do §11 com o motivo errado.
 */
export function urlDeVideo(mensagem: string): string | null {
  for (const bruta of mensagem.match(URLS) ?? []) {
    // pontuação final da frase gruda na URL: "…/reel/abc." vira id "abc." e não casa nada.
    const url = bruta.replace(/[.,;:!?)\]}'"]+$/, "");
    if (VIDEO_URL_RE.test(url) && platformVideoId(url)) return url;
  }
  return null;
}

// ── O acervo ────────────────────────────────────────────────────────────────
// Duas fontes, mesma conta. O corpus dos clientes tem views na MV vm_video_stats e
// seguidores na última leitura de metricas_canal (mesmo caminho que vm_client_panel usa
// para montar 'plataformas', migration 0013:99). O pool de modelagens já guarda os dois
// números na própria linha, porque foi assim que ele rankeou o vídeo para sugeri-lo.
// Match por id de plataforma, como o lookupCorpus: a mesma /reel/ com utm é o mesmo vídeo.
async function doCorpus(pid: string): Promise<Omit<VideoNoAcervo, "url" | "ratio"> | null> {
  const { data: vid } = await viralData
    .from("videos")
    .select("id, titulo, canal_id")
    .or(`link_video.ilike.%${pid}%,plataform_id.eq.${pid}`)
    .limit(1)
    .maybeSingle();
  if (!vid) return null;

  const [stats, canal] = await Promise.all([
    viralData.from("vm_video_stats").select("views_total").eq("video_id", vid.id).maybeSingle(),
    viralData
      .from("metricas_canal")
      .select("num_seguidores")
      .eq("canal_id", vid.canal_id)
      .order("data_registro", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const views = Number(stats.data?.views_total ?? 0);
  const seguidores = Number(canal.data?.num_seguidores ?? 0);
  // Sem os dois números não há ratio, e views sozinhas não abrem nada (§7). Volta null:
  // o debate segue pelo caminho "sem dado", que é a verdade — não há o que citar.
  if (!views || !seguidores) return null;
  return { titulo: (vid.titulo as string | null) ?? null, views, seguidores, fonte: "corpus" };
}

async function doPool(pid: string): Promise<Omit<VideoNoAcervo, "url" | "ratio"> | null> {
  const { data } = await appDb
    .from("vm_modelagem_pool")
    .select("views, autor_seguidores, autor_handle")
    .eq("plataform_id", pid)
    .limit(1)
    .maybeSingle();
  const views = Number(data?.views ?? 0);
  const seguidores = Number(data?.autor_seguidores ?? 0);
  if (!views || !seguidores) return null;
  return { titulo: (data?.autor_handle as string | null) ?? null, views, seguidores, fonte: "pool" };
}

/**
 * O vídeo está no acervo? Null quando não está — e também quando a consulta falha, o que
 * é aceitável de propósito: sem número em mãos, "estou opinando sem dado" continua sendo
 * a frase verdadeira. O que nunca pode acontecer é o inverso (citar número que não veio).
 */
export async function acervoPorUrl(url: string): Promise<VideoNoAcervo | null> {
  const pid = platformVideoId(url);
  if (!pid) return null;
  try {
    const achado = (await doCorpus(pid)) ?? (await doPool(pid));
    return achado && { url, ...achado, ratio: ratioDoVideo(achado.views, achado.seguidores) };
  } catch (e) {
    console.error("kasparov: consulta ao acervo falhou (seguindo sem dado)", url, e);
    return null;
  }
}

// ── O bloco ─────────────────────────────────────────────────────────────────

export interface DepsDeVideo {
  transcricao?: (url: string) => Promise<{ text: string; erro: string | null }>;
  acervo?: (url: string) => Promise<VideoNoAcervo | null>;
  autopsia?: typeof autopsiaDeUrl;
  log?: UsageLog;
}

export type BlocoDeVideo =
  | { ok: true; bloco: string; acervo: VideoNoAcervo | null }
  /** Texto pronto para ir à tela: diz qual vídeo e por quê (§11). */
  | { ok: false; erro: string };

// Teto da transcrição no bloco. As três camadas que faltam saem do texto literal, então
// ele precisa estar aqui inteiro — mas um vídeo de 20 minutos transcrito estoura o turno.
// ponytail: corte simples no fim; se vídeo longo virar assunto comum, cortar por beats.
const TRANSCRICAO_MAX = 6000;

const CAMADAS_QUE_FALTAM = `## AS TRÊS CAMADAS QUE FALTAM (a autópsia acima não cobre estas — são suas, e saem da transcrição)
1. CONTRASTES — onde o vídeo põe duas coisas lado a lado para uma dar sentido à outra: antes/depois, o que todo mundo acha vs o que é, escala grande vs pequena, um número contra outro. Diga qual é o contraste que sustenta o vídeo e em que ponto ele aparece. Sem contraste, diga isso: é uma fraqueza, não uma neutralidade.
2. LINGUAGEM — as palavras, não o conteúdo: tamanho de frase, quem fala com quem (segunda pessoa? plural?), concreto vs abstrato, jargão, repetição deliberada, ritmo. Cite trecho literal ao apontar. Vale para o que você recomendaria copiar e para o que você não deixaria passar num roteiro nosso.
3. APELO EMOCIONAL — qual emoção o vídeo produz (indignação, medo, alívio, orgulho, curiosidade, vergonha alheia) e por qual mecanismo ele a produz. Nomeie a emoção, não diga "engajante". Diga também se a emoção sustenta até o fim ou se desaba no meio.`;

function blocoDoAcervo(v: VideoNoAcervo | null): string {
  if (!v)
    return `## SEM DADO DE DESEMPENHO
Não tenho número nenhum deste vídeo: ele não está no acervo, ou o acervo não tem views e seguidores dele. Não existe ratio para citar.
DIGA ISSO NA RESPOSTA, com todas as letras, na primeira vez que você falar do desempenho dele: você está lendo o vídeo, não medindo. Sua análise é leitura sua, e vale — mas é opinião, e você diz que é.
PROIBIDO: "os dados mostram", "esse formato performa", estimar views, chutar ratio ou comparar com "vídeos parecidos" que você não tem na mão.`;

  return `## DESEMPENHO REAL (está no acervo — este número é lastro, e é seu)
${linhaDeRatio(v)}${v.titulo ? `\nVídeo: ${v.titulo}` : ""} (fonte: ${v.fonte === "corpus" ? "corpus do cliente" : "pool de modelagens"})
ABRA POR AQUI: a primeira coisa da sua resposta é essa linha, com esses números. Views sozinhas medem a audiência que o perfil já tinha; o ratio mede o VÍDEO, que é o que está em debate.
Este é um dos poucos lastros reais que você tem: se o usuário discordar da sua leitura do desempenho, sustente pelo número (§2 da sua persona). Tudo o mais que você disser sobre este vídeo continua sendo leitura sua.`;
}

function blocoDaAutopsia(r: ModelagemResult | null): string {
  const a = r?.analysis;
  if (!a?.esqueleto && !a?.diagnostico)
    return `## SEM ANÁLISE ESTRUTURADA
A autópsia deste vídeo falhou. Diga isso na resposta e siga assim mesmo: você tem a transcrição, mas não tem a leitura por camada da casa. Nenhuma afirmação sua sobre hook, estrutura ou comando vem de análise registrada aqui.`;

  const e = a.esqueleto;
  const linhas = [
    a.compreensao?.tema && `Tema: ${a.compreensao.tema}`,
    a.compreensao?.argumento_central && `Tese: ${a.compreensao.argumento_central}`,
    e?.hook?.tipo &&
      `Hook: ${e.hook.tipo}${e.hook.mecanismo ? ` (${e.hook.mecanismo})` : ""}${
        e.hook.fator_de_curiosidade ? ` | curiosidade aberta: ${e.hook.fator_de_curiosidade}` : ""
      }`,
    e?.estrutura_narrativa && `Storytelling: ${e.estrutura_narrativa}`,
    e?.comando?.tipo && `Comando: ${e.comando.tipo}${e.comando.posicao ? ` (${e.comando.posicao})` : ""}`,
    a.diagnostico?.gargalo && `Gargalo apontado pela casa: ${a.diagnostico.gargalo}`,
    ...(a.diagnostico?.por_camada ?? []).map((c) => `- ${c.camada} — "${c.evidencia}" → ${c.leitura}`),
  ].filter(Boolean);

  return `## AUTÓPSIA DA CASA (tema, hook, storytelling e comando JÁ estão julgados aqui — não refaça, discuta)
${linhas.join("\n")}
Esta leitura é a definição da casa de "por que funciona ou falha". Você pode discordar dela, mas discordando de forma explícita, e dizendo que é a sua leitura contra a análise registrada.`;
}

/**
 * Monta o bloco do vídeo para o turno do Kasparov. A ordem é a do §11: sem transcrição não
 * há debate; sem autópsia há debate pior; sem acervo há debate honesto.
 */
export async function blocoDeVideo(url: string, deps: DepsDeVideo = {}): Promise<BlocoDeVideo> {
  const buscarAcervo = deps.acervo ?? acervoPorUrl;
  const transcrever = deps.transcricao ?? transcricaoDeUrl;
  const autopsiar = deps.autopsia ?? autopsiaDeUrl;

  // A transcrição vem antes da autópsia (ao contrário do núcleo, que checa cache primeiro):
  // as três camadas que faltam saem do texto literal, e o cache da autópsia não devolve
  // transcrição. Vídeo do acervo é de graça aqui — o roteiro do banco É a transcrição
  // (lib/transcribe.ts:88). O acervo vai em paralelo porque nenhum depende do outro.
  const [acervo, { text, erro }] = await Promise.all([
    buscarAcervo(url).catch(() => null),
    transcrever(url),
  ]);

  if (!text.trim()) {
    // §11: nunca opinar sobre vídeo que não leu. O ratio, quando existe, é dado real e
    // sobrevive à recusa — o que morre é a análise.
    const motivo = erro?.trim() || "não consegui obter a transcrição";
    return {
      ok: false,
      erro:
        `Não consegui ler ${url}: ${motivo}.` +
        `${acervo ? ` O que eu tenho dele é o número: ${linhaDeRatio(acervo)}.` : ""}` +
        ` Não vou opinar sobre um vídeo que não li — cola a transcrição aqui que eu analiso.`,
    };
  }

  const transcript = text.trim();
  // §11: autópsia que falha não derruba a conversa, só a empobrece.
  const autopsia = await autopsiar(url, { transcript, usageLog: deps.log }).catch((e) => {
    console.error("kasparov: autópsia falhou (seguindo sem análise estruturada)", url, e);
    return null;
  });

  const corte =
    transcript.length > TRANSCRICAO_MAX ? `${transcript.slice(0, TRANSCRICAO_MAX)}\n[…transcrição cortada]` : transcript;

  return {
    ok: true,
    acervo,
    bloco: [
      `# VÍDEO EM DEBATE\n${url}`,
      blocoDoAcervo(acervo),
      blocoDaAutopsia(autopsia),
      CAMADAS_QUE_FALTAM,
      `## TRANSCRIÇÃO (é o que você leu; cite trecho literal ao apontar qualquer coisa)\n${corte}`,
    ].join("\n\n"),
  };
}
