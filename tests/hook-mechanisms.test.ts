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
  it("principal = candidato do mecanismo mais bem ranqueado", () => {
    const cands = [c("a", "Urgência"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Superlativo")];
    const rank = new Map([["Contraste Extremo", 0.58], ["Revelação Secreta", 0.26], ["Superlativo", 0.16]]);
    const out = selectHook(cands, rank)!;
    expect(out.principal.hook).toBe("b"); // Contraste Extremo, maior share
    expect(out.variantes).toHaveLength(3);
    // variantes de mecanismos distintos
    expect(new Set(out.variantes.map((v) => v.mecanismo)).size).toBe(3);
  });

  it("sem ranking → ordem estável (principal = 1º candidato)", () => {
    const cands = [c("a", "Urgência"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Superlativo")];
    const out = selectHook(cands, new Map())!;
    expect(out.principal.hook).toBe("a");
    expect(out.variantes.map((v) => v.hook)).toEqual(["b", "d", "e"]);
  });

  it("mecanismos repetidos → variantes preferem distintos, completam com o resto", () => {
    const cands = [c("a", "Contraste Extremo"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Contraste Extremo")];
    const rank = new Map([["Contraste Extremo", 0.58], ["Revelação Secreta", 0.26]]);
    const out = selectHook(cands, rank)!;
    expect(out.principal.mecanismo).toBe("Contraste Extremo");
    expect(out.variantes).toHaveLength(3);
    // primeira variante deve ser o mecanismo distinto (Revelação), depois completa
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
