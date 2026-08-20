import { describe, expect, test } from "vitest";
import { escaparLiteral, preview, validarPadrao } from "@/lib/regex-safety";

describe("validarPadrao", () => {
  test("padrão válido compila", () => {
    const r = validarPadrao("manchete");
    expect(r.ok).toBe(true);
  });
  test("padrão inválido não lança, devolve motivo", () => {
    const r = validarPadrao("([a-z");
    expect(r.ok).toBe(false);
    expect(r).toHaveProperty("motivo");
  });
  test("quantificador aninhado é rejeitado", () => {
    expect(validarPadrao("(a+)+b").ok).toBe(false);
  });
  test("padrão longo demais é rejeitado", () => {
    expect(validarPadrao("a".repeat(300)).ok).toBe(false);
  });
});

// A faca do menu de seleção manda texto CRU do roteiro para a banlist. Escape errado aqui
// não quebra nada visível: vira padrão amplo que apaga texto bom em silêncio.
describe("escaparLiteral", () => {
  test("casa o próprio trecho", () => {
    const trecho = "no fim das contas";
    expect(preview(escaparLiteral(trecho), `E ${trecho}, ninguém liga.`)).toEqual([trecho]);
  });
  test("metacaractere vira literal, não curinga", () => {
    const p = escaparLiteral("e aí? (pensa)");
    expect(validarPadrao(p).ok).toBe(true);
    expect(preview(p, "e aí? (pensa) nisso")).toEqual(["e aí? (pensa)"]);
    expect(preview(p, "e aíX pensa nisso")).toEqual([]); // `?` e `(` não podem casar qualquer coisa
  });
  test("ponto não vira curinga", () => {
    expect(preview(escaparLiteral("é isso."), "é issoX")).toEqual([]);
  });
  test("quebra de linha no meio ainda casa", () => {
    expect(preview(escaparLiteral("uma coisa é certa"), "uma coisa\né certa")).toHaveLength(1);
  });
  test("resultado é sempre um padrão que validarPadrao aceita", () => {
    for (const t of ["a+b", "[x]", "1.5% \\ (sic)", "$100 |ou| ^isso^", "a-b {c}"])
      expect(validarPadrao(escaparLiteral(t)).ok, t).toBe(true);
  });
});

describe("preview", () => {
  test("devolve os trechos que casam", () => {
    expect(preview("manchete", "A manchete dizia. Virou manchete.")).toHaveLength(2);
  });
  test("padrão inválido devolve lista vazia, não lança", () => {
    expect(() => preview("([a-z", "texto")).not.toThrow();
    expect(preview("([a-z", "texto")).toEqual([]);
  });
});
