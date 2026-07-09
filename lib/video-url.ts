// Fonte única de padrões de URL de vídeo (validação + extração de id por plataforma).
export const VIDEO_URL_RE = /youtube\.com|youtu\.be|instagram\.com|tiktok\.com/i;

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/;
const IG = /instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/;
const TT = /tiktok\.com\/.*video\/(\d+)/;

export function platformVideoId(url: string): string | null {
  const m = url.match(YT) ?? url.match(IG) ?? url.match(TT);
  return m?.[1] ?? null;
}

export const youtubeId = (url: string) => url.match(YT)?.[1] ?? null;
