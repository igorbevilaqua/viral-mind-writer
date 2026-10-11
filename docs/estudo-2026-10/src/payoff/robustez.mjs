// Checagens de robustez dos achados principais: tira um cliente por vez, separa China, olha tamanho do roteiro.
import { carregar, avaliar, mantelHaenszel, DESFECHOS, fmt, tabela, norm } from "../lib.mjs";
const L = carregar().filter((r) => r.llm && !r.llm.recusa);
const P3 = ["Instagram", "TikTok", "YouTube"], B = L.filter((r) => P3.includes(r.plataforma));
const { f2 } = fmt;
const china = (r) => /china|chines/.test(norm(`${r.g?.hook} ${r.s?.titulo}`));
// 1. tira um cliente por vez
for (const [nome, pred] of [["disputa", (r) => r.llm.payoff === "disputa"], ["orgulho", (r) => r.llm.payoff === "orgulho"], ["superacao", (r) => r.llm.payoff === "superacao"], ["vantagem", (r) => r.llm.payoff === "vantagem"], ["subhook puxa_espectador", (r) => r.llm.funcao_subhook === "puxa_espectador"], ["herói + gigante", (r) => ["orgulho", "inspiracao", "superacao"].includes(r.llm.payoff) && r.llm.antagonista === "gigante"]]) {
  const porCli = {}; for (const r of B.filter(pred)) porCli[r.cliente] = (porCli[r.cliente] ?? 0) + 1;
  const tops = Object.entries(porCli).sort((a, b) => b[1] - a[1]);
  const ors = tops.slice(0, 4).map(([c, n]) => { const m = mantelHaenszel(B.filter((r) => r.cliente !== c), pred, DESFECHOS.coef); return `sem ${c} (${n}): ${f2(m.or)} [${f2(m.lo)}-${f2(m.hi)}]`; });
  const m = mantelHaenszel(B, pred, DESFECHOS.coef);
  console.log(`\n${nome}: OR ${f2(m.or)} [${f2(m.lo)}-${f2(m.hi)}] · ${tops.length} clientes · ${ors.join(" · ")}`);
}
// 2. disputa com e sem China; orgulho com e sem "Brasil" no hook
console.log("\n" + tabela([
  avaliar("disputa sem China no hook/título", (r) => r.llm.payoff === "disputa" && !china(r), { linhas: L }),
  avaliar("disputa com China", (r) => r.llm.payoff === "disputa" && china(r), { linhas: L }),
  avaliar("China sem disputa", (r) => r.llm.payoff !== "disputa" && china(r), { linhas: L }),
  avaliar("antagonista rival sem China", (r) => r.llm.antagonista === "rival" && !china(r), { linhas: L }),
  avaliar("orgulho com recorte Brasil x estrangeiro", (r) => r.llm.payoff === "orgulho" && r.llm.recorte === "brasil_x_estrangeiro", { linhas: L }),
  avaliar("orgulho só Brasil", (r) => r.llm.payoff === "orgulho" && r.llm.recorte === "brasil", { linhas: L }),
  avaliar("orgulho com antagonista gigante ou rival", (r) => r.llm.payoff === "orgulho" && ["gigante", "rival"].includes(r.llm.antagonista), { linhas: L }),
  avaliar("orgulho sem antagonista", (r) => r.llm.payoff === "orgulho" && r.llm.antagonista === "nenhum", { linhas: L }),
  avaliar("inspiração com gigante ou rival", (r) => r.llm.payoff === "inspiracao" && ["gigante", "rival"].includes(r.llm.antagonista), { linhas: L }),
  avaliar("inspiração sem antagonista", (r) => r.llm.payoff === "inspiracao" && r.llm.antagonista === "nenhum", { linhas: L }),
  avaliar("superação com gigante ou rival", (r) => r.llm.payoff === "superacao" && ["gigante", "rival"].includes(r.llm.antagonista), { linhas: L }),
  avaliar("superação sem antagonista ou com problema", (r) => r.llm.payoff === "superacao" && ["nenhum", "problema"].includes(r.llm.antagonista), { linhas: L }),
]));
// 3. tamanho por tipo de conclusão (confusão possível com ret_final)
console.log("\ntipo_conclusao: palavras do roteiro (mediana), duração (mediana), palavras da conclusão (mediana)");
const med = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
for (const t of ["sintese", "licao", "consequencia", "pergunta", "virada_final", "futuro", "instrucao", "retomada", "sem_fechamento"]) {
  const sub = B.filter((r) => r.plataforma === "Instagram" && r.llm.tipo_conclusao === t);
  console.log(`  ${t.padEnd(15)} n=${sub.length} palavras ${med(sub.map((r) => r.g?.palavras_total))} duração ${med(sub.map((r) => r.duracao))} conclusão ${med(sub.map((r) => r.g?.palavras_conclusao))}`);
}
// sintese x ret_final controlando tamanho: só roteiros 350-500 palavras
const faixa = (r) => r.g?.palavras_total >= 350 && r.g?.palavras_total < 500;
console.log("\n" + tabela([
  avaliar("sintese x ret_final (350-499 palavras)", (r) => r.llm.tipo_conclusao === "sintese", { linhas: L.filter(faixa), desfecho: "ret_final", plats: ["Instagram"] }),
  avaliar("sintese x ret_final (todos)", (r) => r.llm.tipo_conclusao === "sintese", { linhas: L, desfecho: "ret_final", plats: ["Instagram"] }),
  avaliar("licao x ret_final (todos)", (r) => r.llm.tipo_conclusao === "licao", { linhas: L, desfecho: "ret_final", plats: ["Instagram"] }),
], ["Instagram"]));
// 4. payoff por rede: orgulho no YouTube por macro
for (const p of ["Instagram", "TikTok", "YouTube"]) {
  const sub = L.filter((r) => r.plataforma === p);
  const m = (pred) => { const x = mantelHaenszel(sub, pred, DESFECHOS.coef); return `${f2(x.or)} [${f2(x.lo)}-${f2(x.hi)}]`; };
  console.log(`${p}: orgulho Tec ${m((r) => r.llm.payoff === "orgulho" && r.macro.startsWith("Tec"))} · orgulho Neg ${m((r) => r.llm.payoff === "orgulho" && r.macro.startsWith("Neg"))}`);
}

// 5. replicação dos achados de nicho e de rede (descoberta x validação dentro do subgrupo)
const sub = (f) => L.filter(f);
const isM = (m) => (r) => r.macro.startsWith(m);
console.log("\n" + tabela([
  avaliar("alerta | Dinheiro", (r) => r.llm.payoff === "alerta", { linhas: sub(isM("Dinheiro")) }),
  avaliar("alerta | Tecnologia", (r) => r.llm.payoff === "alerta", { linhas: sub(isM("Tecnologia")) }),
  avaliar("queda | Dinheiro", (r) => r.llm.payoff === "queda", { linhas: sub(isM("Dinheiro")) }),
  avaliar("queda | Tecnologia", (r) => r.llm.payoff === "queda", { linhas: sub(isM("Tecnologia")) }),
  avaliar("revolta | Negócios", (r) => r.llm.payoff === "revolta", { linhas: sub(isM("Negócios")) }),
  avaliar("revolta | Dinheiro", (r) => r.llm.payoff === "revolta", { linhas: sub(isM("Dinheiro")) }),
  avaliar("orgulho | Tecnologia", (r) => r.llm.payoff === "orgulho", { linhas: sub(isM("Tecnologia")) }),
  avaliar("superacao | Tecnologia", (r) => r.llm.payoff === "superacao", { linhas: sub(isM("Tecnologia")) }),
  avaliar("superacao | Negócios", (r) => r.llm.payoff === "superacao", { linhas: sub(isM("Negócios")) }),
  avaliar("disputa | Negócios", (r) => r.llm.payoff === "disputa", { linhas: sub(isM("Negócios")) }),
]));
console.log("\n" + tabela([
  avaliar("orgulho | YouTube", (r) => r.llm.payoff === "orgulho", { linhas: L, plats: ["YouTube"] }),
  avaliar("orgulho | Instagram+TikTok", (r) => r.llm.payoff === "orgulho", { linhas: L, plats: ["Instagram", "TikTok"] }),
  avaliar("queda | YouTube", (r) => r.llm.payoff === "queda", { linhas: L, plats: ["YouTube"] }),
  avaliar("nostalgia | YouTube", (r) => r.llm.payoff === "nostalgia", { linhas: L, plats: ["YouTube"] }),
  avaliar("bastidor | YouTube", (r) => r.llm.payoff === "bastidor", { linhas: L, plats: ["YouTube"] }),
  avaliar("bastidor | Instagram+TikTok", (r) => r.llm.payoff === "bastidor", { linhas: L, plats: ["Instagram", "TikTok"] }),
], ["Instagram", "TikTok", "YouTube"]));
