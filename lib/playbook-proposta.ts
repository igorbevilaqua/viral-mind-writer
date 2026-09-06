// Plano 020, WP-H. Puro (sem banco, sem LLM): das células da matriz estrutura × tema do
// estudo (lift.json) até a seção markdown que vira PROPOSTA de playbook (active:false).
// O corte é o do relatório §3: n ≥ 15 e Wilson inferior do p bruto acima da base — mesma
// regra do insight estrutura_tema_lift no ETL, para o prompt e o playbook não discordarem.
import { wilsonLower, wilsonUpper } from "./calibration";
import { ESTRUTURAS } from "./pipeline/taxonomia";

export const TITULO_2B = "PARTE 2-B — O que os dados dizem (estudo 2026-09)";
export const BASE_TOP = 0.25;
export const MIN_N_CELULA = 15;

export interface CelulaMatriz {
  estrutura: string; // código (A1…F4)
  tema: string;
  n: number;
  k: number;
  p_bruto: number;
  p_encolhido: number;
}

export function celulasFortes(celulas: CelulaMatriz[], minN = MIN_N_CELULA): CelulaMatriz[] {
  return celulas
    .filter((c) => c.n >= minN && wilsonLower(c.k, c.n) > BASE_TOP)
    .sort((a, b) => b.p_encolhido - a.p_encolhido || b.n - a.n);
}

const NOME = new Map(ESTRUTURAS.map((e) => [e.code, `${e.code} ${e.nome}`]));
const f2 = (x: number) => x.toFixed(2).replace(".", ",");
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function secaoDados(celulas: CelulaMatriz[]): string {
  const linhas = celulas.map((c) => {
    const lb = wilsonLower(c.k, c.n) / BASE_TOP;
    const ub = wilsonUpper(c.k, c.n) / BASE_TOP;
    return `| ${c.tema} | ${NOME.get(c.estrutura) ?? c.estrutura} | ${c.n} | ${pct(c.p_bruto)} (encolhido ${pct(c.p_encolhido)}) | ${f2(c.p_bruto / BASE_TOP)}× [${f2(lb)}–${f2(ub)}] |`;
  });
  return [
    `## ${TITULO_2B}`,
    "",
    "Medido em ~3.200 vídeos do corpus com estrutura e tema rotulados. `% top quartil` = quantos ficaram no quartil superior de `coeficiente_viral` dentro do próprio canal e plataforma (base esperada: 25%). `lift` = essa taxa ÷ 25%, com intervalo de confiança de 95% (Wilson). Só entram células com n ≥ 15 e limite inferior do intervalo acima de 1.",
    "",
    "| Tema | Estrutura | n | % top quartil | Lift [IC 95%] |",
    "|---|---|---|---|---|",
    ...linhas,
    "",
    "Como ler: são HIPÓTESES com amostra pequena (n entre 15 e ~70), não regra. O intervalo acima de 1 diz que o acaso sozinho explica mal a diferença; não diz que a estrutura causa o resultado (estrutura acompanha cliente, época e premissa). Uso prático: com premissa num destes temas, ao menos uma candidata usa a estrutura listada; fugir dela é legítimo, mas pede justificativa em `porque_funciona`. Células fora desta tabela não têm evidência nem contra nem a favor.",
  ].join("\n");
}

// Playbook + seção, com uma linha em branco entre eles e fim de arquivo limpo.
export const anexarSecao = (content: string, secao: string) => `${content.trimEnd()}\n\n${secao}\n`;
