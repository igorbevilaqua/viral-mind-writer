// Fonte única de padrões de URL de vídeo (validação + extração de id por plataforma).
export const VIDEO_URL_RE = /youtube\.com|youtu\.be|instagram\.com|tiktok\.com/i;

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/;
// O Instagram também copia o link com o perfil na frente (instagram.com/<perfil>/reel/<id>/).
const IG = /instagram\.com\/(?:[\w.]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]+)/;
const TT = /tiktok\.com\/.*video\/(\d+)/;

export function platformVideoId(url: string): string | null {
  return url.match(YT)?.[1] ?? url.match(IG)?.[2] ?? url.match(TT)?.[1] ?? null;
}

export const youtubeId = (url: string) => url.match(YT)?.[1] ?? null;

// Link curto: o id do vídeo só aparece depois de seguir o redirect.
export const LINK_CURTO_RE = /(?:vm|vt)\.tiktok\.com\/|tiktok\.com\/t\/|instagram\.com\/share\//i;

const LINK_RE = /(?:https?:\/\/)?(?:[\w-]+\.)*(?:instagram\.com|tiktok\.com|youtube\.com|youtu\.be)\/[^\s<>"']*/i;

/**
 * Deixa o link colado na forma que os serviços de transcrição aceitam: acha o link no meio de
 * texto colado junto, tira ?igsh= e ?utm_, tira o perfil da frente e troca /reels/ por /reel/.
 * YouTube passa como veio, porque `youtubeId` já lê o id em todas as variantes.
 */
export function normalizarLinkDeVideo(bruto: string): string {
  const achado = bruto.match(LINK_RE)?.[0];
  if (!achado) return bruto.trim();
  const url = (/^https?:/i.test(achado) ? achado : `https://${achado}`).replace(/[).,;]+$/, "");
  const ig = url.match(IG);
  if (ig) return `https://www.instagram.com/${ig[1] === "reels" ? "reel" : ig[1]}/${ig[2]}/`;
  const tt = url.match(/tiktok\.com\/(@[\w.-]+)\/video\/(\d+)/i);
  if (tt) return `https://www.tiktok.com/${tt[1]}/video/${tt[2]}`;
  return url;
}
