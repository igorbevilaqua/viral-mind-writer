// Separa os efeitos que se misturam nas fórmulas: território x assunto, todo dia, pedido extra, "segue aqui".
import { mantelHaenszel, DESFECHOS, norm, fmt, lift } from "../lib.mjs";
import { RC } from "./conexao.mjs";
const y = DESFECHOS.seguidores;
const R = RC.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && y(r) != null && r.falado_tx);
const t = (r) => norm(r.falado_tx);
const pede = (r) => r.ft.v_comenta || r.ft.v_compart || r.ft.v_salva || r.ft.v_curte;
const tema = (r) => r._ovTemaFora >= 2 || r._ovHook >= 1;
const terr = (r) => !tema(r) && r.ft.prom;
const freq = (r) => r.ft.freq, aqui = (r) => /\bsegue aqui\b/.test(t(r));
const P1 = /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/;
const p1 = (r) => P1.test(t(r));
const f = (m) => `${fmt.f2(m.or)} [${fmt.f2(m.lo)}-${fmt.f2(m.hi)}]`;
const mh = (linhas, pred, ...ctrl) => mantelHaenszel(linhas.map((r) => ({ ...r, estrato: [r.estrato, ...ctrl.map((c) => c(r))].join("|") })), pred, y);
const semPedido = R.filter((r) => !pede(r));
console.log("base IG+TT com bloco:", R.length, "| sem pedido extra:", semPedido.length);
console.log("território (todos):", f(mh(R, terr)), "| ctrl pedido:", f(mh(R, terr, pede)), "| só sem pedido:", f(mh(semPedido, terr)), "| ctrl pedido+freq+segue aqui:", f(mh(R, terr, pede, freq, aqui)), "| ctrl tudo + trimestre:", f(mh(R, terr, pede, freq, aqui, (r) => r.tri)));
console.log("assunto do vídeo (tema):", f(mh(R, tema)), "| só sem pedido:", f(mh(semPedido, tema)), "| ctrl pedido+freq+aqui:", f(mh(R, tema, pede, freq, aqui)));
console.log("todo dia:", f(mh(R, freq)), "| só sem pedido:", f(mh(semPedido, freq)), "| ctrl tema+pedido+aqui:", f(mh(R, freq, tema, pede, aqui)), "| ctrl + trimestre:", f(mh(R, freq, tema, pede, aqui, (r) => r.tri)));
console.log("eu te mostro:", f(mh(R, p1)), "| ctrl freq:", f(mh(R, p1, freq)), "| ctrl freq+tema+pedido:", f(mh(R, p1, freq, tema, pede)));
console.log("segue aqui:", f(mh(R, aqui)), "| ctrl tema+pedido+freq:", f(mh(R, aqui, tema, pede, freq)), "| + trimestre:", f(mh(R, aqui, tema, pede, freq, (r) => r.tri)));
console.log("pedido extra:", f(mh(R, pede)), "| ctrl tema+freq+aqui:", f(mh(R, pede, tema, freq, aqui)), "| + trimestre:", f(mh(R, pede, tema, freq, aqui, (r) => r.tri)));
// dose: quantos dos 4 ingredientes bons (território, todo dia, eu te mostro, segue aqui) e nenhum ruim (pedido extra)
const score = (r) => (pede(r) ? -1 : 0) + (terr(r) ? 1 : 0) + (freq(r) ? 1 : 0) + (aqui(r) ? 1 : 0);
const base = R.filter(y).length / R.length;
for (const s of [-1, 0, 1, 2, 3]) { const S = R.filter((r) => Math.min(3, score(r)) === s); if (S.length) console.log(`  pontuação ${s}: n=${S.length} topo=${fmt.pct(S.filter(y).length / S.length)} lift=${fmt.f2(S.filter(y).length / S.length / base)}`); }
// por plataforma: território
for (const p of ["Instagram", "TikTok"]) { const S = R.filter((r) => r.plataforma === p); const l = lift(S, terr, y); console.log(p, "território lift", fmt.f2(l.lift), `[${fmt.f2(l.lb)}-${fmt.f2(l.ub)}] n=${l.n}`, "| OR", f(mantelHaenszel(S, terr, y))); }
