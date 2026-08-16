import { describe, expect, test, vi } from "vitest";

// O que o Supabase devolveria. O fake existe para provar duas coisas determinísticas:
// que o carregador avulso zera o que só existe em sessão, e que o resto vem IGUAL ao da
// sessão — se alguém duplicar a carga em vez de fatorá-la, é aqui que diverge.
const db = vi.hoisted(() => {
  const linhas: Record<string, unknown> = {
    vm_sessions: { id: "s1", user_id: "u1", prompt: "", client_id: "c1", artifacts: { hooks: [] }, premissa: "a tese", premissa_origem: "digitada" },
    vm_attachments: [{ id: "a1", kind: "link", is_modelagem: false, url: "https://x", raw_content: null }],
    vm_playbooks: [
      { slug: "storytelling", content: "SEGREDO", version: 3 },
      { slug: "hook", content: "SEGREDO", version: 1 },
    ],
    vm_banned_phrases: [{ pattern: "nesse video", label: "clichê", severity: 2, motivo: "batido" }],
    vm_client_preferences: {
      proibicoes: ["retorno garantido"],
      tom_de_voz: "direto",
      temas_preferidos: ["juros"],
      vocabulario_evitar: ["disruptivo"],
      vocabulario_usar: ["taxa efetiva"],
      notas_entrevista: null,
      viral_data_cliente_id: "vd1",
      clientes: { nome: "Acme" },
    },
    vm_insight_runs: { id: "run-1" },
    vm_viral_insights: [{ insight_type: "client_hook", scope: "client:c1", payload: { titulo: "Hook A" } }],
    vm_lesson_learnings: [
      { id: "l1", dimensao: "hook", destinatarios: ["dados"], titulo: "Ritmo curto", descricao: "até 12 palavras", created_at: "2026-01-01", vm_lessons: { client_id: null } },
    ],
  };
  type Res = { data: unknown; error: null };
  interface Q {
    select(): Q;
    eq(): Q;
    in(): Q;
    order(): Q;
    limit(): Q;
    single(): Promise<Res>;
    maybeSingle(): Promise<Res>;
    then(ok: (r: Res) => unknown, err?: (e: unknown) => unknown): Promise<unknown>;
  }
  const builder = (tabela: string): Q => {
    const res: Res = { data: linhas[tabela] ?? [], error: null };
    const q: Q = {
      select: () => q,
      eq: () => q,
      in: () => q,
      order: () => q,
      limit: () => q,
      single: () => Promise.resolve(res),
      maybeSingle: () => Promise.resolve(res),
      then: (ok, err) => Promise.resolve(res).then(ok, err),
    };
    return q;
  };
  return { from: (tabela: string) => builder(tabela) };
});

vi.mock("@/lib/db", () => ({ appDb: db, viralData: {} }));

import { loadContext, loadContextAvulso } from "@/lib/pipeline/context";
import { filtroDeAssunto, separarAssunto } from "@/lib/pipeline/kasparov";

describe("loadContextAvulso — debate fora de sessão (018 §2, §5.3)", () => {
  test("o que só existe em sessão vem vazio, e nunca inventado", async () => {
    const ctx = await loadContextAvulso("c1");
    expect(ctx.sessionId).toBe("");
    expect(ctx.userId).toBeNull();
    expect(ctx.prompt).toBe("");
    expect(ctx.premissa).toBe("");
    expect(ctx.premissaOrigem).toBeNull();
    expect(ctx.attachments).toEqual([]);
    expect(ctx.artifacts).toBeNull();
    expect(ctx.fewShot).toEqual([]);
    expect(ctx.modoModelagem).toBe(false);
  });

  test("playbooks, lições, prefs e frases banidas vêm iguais aos de loadContext", async () => {
    const sessao = await loadContext("s1");
    const avulso = await loadContextAvulso("c1");
    expect(avulso.playbooks).toEqual(sessao.playbooks);
    expect(avulso.playbookVersions).toEqual(sessao.playbookVersions);
    expect(avulso.bannedPhrases).toEqual(sessao.bannedPhrases);
    expect(avulso.clientPrefs).toEqual(sessao.clientPrefs);
    expect(avulso.insights).toEqual(sessao.insights);
    expect(avulso.lessonIds).toEqual(sessao.lessonIds);
    expect(avulso.insightRunId).toEqual(sessao.insightRunId);
  });

  test("sem cliente, prefs somem e o resto continua carregando", async () => {
    const ctx = await loadContextAvulso(null);
    expect(ctx.clientId).toBeNull();
    expect(ctx.clientPrefs).toBeNull();
    expect(ctx.playbookVersions).toHaveLength(2);
    expect(ctx.lessonIds).toEqual(["l1"]);
  });

  test("loadContext não mudou: sessão continua trazendo anexos, premissa e artifacts", async () => {
    const ctx = await loadContext("s1");
    expect(ctx.sessionId).toBe("s1");
    expect(ctx.userId).toBe("u1");
    expect(ctx.premissa).toBe("a tese");
    expect(ctx.attachments).toHaveLength(1);
    expect(ctx.artifacts).toEqual({ hooks: [] });
  });
});

describe("separarAssunto — a linha que atravessa turnos (018 §4)", () => {
  test("primeira linha vira assunto e sai do texto", () => {
    const r = separarAssunto("ASSUNTO: se o hook sustenta a promessa\n\nEsse hook entrega cedo demais.");
    expect(r.assunto).toBe("se o hook sustenta a promessa");
    expect(r.texto).toBe("Esse hook entrega cedo demais.");
  });

  test("o assunto é sempre UMA linha, mesmo se o modelo quebrar", () => {
    const r = separarAssunto("ASSUNTO:  linha 1   linha 2 \nCorpo.");
    expect(r.assunto).toBe("linha 1 linha 2");
  });

  test("sem marcador, nada se perde: texto inteiro e assunto anterior sobrevive", () => {
    const r = separarAssunto("Esqueci o marcador.\nMas respondi.", "o assunto de antes");
    expect(r.texto).toBe("Esqueci o marcador.\nMas respondi.");
    expect(r.assunto).toBe("o assunto de antes");
  });

  test("marcador vazio cai no assunto anterior em vez de zerar a thread", () => {
    expect(separarAssunto("ASSUNTO:\nCorpo.", "o de antes").assunto).toBe("o de antes");
    expect(separarAssunto("ASSUNTO: novo\nCorpo.", "o de antes").assunto).toBe("novo");
  });

  test("sem assunto anterior e sem marcador, o assunto é vazio — não é 'undefined'", () => {
    expect(separarAssunto("Só o corpo.").assunto).toBe("");
  });
});

describe("filtroDeAssunto — o marcador não pisca na tela (018 §10)", () => {
  const passar = (filtro: (s: string) => string, pedacos: string[]) => pedacos.map(filtro).join("");

  test("segura os tokens até fechar a primeira linha e emite só o corpo", () => {
    const filtro = filtroDeAssunto();
    const saida = passar(filtro, ["ASSU", "NTO: o hook", " do roteiro\n", "Esse hook ", "entrega cedo."]);
    expect(saida).toBe("Esse hook entrega cedo.");
    expect(saida).not.toContain("ASSUNTO");
  });

  test("o que vem depois do cabeçalho passa token a token, sem buffer", () => {
    const filtro = filtroDeAssunto();
    filtro("ASSUNTO: x\n");
    expect(filtro("a")).toBe("a");
    expect(filtro("b")).toBe("b");
  });

  test("sem marcador, o filtro devolve tudo — inclusive a primeira linha", () => {
    const filtro = filtroDeAssunto();
    expect(passar(filtro, ["Esqueci o marcador.\n", "Mas respondi."])).toBe("Esqueci o marcador.\nMas respondi.");
  });

  test("o texto emitido no stream bate com o texto do retorno", () => {
    const bruto = "ASSUNTO: as 94 comparações paradas\n\nVocê tem 94 pares parados. Comece por um.";
    const filtro = filtroDeAssunto();
    const pedacos: string[] = [];
    for (let i = 0; i < bruto.length; i += 7) pedacos.push(bruto.slice(i, i + 7));
    const emitido = passar(filtro, pedacos);
    expect(emitido.trim()).toBe(separarAssunto(bruto).texto);
  });
});
