import { describe, expect, test } from "vitest";
import { ENSINAMENTO_TOOL } from "@/lib/pipeline/classify-teaching";
import { DESTINATARIOS } from "@/lib/pipeline/destinatarios";

describe("schema do classificador", () => {
  test("enum de destinatarios espelha DESTINATARIOS", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.destinatarios.items.enum)
      .toEqual([...DESTINATARIOS]);
  });
  test("casa tem exatamente as quatro casas", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.casa.enum)
      .toEqual(["licao", "vocabulario", "frase_banida", "playbook"]);
  });
});
