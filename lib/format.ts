export const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));

// WP-F.2: multiplicador vídeo÷média do cliente no PublishBox — "N.Nx" + tom de cor
export const fmtRatio = (n: number) => `${n.toFixed(1)}x`;
export const ratioTone = (r: number): "gold" | "amber" | "neutral" =>
  r >= 1.2 ? "gold" : r < 0.8 ? "amber" : "neutral";
