// tests/provenance.test.ts
import { describe, expect, test } from "vitest";
import { atribuirEtapa } from "@/lib/provenance";

const snaps = {
  assembled: "A empresa perdeu um bilhão. O mercado reagiu mal.",
  revised:   "A empresa perdeu um bilhão. O mercado entrou em pânico.",
  final:     "A empresa perdeu um bilhão. O mercado surtou.",
};

describe("atribuirEtapa", () => {
  test("frase presente no assembled → roteirista", () => {
    expect(atribuirEtapa("A empresa perdeu um bilhão.", snaps)).toBe("roteirista");
  });
  test("frase que aparece no revised → revisor", () => {
    expect(atribuirEtapa("O mercado entrou em pânico.", snaps)).toBe("revisao");
  });
  test("frase que só aparece no final → humanizador", () => {
    expect(atribuirEtapa("O mercado surtou.", snaps)).toBe("humanizacao");
  });
  test("frase ausente dos três → pos_save", () => {
    expect(atribuirEtapa("Isto foi você que escreveu.", snaps)).toBe("pos_save");
  });
  test("tolera pontuação e espaço diferentes", () => {
    expect(atribuirEtapa("  a empresa perdeu um bilhão  ", snaps)).toBe("roteirista");
  });
  test("snapshots ausentes (roteiro antigo) não quebram", () => {
    expect(atribuirEtapa("qualquer coisa", {})).toBe("pos_save");
  });
});
