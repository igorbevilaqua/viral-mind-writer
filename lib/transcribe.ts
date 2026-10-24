import OpenAI, { toFile } from "openai";
import { LINK_CURTO_RE, normalizarLinkDeVideo, platformVideoId, youtubeId } from "./video-url";
import { viralData } from "./db";
import { jsonOuErro, sc } from "./scrapecreators";

// Transcrição de links de vídeo — fonte única usada pela rota /api/transcribe-link
// (fluxo Ensinar) e pela modelagem no pipeline (busca a transcrição na hora de conjurar).
// YouTube/Shorts: legendas via innertube (client ANDROID) — sem dependências nem API key.
// Instagram: Supadata, depois ScrapeCreators, depois arquivo do vídeo no Whisper (vídeo longo).
// TikTok: Supadata (https://supadata.ai), atrás de SUPADATA_API_KEY.

export interface Transcript {
  title?: string;
  text: string;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string };

// Mora em lib/scrapecreators.ts junto do cliente que mais depende dela. Reexportado porque
// Supadata e YouTube (aqui embaixo) também passam por ela, e o teste a importa por este nome.
export { jsonOuErro };

async function transcribeYouTube(videoId: string): Promise<Transcript> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip",
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "pt" },
      },
    }),
  });
  if (!res.ok) throw new Error(`YouTube respondeu ${res.status}`);
  const data = await jsonOuErro(res, "YouTube");
  if (data.playabilityStatus?.status !== "OK")
    throw new Error(data.playabilityStatus?.reason ?? "vídeo indisponível");

  const tracks: CaptionTrack[] = data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) throw new Error("este vídeo não tem legendas disponíveis; cole a transcrição manualmente");

  // preferência: pt manual > pt automática > qualquer manual > primeira
  const track =
    tracks.find((t) => t.languageCode.startsWith("pt") && t.kind !== "asr") ??
    tracks.find((t) => t.languageCode.startsWith("pt")) ??
    tracks.find((t) => t.kind !== "asr") ??
    tracks[0];

  const xml = await (await fetch(track.baseUrl)).text();
  // timedtext srv3: texto dentro de <p>/<s>
  const text = decodeEntities(
    [...xml.matchAll(/<[ps][^>]*>([\s\S]*?)<\/[ps]>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, ""))
      .join(" ")
  )
    .replace(/\s+/g, " ")
    .trim();
  if (!text) throw new Error("legenda vazia; cole a transcrição manualmente");

  return { title: data.videoDetails?.title as string | undefined, text };
}

async function transcribeViaSupadata(url: string): Promise<Transcript> {
  const headers = { "x-api-key": process.env.SUPADATA_API_KEY! };
  const res = await fetch(
    `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}&text=true&lang=pt`,
    { headers }
  );
  let data = await jsonOuErro(res, "Supadata");
  if (!res.ok) throw new Error(`Supadata respondeu ${res.status}: ${data.message ?? data.error ?? "sem detalhe"}`);
  // Vídeo que não cabe na resposta síncrona volta como job (202 + jobId). Antes isto virava
  // "Supadata não retornou transcrição" e a modelagem caía no plano B, que recusa vídeo > 120 s.
  // ponytail: polling de até 90 s, dentro do maxDuration de 300 s da geração.
  for (let i = 0; data.jobId && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const job = await fetch(`https://api.supadata.ai/v1/transcript/${data.jobId}`, { headers });
    const corpo = await jsonOuErro(job, "Supadata");
    if (corpo.status === "failed" || !job.ok)
      throw new Error(`Supadata falhou no job: ${corpo.error?.message ?? corpo.error ?? corpo.message ?? job.status}`);
    if (corpo.status === "completed") data = corpo;
  }
  if (!data.content || typeof data.content !== "string") throw new Error("Supadata não retornou transcrição");
  return { title: undefined, text: data.content.trim() };
}

// Plano B do Supadata para Instagram, com a chave que a caça de modelagens JÁ usa: 1 crédito
// por reel. Existe porque o Supadata é o elo mais fraco do fluxo (plano gratuito, e devolvendo
// HTML de gateway em produção) — e sem plano B a modelagem morre pedindo transcrição manual.
//
// Passa pelo `sc` compartilhado (lib/scrapecreators.ts). Tinha o próprio fetch, com o próprio
// tratamento de erro, e por isso continuou devolvendo o inglês do serviço ("Looks like you're
// out of credits") na tela depois que o `sc` já traduzia o 402.
// Recusa vídeo com mais de 120 s ("Video is too long for AI transcription"): é o plano C que cobre.
async function transcribeViaScrapeCreators(url: string): Promise<Transcript> {
  const data = await sc<{ transcripts?: { text?: string }[] }>("/v2/instagram/media/transcript", { url });
  const text = data.transcripts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("ScrapeCreators não retornou transcrição");
  return { title: undefined, text: text.trim() };
}

// Vídeo longo não é recusado: transcrevemos só o começo. O teto de upload da OpenAI é 25 MB, e
// para modelar um vídeo curto os 3 primeiros minutos bastam (hook, estrutura e virada estão ali).
const LIMITE_BYTES = 24 * 1024 * 1024;
const LIMITE_SEG = 180;

/**
 * Quantos bytes do arquivo mandar para a transcrição e quantos segundos isso cobre.
 * ponytail: byte proporcional a tempo é aproximação (bitrate varia), por isso o aviso diz "~".
 */
export function corteDoVideo(totalBytes: number, duracaoSeg?: number | null) {
  const porTempo =
    duracaoSeg && duracaoSeg > LIMITE_SEG ? Math.floor((totalBytes * LIMITE_SEG) / duracaoSeg) : totalBytes;
  const bytes = Math.min(totalBytes, LIMITE_BYTES, porTempo);
  const cortado = bytes < totalBytes;
  const segundos = duracaoSeg ? Math.round((duracaoSeg * bytes) / totalBytes) : null;
  const aviso = !cortado
    ? null
    : segundos && duracaoSeg
      ? `[TRANSCRIÇÃO PARCIAL: só os primeiros ~${segundos} s de ${Math.round(duracaoSeg)} s do vídeo]`
      : `[TRANSCRIÇÃO PARCIAL: só o começo do vídeo]`;
  return { bytes, cortado, segundos, aviso };
}

// Plano C, para reel que os dois primeiros não leem (vídeo longo, Supadata fora): o arquivo do
// vídeo vem do mesmo post que o carrossel já lê no ScrapeCreators (1 crédito), e o áudio vai para
// o Whisper da OpenAI, com a OPENAI_API_KEY que os embeddings já usam.
async function transcribeViaWhisper(url: string): Promise<Transcript> {
  const post = await sc<{ data?: { xdt_shortcode_media?: { video_url?: string; video_duration?: number } } }>(
    "/v1/instagram/post",
    { url }
  );
  const m = post.data?.xdt_shortcode_media;
  if (!m?.video_url) throw new Error("o post não trouxe o arquivo do vídeo");
  const res = await fetch(m.video_url, { headers: { Range: `bytes=0-${LIMITE_BYTES - 1}` } });
  if (!res.ok) throw new Error(`o arquivo do vídeo respondeu ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const total = Number(res.headers.get("content-range")?.split("/")[1]) || buf.length;
  const corte = corteDoVideo(total, m.video_duration);
  const r = await new OpenAI().audio.transcriptions.create({
    file: await toFile(buf.subarray(0, corte.bytes), "video.mp4", { type: "video/mp4" }),
    model: "whisper-1",
  });
  if (!r.text?.trim()) throw new Error("Whisper não retornou texto");
  return { title: corte.aviso ?? undefined, text: r.text.trim() };
}

// Vídeo já no nosso corpus → o roteiro do banco É a transcrição: instantâneo, grátis,
// e poupa a cota da Supadata (plano gratuito). Falha aqui só cai pra transcrição externa.
async function fromCorpus(url: string): Promise<Transcript | null> {
  const pid = platformVideoId(url);
  if (!pid) return null;
  try {
    const { data } = await viralData
      .from("videos")
      .select("titulo, roteiro")
      .or(`link_video.ilike.%${pid}%,plataform_id.eq.${pid}`)
      .not("roteiro", "is", null)
      .limit(1)
      .maybeSingle();
    if (!data?.roteiro?.trim()) return null;
    return { title: (data.titulo as string | null) ?? undefined, text: data.roteiro.trim() };
  } catch (e) {
    console.error("lookup no corpus falhou (seguindo pra transcrição externa)", url, e);
    return null;
  }
}

type Falha = { fonte: string; motivo: string };

/** O que a tela diz quando todas as fontes falharam. O detalhe por fonte vai no `debug` do erro. */
export function mensagemDeFalha(falhas: Falha[]): string {
  // YouTube fica de fora: o 403 do innertube é bloqueio do vídeo, não chave nossa.
  const motivos = falhas.filter((f) => f.fonte !== "YouTube").map((f) => f.motivo).join(" ");
  if (/sem créditos|out of credits|limit-exceeded|\b402\b/i.test(motivos))
    return "o serviço de transcrição ficou sem créditos. Avise o admin para recarregar a conta";
  if (/\b40[13]\b|unauthorized|invalid api key/i.test(motivos))
    return "a chave de um serviço de transcrição está inválida. Avise o admin";
  if (falhas.length === 1) return falhas[0].motivo;
  return "nenhum serviço de transcrição conseguiu ler este vídeo agora. Tente de novo em alguns minutos";
}

async function seguirRedirect(url: string): Promise<string> {
  try {
    return (await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000) })).url || url;
  } catch {
    return url;
  }
}

// Orquestra as fontes de transcrição: cada plataforma tem uma escada, da fonte grátis para a paga,
// e só lança quando todas falharam. Lança também em link sem vídeo (perfil) ou não suportado.
export async function fetchTranscript(bruto: string): Promise<Transcript> {
  let url = normalizarLinkDeVideo(bruto);
  if (LINK_CURTO_RE.test(url)) url = normalizarLinkDeVideo(await seguirRedirect(url));

  const corpus = await fromCorpus(url);
  if (corpus) return { title: corpus.title, text: corpus.text.slice(0, 100_000) };

  const env = process.env;
  const ytId = youtubeId(url);
  let fontes: [string, unknown, () => Promise<Transcript>][];
  if (ytId)
    fontes = [
      ["YouTube", true, () => transcribeYouTube(ytId)],
      ["Supadata", env.SUPADATA_API_KEY, () => transcribeViaSupadata(url)],
    ];
  else if (/instagram\.com\//i.test(url)) {
    if (!platformVideoId(url))
      throw new Error("esse link é de um perfil do Instagram, não de um vídeo. Abra o reel e copie o link dele");
    fontes = [
      ["Supadata", env.SUPADATA_API_KEY, () => transcribeViaSupadata(url)],
      ["ScrapeCreators", env.SCRAPECREATORS_API_KEY, () => transcribeViaScrapeCreators(url)],
      ["Whisper", env.SCRAPECREATORS_API_KEY && env.OPENAI_API_KEY, () => transcribeViaWhisper(url)],
    ];
  } else if (/tiktok\.com\//i.test(url)) fontes = [["Supadata", env.SUPADATA_API_KEY, () => transcribeViaSupadata(url)]];
  else throw new Error("link não reconhecido. Use o link de um vídeo do YouTube, do Instagram ou do TikTok");

  const falhas: Falha[] = [];
  for (const [fonte, configurada, rodar] of fontes) {
    if (!configurada) continue;
    try {
      const r = await rodar();
      return { title: r.title, text: r.text.slice(0, 100_000) };
    } catch (e) {
      falhas.push({ fonte, motivo: e instanceof Error ? e.message : String(e) });
      console.error(`transcrição: ${fonte} falhou`, url, e);
    }
  }
  if (!falhas.length) throw new Error("a transcrição deste tipo de link não está configurada. Avise o admin");
  // O `debug` vai para vm_sessions.debug.detail e para o evento 'erro' do hub (index.ts): é lá
  // que o admin vê qual fonte caiu e por quê. A tela recebe só a frase acionável.
  throw Object.assign(new Error(mensagemDeFalha(falhas)), { debug: { step: "transcricao", url, falhas } });
}
