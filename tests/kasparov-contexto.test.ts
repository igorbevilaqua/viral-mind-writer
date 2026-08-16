import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { montarContexto } from "@/lib/pipeline/kasparov";
import type { ClientPrefs, GenerationContext } from "@/lib/pipeline/types";

const PLAYBOOK_TEXTO = "SEGREDO DO PLAYBOOK: a estrutura Loop Aberto abre com a consequência.";

const prefs: ClientPrefs = {
  nome: "Acme",
  proibicoes: ["promessa de retorno garantido"],
  tom_de_voz: "direto",
  temas_preferidos: ["juros"],
  vocabulario_evitar: ["disruptivo"],
  vocabulario_usar: ["taxa efetiva"],
  notas_entrevista: null,
};

const ctx = (over: Partial<GenerationContext> = {}) =>
  ({
    clientPrefs: null,
    modoModelagem: false,
    playbooks: { storytelling: PLAYBOOK_TEXTO },
    playbookVersions: [
      { slug: "storytelling", version: 3 },
      { slug: "checklist", version: 1 },
    ],
    insights: [
      {
        insight_type: "taught",
        scope: "global",
        payload: { titulo: "Ritmo curto", descricao: "frases de até 12 palavras", destinatarios: ["dados", "roteirista"] },
      },
      {
        insight_type: "taught",
        scope: "global",
        payload: { titulo: "Hook sem pergunta", descricao: "nunca abrir com pergunta", destinatarios: ["hook"] },
      },
    ],
    ...over,
  }) as unknown as GenerationContext;

const estado = {
  roteiroAberto: "HOOK: o banco cobra 3% ao mês.\nROTEIRO: ...",
  assunto: "se o hook do roteiro aberto sustenta a promessa",
};

// A thread que o turno 20 NÃO recebe. Existe só para provar que ela não entra por porta nenhuma.
const thread = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    papel: i % 2 ? "kasparov" : "user",
    conteudo: `turno ${i}: um parágrafo inteiro de debate que não pode chegar ao contexto do turno seguinte`,
  }));

describe("montarContexto — estado do sistema, nunca histórico (018 §4)", () => {
  // §12.1: o teste que trava o desenho. Três travas, porque uma só se burla sem querer:
  // 1) a assinatura não tem por onde receber a lista de mensagens;
  // 2) mesmo forçando a lista pela porta lateral, a saída não muda um byte;
  // 3) o módulo não menciona histórico nenhum no código (comentários fora).
  test("turno 20 é byte a byte igual ao turno 1 da mesma thread", () => {
    const c = ctx({ clientPrefs: prefs });
    const turno1 = montarContexto(c, estado);
    const turno20 = montarContexto(c, estado);
    expect(turno20).toBe(turno1);
    expect(turno20.length).toBe(turno1.length);
  });

  test("empurrar a thread pela porta lateral não muda a saída", () => {
    const c = ctx({ clientPrefs: prefs });
    const base = montarContexto(c, estado);
    const contrabando = (n: number) =>
      ({
        ...estado,
        mensagens: thread(n),
        historico: thread(n),
        transcript: thread(n)
          .map((m) => m.conteudo)
          .join("\n"),
      }) as unknown as Parameters<typeof montarContexto>[1];
    expect(montarContexto(c, contrabando(1))).toBe(base);
    expect(montarContexto(c, contrabando(20))).toBe(base);
  });

  test("o módulo não tem por onde receber histórico", () => {
    const src = readFileSync("lib/pipeline/kasparov.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    // Plural de propósito: `mensagem` (o turno atual) é legítimo; `mensagens` é a lista dos
    // turnos anteriores, e é ela que quebra o custo constante do §4.
    expect(src).not.toMatch(/mensagens|messages|hist[oó]ric|transcript/i);
  });

  test("o assunto corrente é sempre uma linha só", () => {
    const c = ctx();
    const out = montarContexto(c, { assunto: "linha 1\nlinha 2\nlinha 3" });
    expect(out).toContain("linha 1 linha 2 linha 3");
    expect(out.split("\n").filter((l) => l.includes("linha 2"))).toHaveLength(1);
  });
});

describe("montarContexto — blocos", () => {
  test("playbook entra por referência (slug+version) e o texto nunca aparece", () => {
    const out = montarContexto(ctx(), estado);
    expect(out).toContain("storytelling v3");
    expect(out).toContain("checklist v1");
    expect(out).not.toContain(PLAYBOOK_TEXTO);
    expect(out).not.toContain("Loop Aberto");
  });

  test("lições ativas entram roteadas para `dados`", () => {
    const out = montarContexto(ctx(), estado);
    expect(out).toContain("Ritmo curto");
    expect(out).not.toContain("Hook sem pergunta"); // roteada só para o hook
  });

  test("sem cliente, o bloco de prefs some inteiro", () => {
    const out = montarContexto(ctx(), estado);
    expect(out).not.toContain("Acme");
    expect(out).not.toMatch(/RESTRIÇÕES DO CLIENTE|VOZ DO CLIENTE/);
  });

  test("com cliente, prefs entram pelo bloco que já existe", () => {
    const out = montarContexto(ctx({ clientPrefs: prefs }), estado);
    expect(out).toContain("promessa de retorno garantido");
    expect(out).toContain("disruptivo");
  });

  test("sem roteiro aberto, o bloco some", () => {
    const out = montarContexto(ctx(), { assunto: "as 94 comparações de hook paradas" });
    expect(out).not.toMatch(/ROTEIRO ABERTO/);
    expect(out).toContain("94 comparações");
  });

  test("sem assunto, sem roteiro, sem lição e sem cliente ainda produz contexto válido", () => {
    const out = montarContexto(ctx({ insights: [], playbookVersions: [] }), {});
    expect(out.trim()).not.toBe("");
    expect(out).not.toMatch(/ASSUNTO CORRENTE|ROTEIRO ABERTO|APRENDIZADOS/);
  });
});
