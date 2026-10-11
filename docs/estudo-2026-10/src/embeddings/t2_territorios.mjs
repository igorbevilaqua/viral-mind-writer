// Tarefa 2b: nomes dos territórios (lidos à mão dos 8 títulos mais próximos do centróide), grava data/clusters.json
// e mede cada território com avaliar (coef, por plataforma) e porGrupo por cliente.
import { readFileSync, writeFileSync } from "node:fs";
import { OUT, DATA, carregar, avaliar, porGrupo, fmt } from "../lib.mjs";
import { IDS } from "./base.mjs";

export const NOMES30 = [
  "Dívida pública e governo empobrecendo o brasileiro", // 0
  "Pré-MBA: ChatGPT, novas IAs e empregos", // 1
  "A decisão que salvou ou afundou uma gigante brasileira", // 2
  "IA no dia a dia: ferramentas, vigilância, China", // 3
  "Carros chineses BYD e Geely dominando o Brasil", // 4
  "Marcas brasileiras de comida vendidas por bilhões", // 5
  "Costumes, proibições e planos da China", // 6
  "Apple, iPhone e suas jogadas de venda", // 7
  "Jogadas de marketing de produtos e lojas", // 8
  "Impostos por trás de fortunas de famosos", // 9
  "Empresas que venceram o governo no imposto", // 10
  "Erros de comunicação e como falar melhor", // 11
  "Mulheres que saíram da feira para o império", // 12
  "Copa, Seleção e dinheiro no futebol", // 13
  "Robôs domésticos e máquinas controladas pela mente", // 14
  "De vendedor humilde a dono de império", // 15
  "Estudantes brasileiros que inventaram soluções premiadas", // 16
  "Médicos, medicina e plano de saúde", // 17
  "Fundadores que venderam empresas por milhões", // 18
  "Carros de luxo e montadoras clássicas", // 19
  "Marcas da infância que sumiram", // 20
  "Varejistas brasileiras quebrando com dívidas bilionárias", // 21
  "Guerra dos marketplaces e o fim da loja física", // 22
  "Inovação verde e tecnologia do Nordeste", // 23
  "Guerra, petróleo e EUA x China no seu bolso", // 24
  "Segredos de marcas globais como Starbucks e Red Bull", // 25
  "Barcos, iates e navegação sem combustível", // 26
  "Empresários nordestinos que começaram do zero", // 27
  "Brasil como polo de IA entre China e EUA", // 28
  "China humilhando o mundo com robôs e tecnologia", // 29
];
export const NOMES60 = [
  "Carros chineses BYD e Geely dominando o Brasil", // 0
  "Barcos, iates e megaconstruções de engenharia", // 1
  "Chocolates e doces que viraram fortuna", // 2
  "Coca-Cola e os rivais que a desafiaram", // 3
  "Bilionários que perderam tudo, como Eike Batista", // 4
  "Colapso de gigantes como Americanas e Pão de Açúcar", // 5
  "Empresas que venceram o governo no imposto", // 6
  "Erros de comunicação e como falar melhor", // 7
  "Dívida pública e governo empobrecendo o brasileiro", // 8
  "China humilhando o mundo com robôs e tecnologia", // 9
  "Uber e Elon Musk trocando humanos por máquinas", // 10
  "Segredos e contradições de bilionários como Buffett", // 11
  "Tecnologia antiga que a geração Z quer de volta", // 12
  "Estudantes que resolvem problemas com lixo barato", // 13
  "Varejistas brasileiras quebrando com dívidas bilionárias", // 14
  "Alunos brasileiros premiados em robótica e ciência", // 15
  "Robôs humanoides chineses substituindo pessoas", // 16
  "McDonald's e a guerra do fast food", // 17
  "Marcas da infância que sumiram, como Ki-Suco", // 18
  "Brasil entre China e EUA na corrida da IA", // 19
  "Carros de luxo e marcas clássicas como Ferrari", // 20
  "Apple, iPhone e suas jogadas de venda", // 21
  "Indústrias de Santa Catarina nascidas no quintal", // 22
  "Planos da China para dominar o mundo e o Nordeste", // 23
  "Havaianas: do chinelo barato ao luxo", // 24
  "Guerra dos marketplaces: Mercado Livre, Shopee, Amazon", // 25
  "Negócios de família nordestinos que viraram milhões", // 26
  "Celular, dados e IA vigiando sua vida", // 27
  "Médico mal pago e armadilhas da profissão", // 28
  "Pré-MBA: ChatGPT, novas IAs e empregos", // 29
  "Impostos por trás de fortunas de famosos", // 30
  "Mulheres que saíram da feira para o império", // 31
  "Ferramentas de IA que acabam com empregos", // 32
  "Empresas e pessoas que enriqueceram usando IA", // 33
  "Lula, eleição e candidatos de 2026", // 34
  "Guerra, petróleo e Trump no seu bolso", // 35
  "Brasil no meio da briga EUA x China", // 36
  "Apple, Meta e Google na guerra dos óculos de IA", // 37
  "China comprando o agro e a energia do Brasil", // 38
  "Novas IAs como Claude assustando o mercado", // 39
  "Fundadores que venderam empresas por milhões", // 40
  "Jogadas de marketing que fazem fila na porta", // 41
  "Marcas brasileiras vendidas para gigantes estrangeiras", // 42
  "Crianças cearenses premiadas em olimpíadas mundiais", // 43
  "IA substituindo profissões e criando vagas", // 44
  "De vendedor humilde a bilionário do varejo", // 45
  "Carro voador e aviação sem piloto", // 46
  "Golpes e armadilhas feitas com IA", // 47
  "Academias como Smart Fit e seus modelos de negócio", // 48
  "Bastidores do dinheiro nos clubes de futebol", // 49
  "Reforma tributária e impostos escondidos", // 50
  "Médicos heróis esquecidos pelo Brasil", // 51
  "O fim do comércio de bairro e do Brás", // 52
  "Olympikus, Nike e a guerra dos tênis", // 53
  "Vendas online e lives que faturam milhões", // 54
  "Negócios que transformam lixo em dinheiro", // 55
  "Costumes e curiosidades do cotidiano chinês", // 56
  "Marcas feias ou falidas que viraram desejo", // 57
  "Copa do Mundo, Seleção e patrocínios", // 58
  "Chips cerebrais e IA lendo a mente", // 59
];

const KM = JSON.parse(readFileSync(OUT + "embeddings/kmeans.json", "utf8"));
console.assert(NOMES30.length === 30 && NOMES60.length === 60, "um nome por cluster");
export const CLUSTERS = IDS.map((id, i) => ({
  script_id: id, c30: KM.k30.a[i], c60: KM.k60.a[i], nome30: NOMES30[KM.k30.a[i]], nome60: NOMES60[KM.k60.a[i]], sim_centroide30: KM.k30.sim[i],
}));

if (process.argv[1]?.endsWith("t2_territorios.mjs")) {
  writeFileSync(DATA + "clusters.json", JSON.stringify(CLUSTERS));
  const cl = new Map(CLUSTERS.map((c) => [c.script_id, c]));
  const L = carregar();
  const res = {};
  for (const k of [30, 60]) {
    const nomes = k === 30 ? NOMES30 : NOMES60, campo = `c${k}`;
    res[k] = [];
    for (let c = 0; c < k; c++) {
      const pred = (r) => cl.get(r.script_id)?.[campo] === c;
      const a = avaliar(nomes[c], pred);
      const pg = porGrupo(nomes[c], pred, (r) => r.cliente, { minN: 10 });
      const membros = CLUSTERS.filter((x) => x[campo] === c);
      const cli = {}; for (const r of L) if (pred(r)) cli[r.cliente] = (cli[r.cliente] ?? new Set()).add(r.script_id);
      const tam = Object.entries(cli).map(([n, s]) => [n, s.size]).sort((x, y) => y[1] - x[1]);
      const totAnal = tam.reduce((x, y) => x + y[1], 0);
      res[k].push({
        c, nome: nomes[c], roteiros: membros.length, videos: a.todas?.n, p: a.todas?.p, lift: a.todas?.lift, lb: a.todas?.lb, ub: a.todas?.ub,
        or: a.mh.or, or_lo: a.mh.lo, or_hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift, leitura: a.leitura,
        ig: a.Instagram?.lift, ig_n: a.Instagram?.n, tt: a.TikTok?.lift, tt_n: a.TikTok?.n, yt: a.YouTube?.lift, yt_n: a.YouTube?.n,
        dono: tam[0]?.[0], dono_share: tam[0] ? tam[0][1] / totAnal : null, n_clientes: tam.length,
        clientes: pg.map((g) => ({ cliente: g.grupo, n: g.n, roteiros: g.roteiros, lift: g.lift, or: g.mh.or, or_lo: g.mh.lo, or_hi: g.mh.hi })),
      });
    }
  }
  // escopo: global se o sinal aparece na maioria (>=60%) de >=2 clientes medidos; do cliente se um cliente domina
  const f = fmt.f2;
  for (const k of [30, 60]) for (const t of res[k]) {
    const pos = t.clientes.filter((g) => g.or > 1), neg = t.clientes.filter((g) => !(g.or > 1));
    const sobe = t.or_lo > 1, desce = t.or_hi < 1;
    if (!sobe && !desce) { t.escopo = "neutro"; continue; }
    const conc = sobe ? pos : neg;
    const e = t.dono_share >= 0.75 || t.clientes.length <= 1 ? `do cliente ${t.dono}` : conc.length >= 2 && conc.length / t.clientes.length >= 0.6 ? `global (${conc.length} de ${t.clientes.length} clientes)` : "misto";
    const forte = ["ajuda (replica)", "atrapalha (replica)", "sinal sem replicação"].includes(t.leitura);
    t.escopo = (forte ? "" : "indício só no OR MH: ") + e + (sobe ? "" : ", evitar");
  }
  writeFileSync(OUT + "embeddings/territorios.json", JSON.stringify(res, null, 1));
  const md = [];
  for (const k of [30, 60]) {
    md.push(`\n#### Territórios k=${k} (ordenados pelo OR de Mantel-Haenszel)\n`);
    md.push("| território | roteiros | % topo | lift IG | lift TT | lift YT | OR MH [IC95] | lift desc / val | onde funciona (OR>1 no cliente) | onde não | leitura | escopo |");
    md.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
    for (const t of [...res[k]].sort((a, b) => b.or - a.or)) {
      const lista = (arr) => arr.map((g) => `${g.cliente} ${f(g.or)}`).join("; ") || "nenhum";
      md.push(`| ${t.nome} | ${t.roteiros} | ${Math.round(100 * t.p)}% | ${f(t.ig)} | ${f(t.tt)} | ${f(t.yt)} | ${f(t.or)} [${f(t.or_lo)} a ${f(t.or_hi)}] | ${f(t.desc)} / ${f(t.val)} | ${lista(t.clientes.filter((g) => g.or > 1))} | ${lista(t.clientes.filter((g) => !(g.or > 1)))} | ${t.leitura} | ${t.escopo} |`);
    }
  }
  writeFileSync(OUT + "embeddings/tabela_territorios.md", md.join("\n") + "\n");
  console.log(md.join("\n"));
}

// carro chinês depende de citar a China no hook? (e quanto do "hook com China" é esse território)
if (process.argv[1]?.endsWith("t2_territorios.mjs")) {
  const { norm, tabela } = await import("../lib.mjs");
  const c60 = new Map(CLUSTERS.map((c) => [c.script_id, c.c60]));
  const china = (r) => /china|chines/.test(norm(r.g?.hook)), carro = (r) => c60.get(r.script_id) === 0;
  console.log("\n" + tabela([
    avaliar("carro chinês com China no hook", (r) => carro(r) && china(r), { minN: 10 }),
    avaliar("carro chinês sem China no hook", (r) => carro(r) && !china(r), { minN: 10 }),
    avaliar("China no hook fora de carro chinês", (r) => !carro(r) && china(r)),
  ]));
}
