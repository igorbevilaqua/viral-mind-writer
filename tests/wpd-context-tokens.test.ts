import { describe, expect, it, vi } from "vitest";

// context.ts importa lib/db, que instancia o client Supabase no import — mock vazio basta
// porque só testamos a função pura pickTopFewShot.
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { formatInsightsForDados, hookExamplesBlock, scriptResultBlock } from "@/lib/pipeline/agents";
import { extractPlaybookSection } from "@/lib/pipeline/draft";
import { pickTopFewShot } from "@/lib/pipeline/context";
import { excerptAround } from "@/lib/pipeline/humanize";
import type { GenerationContext } from "@/lib/pipeline/types";

// helpers só leem ctx.insights — o resto do contexto não importa nesses testes
const ctxWith = (insights: { insight_type: string; scope: string; payload: unknown }[]) =>
  ({ insights }) as GenerationContext;

const clientInsight = (score: number, n: number) => ({
  insight_type: "client_hook",
  scope: "client:c1",
  payload: { titulo: `Hook ${n}`, descricao: "desc", score, performance_ratio: 1.4, amostra: 6 },
});

describe("formatInsightsForDados", () => {
  it("sem insights → aviso de heurística", () => {
    expect(formatInsightsForDados([])).toContain("sem insights carregados");
  });

  it("scriptresults viram seção RESULTADOS REAIS no topo, ordenados por score, sem JSON dump", () => {
    const out = formatInsightsForDados([
      clientInsight(10, 1),
      {
        insight_type: "client_scriptresult",
        scope: "client:c1",
        payload: { titulo: "Roteiro A", descricao: "1.5x a média", score: 1.5 },
      },
      {
        insight_type: "client_scriptresult",
        scope: "client:c1",
        payload: { titulo: "Roteiro B", descricao: "3x a média", score: 3, em_observacao: true },
      },
    ]);
    expect(out.startsWith("## RESULTADOS REAIS DESTA SALA")).toBe(true);
    expect(out.indexOf("Roteiro B")).toBeLessThan(out.indexOf("Roteiro A")); // score desc
    expect(out).toContain("em observação");
    expect(out).not.toContain('{"titulo"'); // nunca JSON dump
  });

  it("verdict evitar vira linha EVITE", () => {
    const out = formatInsightsForDados([
      {
        insight_type: "client_scriptresult",
        scope: "client:c1",
        payload: { titulo: "Flop", descricao: "0.4x a média", score: 0.4, verdict: "evitar", maduro: true },
      },
    ]);
    expect(out).toContain("- EVITE: Flop");
  });

  it("cap de linhas: nunca passa do orçamento", () => {
    const many = Array.from({ length: 60 }, (_, i) => clientInsight(i, i));
    const out = formatInsightsForDados(many, 30);
    expect(out.split("\n").filter((l) => l.startsWith("- ")).length).toBe(30);
  });

  it("client insights agrupados por tipo com score desc e sufixo de performance", () => {
    const out = formatInsightsForDados([clientInsight(1, 1), clientInsight(9, 9)]);
    expect(out).toContain("## client_hook");
    expect(out.indexOf("Hook 9")).toBeLessThan(out.indexOf("Hook 1"));
    expect(out).toContain("[perf 1.4x, amostra 6]");
  });

  it("payloads globais (arrays) truncados a 6 itens em linhas curtas", () => {
    const arr = Array.from({ length: 20 }, (_, i) => ({ video: `v${i}`, views: i }));
    const out = formatInsightsForDados([{ insight_type: "top_views", scope: "global", payload: arr }]);
    expect(out).toContain("## top_views (top 6 de 20)");
    expect(out).toContain("v5");
    expect(out).not.toContain("v6");
  });
});

describe("scriptResultBlock", () => {
  const insights = [
    {
      insight_type: "client_scriptresult",
      scope: "client:c1",
      payload: {
        estrutura: "A1. Jornada do Herói",
        hook: "Você não vai acreditar",
        views: 2_100_000,
        performance_ratio: 2.1,
        retencao_hook: 84.2,
        score: 2.1,
      },
    },
    {
      insight_type: "client_scriptresult",
      scope: "client:c1",
      payload: { estrutura: "B2. Lista", views: 90_000, performance_ratio: 0.4, score: 0.4, verdict: "evitar" },
    },
    // sem a dimensão pedida → fora do bloco
    { insight_type: "client_scriptresult", scope: "client:c1", payload: { views: 100 } },
  ];

  it("dimensão estrutura: vencedoras primeiro, EVITE por último", () => {
    const out = scriptResultBlock(ctxWith(insights), "estrutura");
    expect(out).toContain("- A1. Jornada do Herói — 2.1M views, 2.1x a média do cliente");
    expect(out).toContain("- EVITE: B2. Lista");
    expect(out.indexOf("A1.")).toBeLessThan(out.indexOf("EVITE"));
  });

  it("dimensão hook: usa o texto do hook e retenção", () => {
    const out = scriptResultBlock(ctxWith(insights), "hook");
    expect(out).toContain('"Você não vai acreditar"');
    expect(out).toContain("retenção hook 84%");
    expect(out).not.toContain("B2. Lista"); // sem hook → fora
  });

  it("sem scriptresults → vazio", () => {
    expect(scriptResultBlock(ctxWith([]), "estrutura")).toBe("");
  });
});

describe("hookExamplesBlock", () => {
  it("aceita payload {hooks:[...]} e ordena por views", () => {
    const out = hookExamplesBlock(
      ctxWith([
        {
          insight_type: "client_hook_examples",
          scope: "client:c1",
          payload: {
            hooks: [
              { hook: "hook menor", views: 1000 },
              { hook: "hook maior", views: 3_000_000, retencao_hook: 91 },
            ],
          },
        },
      ])
    );
    expect(out.indexOf("hook maior")).toBeLessThan(out.indexOf("hook menor"));
    expect(out).toContain("3.0M views");
    expect(out).toContain("retenção hook 91%");
  });

  it("aceita payload array e corta em n", () => {
    const payload = Array.from({ length: 9 }, (_, i) => ({ texto: `h${i}`, views: i }));
    const out = hookExamplesBlock(ctxWith([{ insight_type: "client_hook_examples", scope: "c", payload }]), 5);
    expect(out.split("\n")).toHaveLength(5);
  });

  it("sem insight → vazio", () => {
    expect(hookExamplesBlock(ctxWith([]))).toBe("");
  });
});

describe("extractPlaybookSection", () => {
  const playbook = `# PLAYBOOK

intro geral

## A1. Jornada do Herói
beats da jornada
mais texto

## A2. Contraste Brutal
beats do contraste

## B1. Lista Rankeada
beats da lista`;

  it("acha a seção pelo código da estrutura", () => {
    const out = extractPlaybookSection(playbook, "A2. Contraste Brutal");
    expect(out).toContain("## A2. Contraste Brutal");
    expect(out).toContain("beats do contraste");
    expect(out).not.toContain("Jornada");
    expect(out).not.toContain("Lista");
  });

  it("acha pelo nome quando o código não bate", () => {
    const out = extractPlaybookSection(playbook, "X9. jornada do herói");
    expect(out).toContain("## A1. Jornada do Herói");
  });

  it("código A1 não casa com heading A12", () => {
    const pb = "## A12. Outra\nx\n\n## A1. Certa\ny";
    expect(extractPlaybookSection(pb, "A1. Certa")).toContain("## A1. Certa");
  });

  it("não achou → vazio (roteirista segue só com a narrativa)", () => {
    expect(extractPlaybookSection(playbook, "Z9. Inexistente")).toBe("");
    expect(extractPlaybookSection(undefined, "A1. Jornada")).toBe("");
    expect(extractPlaybookSection(playbook, undefined)).toBe("");
  });
});

describe("pickTopFewShot", () => {
  it("ordena por views desc e anota views na origem", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      content: `roteiro ${i}`,
      metadata: { views: (i + 1) * 100_000 },
    }));
    const out = pickTopFewShot(rows);
    expect(out).toHaveLength(5);
    expect(out[0].roteiro).toBe("roteiro 19");
    expect(out[0].origem).toBe("roteiro publicado (corpus) — 2.0M views");
  });

  it("sem views em nenhum → mantém a ordem de similaridade", () => {
    const rows = [{ content: "a" }, { content: "b", metadata: {} }, { content: "c", metadata: { views: null } }];
    const out = pickTopFewShot(rows);
    expect(out.map((o) => o.roteiro)).toEqual(["a", "b", "c"]);
    expect(out[0].origem).toBe("roteiro publicado (corpus)");
  });

  it("descarta linhas sem content", () => {
    expect(pickTopFewShot([{ content: null }, { content: "ok" }])).toHaveLength(1);
  });
});

describe("excerptAround", () => {
  it("marca o trecho com contexto ao redor", () => {
    const text = `${"x".repeat(200)} frase com clichê aqui ${"y".repeat(200)}`;
    const out = excerptAround(text, "clichê");
    expect(out).toContain("[TRECHO: clichê]");
    expect(out).toContain("frase com");
    expect(out.startsWith("…")).toBe(true);
    expect(out.endsWith("…")).toBe(true);
  });

  it("match ausente → só o marcador (substituição vira no-op)", () => {
    expect(excerptAround("abc", "zzz")).toBe("[TRECHO: zzz]");
  });
});
