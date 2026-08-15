import { describe, expect, test } from "vitest";
import { preview, validarPadrao } from "@/lib/regex-safety";

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

describe("preview", () => {
  test("devolve os trechos que casam", () => {
    expect(preview("manchete", "A manchete dizia. Virou manchete.")).toHaveLength(2);
  });
  test("padrão inválido devolve lista vazia, não lança", () => {
    expect(() => preview("([a-z", "texto")).not.toThrow();
    expect(preview("([a-z", "texto")).toEqual([]);
  });
});
