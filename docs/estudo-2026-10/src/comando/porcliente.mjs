// Quebra por cliente dos achados candidatos (seguidores, IG+TT): quem usa, quanto, e se o efeito aparece dentro de cada um.
import { norm, lift, DESFECHOS, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
const t = (r) => norm(r.falado_tx);
export const CAND = {
  freq: (r) => r.ft.freq,
  segue_aqui: (r) => /\bsegue aqui\b/.test(t(r)),
  nao_ficar_fora: (r) => /\bnao (ficar|fique) (de fora|para tras|pra tras)\b/.test(t(r)),
  se_gosta: (r) => /\bse (voce|vc) (gosta|curte|curtiu|gostou|ama)\b/.test(t(r)),
  comenta: (r) => r.ft.v_comenta,
  prom_1p: (r) => /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/.test(t(r)),
  negocios: (r) => r.ft.o_negocios,
  so_nome_acao: (r) => !/\b(mostro|revelo|trago|analiso|ensino|explico|conto|entender|saber|conhecer|aprender|receber|acompanhar)\b/.test(t(r)) && /\bsegu/.test(t(r)),
};
if (process.argv[1]?.endsWith("porcliente.mjs")) {
  const nomes = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CAND);
  const y = DESFECHOS.seguidores;
  const R = L.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && y(r) != null && r.falado_tx);
  for (const nome of nomes) {
    const p = CAND[nome];
    const por = new Map();
    for (const r of R) { const k = `${r.cliente}|${r.plataforma[0]}`; (por.get(k) ?? por.set(k, []).get(k)).push(r); }
    const linhas = [];
    for (const [k, g] of por) {
      const com = g.filter(p), sem = g.filter((r) => !p(r));
      if (!com.length) continue;
      const pc = (a) => (a.length ? a.filter(y).length / a.length : NaN);
      linhas.push(`${k}: ${com.length}/${g.length} usam | topo com ${fmt.pct(pc(com))} vs sem ${fmt.pct(pc(sem))}`);
    }
    const l = lift(R, p, y);
    console.log(`\n## ${nome}: n=${l.n} roteiros=${l.roteiros} clientes=${l.clientes} lift=${fmt.f2(l.lift)}\n  ` + linhas.join("\n  "));
  }
}
