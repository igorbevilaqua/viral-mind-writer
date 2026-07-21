import { describe, expect, test } from "vitest";
import { spliceRoteiro, mergeFontes } from "@/lib/bob-edit";

describe("spliceRoteiro", () => {
  const r = "abc DEF ghi";
  test("completar: insere no cursor (trecho vazio, start==end)", () => {
    expect(spliceRoteiro(r, { start: 4, end: 4, trecho: "" }, "X")).toBe("abc XDEF ghi");
  });

  test("reescrever: substitui a seleção quando o trecho ainda bate", () => {
    expect(spliceRoteiro(r, { start: 4, end: 7, trecho: "DEF" }, "XYZ")).toBe("abc XYZ ghi");
  });

  test("anti-drift: trecho mudou → insere no start, não substitui o texto errado", () => {
    // usuário editou; em [4,7] agora há "def", não o "DEF" esperado
    const editado = "abc def ghi";
    expect(spliceRoteiro(editado, { start: 4, end: 7, trecho: "DEF" }, "XYZ")).toBe("abc XYZdef ghi");
  });

  test("offsets fora do range: clampa no fim sem quebrar", () => {
    expect(spliceRoteiro("abc", { start: 99, end: 99, trecho: "" }, "X")).toBe("abcX");
  });
});

describe("mergeFontes", () => {
  test("campo vazio: só as novas", () => {
    expect(mergeFontes("", "https://a.com")).toBe("https://a.com");
  });

  test("não duplica URL já presente", () => {
    expect(mergeFontes("https://a.com", "https://a.com")).toBe("https://a.com");
  });

  test("anexa a nova preservando a existente", () => {
    expect(mergeFontes("https://a.com", "https://b.com")).toBe("https://a.com\nhttps://b.com");
  });
});
