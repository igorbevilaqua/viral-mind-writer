import { youtubeId } from "@/lib/video-url";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Transcrição automática de links de vídeo.
// YouTube/Shorts: legendas via innertube (client ANDROID) — sem dependências nem API key.
// Instagram/TikTok: via Supadata (https://supadata.ai), opcional atrás de SUPADATA_API_KEY.

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string };

async function transcribeYouTube(videoId: string) {
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
  if (!tracks.length) throw new Error("este vídeo não tem legendas disponíveis — cole a transcrição manualmente");

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
  if (!text) throw new Error("legenda vazia — cole a transcrição manualmente");

  return { title: data.videoDetails?.title as string | undefined, text };
}

async function transcribeViaSupadata(url: string, platform: string) {
  const key = process.env.SUPADATA_API_KEY;
  if (!key)
    throw new Error(
      `transcrição de ${platform} requer configurar SUPADATA_API_KEY (supadata.ai) — cole a transcrição manualmente`
    );
  const res = await fetch(
    `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}&text=true&lang=pt`,
    { headers: { "x-api-key": key } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? `Supadata respondeu ${res.status}`);
  // ponytail: jobId = transcrição assíncrona (vídeos longos); polling se algum dia precisar
  if (!data.content || typeof data.content !== "string")
    throw new Error("Supadata não retornou transcrição — cole a transcrição manualmente");
  return { title: undefined, text: data.content.trim() };
}

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim())
    return Response.json({ error: "url obrigatória" }, { status: 400 });

  try {
    const ytId = youtubeId(url);
    let result;
    if (ytId) result = await transcribeYouTube(ytId);
    else if (/instagram\.com\/(reels?|p|tv)\//.test(url)) result = await transcribeViaSupadata(url, "Instagram");
    else if (/tiktok\.com\//.test(url)) result = await transcribeViaSupadata(url, "TikTok");
    else
      return Response.json(
        { error: "link não reconhecido — suporto YouTube/Shorts, Instagram Reels e TikTok" },
        { status: 422 }
      );

    return Response.json({ title: result.title, text: result.text.slice(0, 100_000) });
  } catch (e) {
    console.error("transcrição falhou", url, e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }
}
