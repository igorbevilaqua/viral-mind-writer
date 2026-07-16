import { platformVideoId, youtubeId } from "./video-url";
import { viralData } from "./db";

// Transcrição de links de vídeo — fonte única usada pela rota /api/transcribe-link
// (fluxo Ensinar) e pela modelagem no pipeline (busca a transcrição na hora de conjurar).
// YouTube/Shorts: legendas via innertube (client ANDROID) — sem dependências nem API key.
// Instagram/TikTok: via Supadata (https://supadata.ai), atrás de SUPADATA_API_KEY.

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
  const data = await res.json();
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

async function transcribeViaSupadata(url: string, platform: string): Promise<Transcript> {
  const key = process.env.SUPADATA_API_KEY;
  if (!key)
    throw new Error(
      `transcrição de ${platform} requer configurar SUPADATA_API_KEY (supadata.ai); cole a transcrição manualmente`
    );
  const res = await fetch(
    `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}&text=true&lang=pt`,
    { headers: { "x-api-key": key } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? `Supadata respondeu ${res.status}`);
  // ponytail: jobId = transcrição assíncrona (vídeos longos); polling se algum dia precisar
  if (!data.content || typeof data.content !== "string")
    throw new Error("Supadata não retornou transcrição; cole a transcrição manualmente");
  return { title: undefined, text: data.content.trim() };
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

// Orquestra as fontes de transcrição. Lança em caso de link não suportado ou falha total.
export async function fetchTranscript(url: string): Promise<Transcript> {
  const ytId = youtubeId(url);
  let result = await fromCorpus(url);
  if (!result) {
    if (ytId) {
      try {
        result = await transcribeYouTube(ytId);
      } catch (e) {
        // sem key o erro original do innertube é mais informativo que "configure SUPADATA_API_KEY"
        if (!process.env.SUPADATA_API_KEY) throw e;
        console.error("innertube falhou, tentando Supadata", url, e);
        result = await transcribeViaSupadata(url, "YouTube");
      }
    } else if (/instagram\.com\/(reels?|p|tv)\//.test(url)) result = await transcribeViaSupadata(url, "Instagram");
    else if (/tiktok\.com\//.test(url)) result = await transcribeViaSupadata(url, "TikTok");
    else throw new Error("link não reconhecido; suporto YouTube/Shorts, Instagram Reels e TikTok");
  }
  return { title: result.title, text: result.text.slice(0, 100_000) };
}
