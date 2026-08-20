// Medição pura de ritmo e parágrafo. O parser é a peça crítica: frase mal cortada gera métrica
// falsa, e métrica falsa faz o humanizador reescrever o que estava bom.
import { describe, expect, test } from "vitest";
import {
  dividirFrases,
  paragrafosLongos,
  sequenciasLongas,
  FRASE_LONGA,
  MAX_LONGAS_SEGUIDAS,
  PARAGRAFO_MAX_PALAVRAS,
} from "@/lib/pipeline/slop-lint";
import { ritmoTargets, TETO_TRECHOS_RITMO } from "@/lib/pipeline/humanize";
import { blocoSinaisRevisor, TETO_RITMO } from "@/lib/pipeline/draft";

// n palavras longas o suficiente pra contar como frase longa, ou curtas o suficiente pra não.
const longa = (i = 0) => `A empresa avisou que o preço do produto ia subir de novo naquele mês ${i}.`;
const curta = () => "Ninguém acreditou.";

describe("parser de frases — português real", () => {
  test("abreviação de título não corta a frase", () => {
    expect(dividirFrases("O Sr. Silva pagou a conta. Depois sumiu.")).toEqual([
      "O Sr. Silva pagou a conta.",
      "Depois sumiu.",
    ]);
    expect(dividirFrases("A Dra. Ana assinou o laudo.")).toHaveLength(1);
  });

  test("'etc.' fecha frase quando vem maiúscula, e não fecha quando vem minúscula", () => {
    expect(dividirFrases("Carros, motos, etc. Depois disso o preço caiu.")).toHaveLength(2);
    expect(dividirFrases("Carros, motos, etc. e o que mais aparecer na rua.")).toHaveLength(1);
  });

  test("número com ponto não vira duas frases", () => {
    expect(dividirFrases("O aluguel foi de R$ 3.400 no mês passado.")).toHaveLength(1);
    expect(dividirFrases("Ele levantou 1.5 milhão de reais em uma semana.")).toHaveLength(1);
    expect(dividirFrases("Custou R$ 3.400. Depois subiu.")).toHaveLength(2);
  });

  test("reticências só cortam se o que vem depois começa frase", () => {
    expect(dividirFrases("Ele parou... e voltou correndo.")).toHaveLength(1);
    expect(dividirFrases("Ele parou... E voltou correndo.")).toHaveLength(2);
  });

  test("o travessão que o dedash remove não muda a contagem", () => {
    const com = "A taxa — que ninguém viu — subiu de novo. E aí ferrou.";
    const sem = "A taxa, que ninguém viu, subiu de novo. E aí ferrou.";
    expect(dividirFrases(com)).toHaveLength(2);
    expect(dividirFrases(sem)).toHaveLength(2);
  });

  test("quebra de linha fecha frase mesmo sem maiúscula depois", () => {
    expect(dividirFrases("Primeira linha.\nsegunda linha.")).toEqual(["Primeira linha.", "segunda linha."]);
  });

  test("texto sem pontuação final ainda devolve a frase", () => {
    expect(dividirFrases("uma frase solta sem ponto")).toEqual(["uma frase solta sem ponto"]);
    expect(dividirFrases("   ")).toEqual([]);
  });
});

describe("teto de parágrafo", () => {
  test("acusa só o que passa do teto, com a contagem de cada um", () => {
    const curtoP = "Isso mudou tudo.";
    const longoP = Array.from({ length: 6 }, (_, i) => longa(i)).join(" ");
    const r = paragrafosLongos(`${curtoP}\n\n${longoP}`);
    expect(r).toHaveLength(1);
    expect(r[0].palavras).toBeGreaterThan(PARAGRAFO_MAX_PALAVRAS);
    expect(r[0].texto).toBe(longoP);
  });

  test("o trecho devolvido é VERBATIM (o passe cirúrgico substitui literalmente)", () => {
    const p = Array.from({ length: 5 }, (_, i) => longa(i)).join(" ");
    const doc = `## ROTEIRO\nabertura curta.\n\n${p}\n\nfim.`;
    expect(doc).toContain(paragrafosLongos(doc)[0].texto);
  });

  test("parágrafo é separado por linha em branco, não por linha simples", () => {
    // como o roteiro é de fato armazenado: 40/40 de vm_generated_scripts usam "\n\n"
    const tresLinhas = `${longa(1)}\n${longa(2)}\n${longa(3)}`;
    expect(paragrafosLongos(tresLinhas)).toHaveLength(1); // um parágrafo só (45 palavras), estoura
    expect(paragrafosLongos(tresLinhas.replace(/\n/g, "\n\n"))).toEqual([]); // três de 15, nenhum estoura
  });

  test("FONTES e VARIACOES_DE_HOOK não são prosa e não entram na conta", () => {
    const doc = `## VARIACOES_DE_HOOK\n1. ${longa(1)}\n2. ${longa(2)}\n3. ${longa(3)}\n\n## FONTES\nVeículo Muito Longo De Nome Enorme Assim\nhttps://exemplo.com/materia`;
    expect(paragrafosLongos(doc)).toEqual([]);
  });

  // A linha "Sustenta:" de cada fonte (draft.ts, OUTPUT_FORMAT) é prosa de verdade e pode não
  // ter URL na mesma linha — quem a mantém fora da conta é só o `mudo` da seção FONTES.
  test("a linha Sustenta: das FONTES continua fora da conta, mesmo sem URL do lado", () => {
    const doc = `## FONTES\nVeículo\nhttps://exemplo.com/materia\nSustenta: ${longa(1)} ${longa(2)} ${longa(3)}\n\nOutra Instituição\nSustenta: ${longa(4)} ${longa(5)} ${longa(6)}`;
    expect(paragrafosLongos(doc)).toEqual([]);
  });
});

describe("sequência de frases longas", () => {
  test("acusa acima do teto e devolve posição e tamanho", () => {
    const texto = Array.from({ length: MAX_LONGAS_SEGUIDAS + 2 }, (_, i) => longa(i)).join(" ");
    const [s] = sequenciasLongas(`${curta()} ${texto} ${curta()}`);
    expect(s.tamanho).toBe(MAX_LONGAS_SEGUIDAS + 2);
    expect(s.inicio).toBe(1); // a curta é a frase 0
    expect(s.texto).toBe(texto);
  });

  test("exatamente no teto não acusa — a regra é teto de inércia, não cadência", () => {
    const noTeto = Array.from({ length: MAX_LONGAS_SEGUIDAS }, (_, i) => longa(i)).join(" ");
    expect(sequenciasLongas(noTeto)).toEqual([]);
  });

  test("uma frase curta no meio zera a corrida", () => {
    const metade = Array.from({ length: MAX_LONGAS_SEGUIDAS }, (_, i) => longa(i)).join(" ");
    expect(sequenciasLongas(`${metade} ${curta()} ${metade}`)).toEqual([]);
  });

  test("a sequência atravessa parágrafo (o ouvinte não ouve linha em branco)", () => {
    const a = Array.from({ length: 2 }, (_, i) => longa(i)).join(" ");
    const b = Array.from({ length: 3 }, (_, i) => longa(i + 9)).join(" ");
    const [s] = sequenciasLongas(`${a}\n\n${b}`);
    expect(s.tamanho).toBe(5);
    expect(s.texto).toContain("\n\n");
  });

  test("a sequência NÃO atravessa seção — senão o header entraria no trecho substituído", () => {
    const a = Array.from({ length: 3 }, (_, i) => longa(i)).join(" ");
    const b = Array.from({ length: 3 }, (_, i) => longa(i + 9)).join(" ");
    for (const s of sequenciasLongas(`## ROTEIRO\n${a}\n\n## COMANDO\n${b}`)) {
      expect(s.texto).not.toContain("##");
    }
  });

  test("frase no limite de FRASE_LONGA conta como longa", () => {
    const doze = "Ela" + Array.from({ length: FRASE_LONGA - 1 }, (_, i) => ` p${i}`).join("") + ".";
    const [s] = sequenciasLongas(Array.from({ length: 4 }, () => doze).join(" "));
    expect(s.tamanho).toBe(4);
  });
});

describe("ritmo no laço do humanizador", () => {
  test("vira violação block com o trecho exato, e limitada por tipo", () => {
    const paragrafo = (n: number) => Array.from({ length: 6 }, (_, i) => longa(n * 10 + i)).join(" ");
    const doc = Array.from({ length: TETO_TRECHOS_RITMO + 2 }, (_, i) => paragrafo(i)).join("\n\n");
    const t = ritmoTargets(doc);
    expect(t.every((v) => v.severity === "block")).toBe(true);
    expect(t.filter((v) => /parágrafo de/.test(v.label))).toHaveLength(TETO_TRECHOS_RITMO);
    // os 5 parágrafos são uma corrida só de frases longas: o ouvinte não ouve a linha em branco
    const seqs = t.filter((v) => /frases longas seguidas/.test(v.label));
    expect(seqs).toHaveLength(1);
    expect(seqs[0].label).toContain(`${(TETO_TRECHOS_RITMO + 2) * 6} frases`);
    for (const v of t) expect(doc).toContain(v.match); // verbatim, senão a substituição é no-op
  });

  test("texto já no ritmo não gera alvo nenhum", () => {
    expect(ritmoTargets(`${curta()} ${longa(1)} ${curta()}\n\n${longa(2)} ${curta()}`)).toEqual([]);
  });
});

describe("sinal de ritmo entregue ao revisor", () => {
  const paragrafos = [{ texto: "Um parágrafo bem comprido que estourou o teto.", palavras: 80 }];
  const sequencias = [{ texto: "Quatro frases longas seguidas aqui.", inicio: 3, tamanho: 5 }];

  test("os dois sinais entram e terminam em MANTENHA — nunca eliminatório", () => {
    const b = blocoSinaisRevisor([], false, paragrafos, sequencias);
    expect(b).toContain("80 palavras");
    expect(b).toContain("5 frases seguidas");
    expect(b.match(/MANTENHA/g)).toHaveLength(2);
    expect(b).not.toMatch(/eliminat[óo]rio|reprova/i);
  });

  test("proíbe explicitamente o metrônomo", () => {
    expect(blocoSinaisRevisor([], false, [], sequencias)).toMatch(/não alterne/i);
  });

  test("sem sinal de ritmo o bloco não muda", () => {
    expect(blocoSinaisRevisor([], false, [], [])).toBe("");
  });

  test("respeita o teto e diz quantos ficaram de fora", () => {
    const muitos = Array.from({ length: TETO_RITMO + 2 }, (_, i) => ({ texto: `p${i}`, palavras: 50 + i }));
    const b = blocoSinaisRevisor([], false, muitos, []);
    expect(b.match(/palavras: "/g)).toHaveLength(TETO_RITMO);
    expect(b).toContain("mais 2 parágrafos");
  });
});
