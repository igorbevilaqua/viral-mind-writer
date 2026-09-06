import { describe, expect, it } from "vitest";
import {
  contarFrases,
  filtrarCandidatos,
  hookLint,
  selectHook,
  type HookCandidate,
} from "@/lib/pipeline/hook-mechanisms";

// Fase 3: seleção do hook principal + variantes a partir dos candidatos gerados.
const c = (hook: string, mecanismo: string): HookCandidate => ({ hook, mecanismo });

describe("selectHook", () => {
  // ranking global de set/2026 (lift_lb): o único acima de 1 é Conflito Declarado
  const rank = new Map([
    ["Conflito Declarado", 1.13],
    ["Urgência", 1.06],
    ["Contraste Extremo", 1.0],
    ["Elemento Controverso", 1.0],
    ["Apelo à Autoridade", 0.96],
    ["Ultra Especificidade", 0.95],
  ]);
  const cands = [c("ce", "Contraste Extremo"), c("cd", "Conflito Declarado"), c("ur", "Urgência"), c("rs", "Revelação Secreta"), c("ee", "Ultra Especificidade")];

  it("principal = candidato do mecanismo de maior lift_lb; variantes distintas", () => {
    const out = selectHook(cands, rank)!;
    expect(out.principal.hook).toBe("cd");
    expect(out.variantes).toHaveLength(3);
    expect(new Set(out.variantes.map((v) => v.mecanismo)).size).toBe(3);
    expect(out.variantes[0].hook).toBe("ur"); // 2º maior lift_lb
    expect(out.motivo).toBe("Conflito Declarado: IC inferior do lift 1,13");
  });

  it("recentes=[] reproduz o comportamento anterior (só lift)", () => {
    expect(selectHook(cands, rank, { recentes: [] })).toEqual(selectHook(cands, rank));
  });

  it("sem ranking → ordem estável (principal = 1º candidato) e motivo honesto", () => {
    const out = selectHook(cands, new Map())!;
    expect(out.principal.hook).toBe("ce");
    expect(out.variantes.map((v) => v.hook)).toEqual(["cd", "ur", "rs"]);
    expect(out.motivo).toBe("sem ranking: ordem do modelo");
  });

  it("penalidade 0.6^usos muda a ordem: 1 uso do topo (1.13×0.6=0.68) perde para Urgência (1.06)", () => {
    const out = selectHook(cands, rank, { recentes: ["Conflito Declarado"] })!;
    expect(out.principal.hook).toBe("ur");
    expect(out.motivo).toBe("Conflito Declarado penalizado: 1 dos últimos 1 hooks deste cliente; principal Urgência (IC inferior do lift 1,06)");
    expect(out.principal.mecanismo).not.toBe("Conflito Declarado");
  });

  it("regra dura: topo em ≥3 dos recentes com alternativa ≥0.8× não é principal", () => {
    // Com 0.6^usos e ≤5 recentes a penalidade sozinha já derruba o topo saturado; a regra dura é o
    // invariante que sobrevive se a constante mudar. Isolada aqui: os dois igualmente penalizados
    // (3 usos cada), o topo ainda venceria por score (0.244 vs 0.229) — a regra impede.
    const dois = [c("cd", "Conflito Declarado"), c("ur", "Urgência")];
    const recentes = ["Conflito Declarado", "Urgência", "Conflito Declarado", "Urgência", "Conflito Declarado", "Urgência"];
    const out = selectHook(dois, rank, { recentes })!;
    expect(out.principal.hook).toBe("ur");
    expect(out.motivo).toBe("Conflito Declarado penalizado: 3 dos últimos 6 hooks deste cliente; principal Urgência (IC inferior do lift 1,06)");
  });

  it("regra dura sem alternativa forte mantém o topo", () => {
    // alternativa com lb 0.2 (< 0.8×1.13 e < 1.13×0.6³=0.244): nem regra dura nem penalidade trocam
    const fraco = new Map([["Conflito Declarado", 1.13], ["Ultra Especificidade", 0.2]]);
    const recentes = ["Conflito Declarado", "Conflito Declarado", "Conflito Declarado", "Urgência", "Urgência"];
    const out = selectHook([c("cd", "Conflito Declarado"), c("ee", "Ultra Especificidade")], fraco, { recentes })!;
    expect(out.principal.hook).toBe("cd");
    expect(out.motivo).toBe("Conflito Declarado: IC inferior do lift 1,13");
  });

  it("mecanismo fora do ranking recebe min−0.05: abaixo de quem tem evidência, nunca zero", () => {
    // Revelação Secreta não está no ranking → base 0.95−0.05=0.90; ganha do topo penalizado 2× (1.13×0.36=0.41)
    // e de Ultra Especificidade penalizado 1× (0.95×0.6=0.57), mas perde de Ultra sem penalidade.
    const out = selectHook([c("cd", "Conflito Declarado"), c("rs", "Revelação Secreta"), c("ee", "Ultra Especificidade")], rank, {
      recentes: ["Conflito Declarado", "Conflito Declarado", "Ultra Especificidade"],
    })!;
    expect(out.principal.hook).toBe("rs");
    expect(out.motivo).toBe("Conflito Declarado penalizado: 2 dos últimos 3 hooks deste cliente; principal Revelação Secreta (fora do ranking)");
    const semPen = selectHook([c("rs", "Revelação Secreta"), c("ee", "Ultra Especificidade")], rank)!;
    expect(semPen.principal.hook).toBe("ee"); // 0.95 > 0.90
    // todos fora do ranking → ordem do modelo, motivo diz que não há evidência
    const fora = selectHook([c("rs", "Revelação Secreta"), c("su", "Superlativo")], rank)!;
    expect(fora.principal.hook).toBe("rs");
    expect(fora.motivo).toBe("Revelação Secreta: fora do ranking (sem evidência mínima), ordem do modelo");
  });

  it("determinismo: mesma entrada → mesma saída", () => {
    const recentes = ["Conflito Declarado", "Urgência", "Conflito Declarado"];
    const a = selectHook(cands, rank, { recentes });
    const b = selectHook(cands, rank, { recentes });
    expect(a).toEqual(b);
  });

  it("mecanismos repetidos → variantes preferem distintos, completam com o resto", () => {
    const reps = [c("a", "Contraste Extremo"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Contraste Extremo")];
    const out = selectHook(reps, new Map([["Contraste Extremo", 1.0], ["Revelação Secreta", 0.9]]))!;
    expect(out.principal.mecanismo).toBe("Contraste Extremo");
    expect(out.variantes).toHaveLength(3);
    expect(out.variantes[0].mecanismo).toBe("Revelação Secreta");
  });

  it("candidatos vazios → null", () => {
    expect(selectHook([{ hook: "  ", mecanismo: "Outro" }], new Map())).toBeNull();
  });
});

describe("hookLint", () => {
  it("aprova hook de 2 frases, específico e sem abertura genérica", () => {
    expect(hookLint("Ontem esse cara era bilionário. Hoje ele não consegue pagar o advogado.")).toEqual([]);
  });

  it("reprova saudação e frase genérica de abertura", () => {
    expect(hookLint("Olá, hoje vamos falar sobre a importância de nunca desistir.").length).toBeGreaterThan(0);
    expect(hookLint("E aí pessoal, tudo bem?")[0]).toMatch(/saudação/);
    expect(hookLint("Você sabia que o Banco Central mudou a regra?")[0]).toMatch(/você sabia que/i);
    expect(hookLint("Nesse vídeo eu vou te mostrar o erro que todo mundo comete.").length).toBe(2);
  });

  it("pega abertura morta com acento, onde \\b falharia", () => {
    // "atenção" termina em letra acentuada: \b do JS não casaria depois dela
    expect(hookLint("Presta atenção no que a Globo acabou de anunciar.")[0]).toMatch(/presta atenção/);
  });

  it("reprova travessão e ponto e vírgula", () => {
    expect(hookLint("Ele perdeu tudo — e ninguém percebeu.")).toEqual(["travessão"]);
    expect(hookLint("Ele perdeu tudo; ninguém percebeu.")).toEqual(["ponto e vírgula"]);
  });

  it("reprova acima de 4 frases", () => {
    expect(hookLint("Uma. Duas. Três. Quatro.")).toEqual([]);
    expect(hookLint("Uma. Duas. Três. Quatro. Cinco.")[0]).toMatch(/5 frases/);
  });

  it("não conta o ponto dentro de número como fim de frase", () => {
    expect(contarFrases("Ele faturou R$ 12.457,32 em 4 dias. Usando só o Bloco de Notas.")).toBe(2);
  });
});

describe("filtrarCandidatos", () => {
  const bom = (h: string, m: string): HookCandidate => ({ hook: h, mecanismo: m });

  it("descarta os reprovados quando sobram candidatos suficientes", () => {
    const cands = [
      bom("Olá pessoal, vamos começar.", "Urgência"),
      bom("Ontem era bilionário. Hoje está preso.", "Contraste Extremo"),
      bom("A China constrói um país paralelo. Quase ninguém percebeu.", "Revelação Secreta"),
      bom("O Ratinho venceu o governo. Cancelou uma multa de 58 milhões.", "Conflito Declarado"),
      bom("A empresa mais valiosa do mundo emitiu um alerta. Ninguém queria ouvir.", "Superlativo"),
    ];
    const out = filtrarCandidatos(cands);
    expect(out.candidatos).toHaveLength(4);
    expect(out.descartados).toHaveLength(1);
    expect(out.descartados[0].motivos[0]).toMatch(/saudação/);
  });

  it("fail-soft: sem aprovados suficientes, reprovados voltam atrás dos aprovados", () => {
    const cands = [
      bom("Olá pessoal.", "Urgência"),
      bom("Ontem era bilionário. Hoje está preso.", "Contraste Extremo"),
      bom("Nesse vídeo eu vou te mostrar tudo.", "Superlativo"),
    ];
    const out = filtrarCandidatos(cands);
    expect(out.candidatos).toHaveLength(3); // nenhum sumiu
    expect(out.candidatos[0].mecanismo).toBe("Contraste Extremo"); // aprovado na frente
    expect(out.descartados).toHaveLength(2);
  });
});
