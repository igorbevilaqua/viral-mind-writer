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
    // mesma fórmula da MV vm_video_stats (0013): pico de views + pico do espelho no Facebook
    views:
      (totalAcumulado(rows.map((r) => r.views_no_dia)) ?? 0) +
      (totalAcumulado(rows.map((r) => r.fb_views_no_dia)) ?? 0),
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
