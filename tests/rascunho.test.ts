import { describe, expect, it } from "vitest";
import { parseRascunho, recadoDeFalhaAoSalvar } from "@/lib/rascunho";

// A sessão 8e8b19 editou o roteiro, o Salvar estourou (um deploy trocou o build enquanto a página
// estava aberta) e o texto sumiu: ele só existia no estado do React, e a rejeição solta dentro da
// transition derrubou a tela junto com ele. O rascunho local é o que impede a próxima perda.

describe("rascunho guardado no navegador", () => {
  it("lê o que foi gravado", () => {
    const r = { headline: "H", hook: "gancho", roteiro: "corpo editado", comando: "cta", fontes: "f" };
    expect(parseRascunho(JSON.stringify(r))).toEqual(r);
  });

  it("completa os campos ausentes em volta do roteiro, que é o que não pode faltar", () => {
    expect(parseRascunho(JSON.stringify({ roteiro: "só o corpo" }))).toEqual({
      headline: "",
      hook: "",
      roteiro: "só o corpo",
      comando: "",
      fontes: "",
    });
  });

  it("nada guardado, JSON corrompido ou sem roteiro não vira rascunho (a faixa não aparece)", () => {
    expect(parseRascunho(null)).toBeNull();
    expect(parseRascunho("")).toBeNull();
    expect(parseRascunho("{isso não é json")).toBeNull();
    expect(parseRascunho(JSON.stringify({ hook: "sem roteiro" }))).toBeNull();
  });
});

describe("recado quando o salvar falha", () => {
  it("erro de versão (deploy no meio da edição) manda recarregar e diz que o texto está guardado", () => {
    const msg = recadoDeFalhaAoSalvar('Failed to find Server Action "7f3a". This request might be from an older deployment.');
    expect(msg).toContain("guardado neste navegador");
    expect(msg).toContain("recarregue a página");
  });

  it("queda de rede cai no mesmo recado: o texto não se perdeu", () => {
    expect(recadoDeFalhaAoSalvar("Failed to fetch")).toContain("guardado neste navegador");
  });

  it("erro de verdade do servidor aparece com o motivo, e ainda avisa que o texto está na tela", () => {
    const msg = recadoDeFalhaAoSalvar("este roteiro é de outra pessoa");
    expect(msg).toContain("este roteiro é de outra pessoa");
    expect(msg).toContain("tente de novo");
  });
});
