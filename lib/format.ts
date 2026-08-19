export const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));

// Datas sempre em São Paulo: as páginas são server components e o host (Vercel) roda em UTC,
// então sem timeZone explícito o horário vinha 3h adiantado e "hoje" virava às 21h BRT.
const TZ = "America/Sao_Paulo";
// ponytail: chave de dia via en-CA (YYYY-MM-DD) para comparar dias no fuso certo sem lib de datas
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "short" }).replace(".", "");

export function fmtWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) {
    const mins = (now.getTime() - d.getTime()) / 60000;
    if (mins < 5) return "agora";
    return `hoje ${d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}`;
  }
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return "ontem";
  return fmtDay(iso);
}

/**
 * O título da página pública do roteiro (aba do navegador e preview de WhatsApp/OG).
 * O CLIENTE vem primeiro depois da marca: é a informação que identifica o link numa conversa
 * cheia deles, e sem ela todo roteiro compartilhado chegava com o mesmo cabeçalho.
 * Sessão sem cliente continua funcionando — o campo simplesmente não entra.
 */
export function tituloPublico(p: { cliente?: string | null; headline?: string | null; data?: string }): string {
  return ["CODEX", p.cliente?.trim(), p.headline?.trim() || "Roteiro", p.data].filter(Boolean).join(" · ");
}

// WP-F.2: multiplicador vídeo÷média do cliente no PublishBox — "N.Nx" + tom de cor
export const fmtRatio = (n: number) => `${n.toFixed(1)}x`;
export const ratioTone = (r: number): "gold" | "amber" | "neutral" =>
  r >= 1.2 ? "gold" : r < 0.8 ? "amber" : "neutral";
