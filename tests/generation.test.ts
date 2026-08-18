import { describe, expect, it } from "vitest";
import { faseDeDebug, guardEmit, isStaleGeneration, podeGerar, STALE_GENERATION_MS, UUID_RE } from "@/lib/generation";

describe("guardEmit", () => {
  it("repassa eventos enquanto o stream está vivo", () => {
    const got: number[] = [];
    const emit = guardEmit<number>((e) => got.push(e));
    emit(1);
    emit(2);
    expect(got).toEqual([1, 2]);
  });

  it("vira no-op após o primeiro throw (stream fechado) sem relançar", () => {
    let calls = 0;
    const emit = guardEmit<string>(() => {
      calls++;
      throw new Error("Controller is already closed");
    });
    expect(() => emit("a")).not.toThrow();
    expect(() => emit("b")).not.toThrow();
    expect(calls).toBe(1); // depois do throw não tenta mais o enqueue
  });
});

describe("isStaleGeneration", () => {
  const now = Date.parse("2026-07-11T12:00:00Z");

  it("só se aplica a status generating", () => {
    expect(isStaleGeneration("done", null, now)).toBe(false);
    expect(isStaleGeneration("error", "2020-01-01T00:00:00Z", now)).toBe(false);
  });

  it("generating recente não é stale", () => {
    const recent = new Date(now - 5 * 60_000).toISOString();
    expect(isStaleGeneration("generating", recent, now)).toBe(false);
  });

  it("generating além do limite é stale", () => {
    const old = new Date(now - STALE_GENERATION_MS - 1000).toISOString();
    expect(isStaleGeneration("generating", old, now)).toBe(true);
  });

  it("generating sem timestamp (pré-migration) é stale", () => {
    expect(isStaleGeneration("generating", null, now)).toBe(true);
    expect(isStaleGeneration("generating", undefined, now)).toBe(true);
  });
});

describe("faseDeDebug", () => {
  it("lê a fase corrente gravada pelo pipeline", () => {
    expect(faseDeDebug({ phase: "pesquisa", git: "abc" })).toBe("pesquisa");
  });

  it("nada persistido, lixo ou fase desconhecida viram null (a tela não inventa rótulo)", () => {
    expect(faseDeDebug(null)).toBe(null);
    expect(faseDeDebug(undefined)).toBe(null);
    expect(faseDeDebug("pesquisa")).toBe(null);
    expect(faseDeDebug([{ phase: "pesquisa" }])).toBe(null);
    expect(faseDeDebug({ phase: 7 })).toBe(null);
    // "init" é o valor do dump de erro anterior a qualquer fase — não é fase de trabalho
    expect(faseDeDebug({ phase: "init" })).toBe(null);
  });
});

describe("podeGerar", () => {
  const base = { status: "draft", generationStale: false, gerandoAqui: false, premissaPendente: false };

  it("rascunho e erro podem gerar", () => {
    expect(podeGerar(base)).toBe(true);
    expect(podeGerar({ ...base, status: "error" })).toBe(true);
    expect(podeGerar({ ...base, status: "done" })).toBe(true);
  });

  it("premissa esperando confirmação bloqueia: gerar ali re-paga transcrição e autópsia", () => {
    expect(podeGerar({ ...base, status: "aguardando_premissa", premissaPendente: true })).toBe(false);
  });

  it("geração viva em outra conexão bloqueia — a aba acompanha, não reprocessa", () => {
    expect(podeGerar({ ...base, status: "generating" })).toBe(false);
  });

  it("geração morta (stale) libera o retry", () => {
    expect(podeGerar({ ...base, status: "generating", generationStale: true })).toBe(true);
  });

  it("gerando nesta aba bloqueia (duplo clique) e sessão encerrada também", () => {
    expect(podeGerar({ ...base, gerandoAqui: true })).toBe(false);
    expect(podeGerar({ ...base, status: "closed" })).toBe(false);
  });
});

describe("UUID_RE", () => {
  it("aceita uuid e rejeita lixo", () => {
    expect(UUID_RE.test("db47a5c1-1234-4abc-9def-0123456789ab")).toBe(true);
    expect(UUID_RE.test("not-a-uuid")).toBe(false);
    expect(UUID_RE.test("")).toBe(false);
    expect(UUID_RE.test("db47a5c1-1234-4abc-9def-0123456789ab; drop table")).toBe(false);
  });
});
