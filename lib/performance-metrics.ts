// Lógica pura do elo de performance (casamento de vídeo + agregação de métricas).
// Módulo separado de lib/script-performance.ts para ser testável sem env de Supabase,
// mesmo motivo de lib/etl-gate.ts.
import { platformVideoId } from "./video-url";

// O corpus guarda a URL crua em videos.link_video e a busca é por substring (ilike),
// que aceita falso positivo. O casamento válido é id de plataforma × id de plataforma.
export function mesmoVideo(linkCorpus: string | null | undefined, pid: string): boolean {
  return !!linkCorpus && platformVideoId(linkCorpus) === pid;
}

// views_no_dia / fb_views_no_dia / compartilhamentos_no_dia são SNAPSHOT ACUMULADO
// (total do vídeo até aquele dia), não delta: o total é o PICO do contador, NUNCA a soma
// dos dias — somar inflava ~Ndias× (num dos publicados: 199.577 vira 4.181.095).
export function totalAcumulado(valores: readonly (number | null | undefined)[]): number | null {
  const nums = valores.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return nums.length ? Math.max(...nums) : null;
}

export interface Diaria {
  views_no_dia?: number | null;
  fb_views_no_dia?: number | null;
  compartilhamentos_no_dia?: number | null;
}

export function agregarDiarias(
  rows: readonly Diaria[],
  plataforma: string | null
): { views: number; compartilhamentos: number | null } {
  return {
    // Mesma fórmula da MV vm_video_stats: pico de views + pico do espelho no Facebook.
    // O espelho só vale para post do INSTAGRAM (migration 0047): 31 vídeos do TikTok têm
    // fb_views_no_dia preenchido, que é ruído de coleta, e num vídeo cujo canal já é o
    // Facebook as views próprias JÁ são o Facebook — somar contaria duas vezes. Plataforma
    // desconhecida não soma: sem saber a rede, o espelho não se sustenta.
    views:
      (totalAcumulado(rows.map((r) => r.views_no_dia)) ?? 0) +
      (/instagram/i.test(plataforma ?? "")
        ? (totalAcumulado(rows.map((r) => r.fb_views_no_dia)) ?? 0)
        : 0),
    // YouTube não tem coleta de compartilhamento nenhuma (0 de 2.266 vídeos do corpus):
    // 0 ali é ausência de dado, não zero real — vira null para a UI não mentir.
    compartilhamentos: /youtube/i.test(plataforma ?? "")
      ? null
      : totalAcumulado(rows.map((r) => r.compartilhamentos_no_dia)),
  };
}

// metricas_retencao.seguidores_ganhos é text com sujeira ("+1.2k", "—"). Mesma limpeza
// do regexp_replace de 0007/0013, para o número bater com o do corpus.
export function parseSeguidores(v: unknown): number | null {
  if (v == null) return null;
  const limpo = String(v).replace(/[^0-9-]/g, "");
  const n = Number(limpo);
  return limpo && Number.isFinite(n) ? n : null;
}
