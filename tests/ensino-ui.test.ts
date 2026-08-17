// Só o determinístico do dialog de ensino (015 §7): onde o ensinamento realmente cai, quando
// o campo `padrao` precisa estar na tela, e a frase do "por quê" sem rastro. Julgamento do
// classificador não se testa com assert — o portão dele é a confirmação humana.
import { describe, expect, test } from "vitest";
import {
  CASA_LABEL,
  DIRECAO_LABEL,
  casaFinal,
  precisaDirecao,
  precisaPadrao,
  textoCruEditavel,
  textoNaoDeterminado,
} from "@/lib/ensino-ui";
import { CASAS, DIRECOES } from "@/lib/pipeline/classify-teaching";

describe("casaFinal", () => {
  test("vocabulário com escopo Global vira frase banida (espelha gravarEnsinamento)", () => {
    expect(casaFinal("vocabulario", "global")).toBe("frase_banida");
  });
  test("as outras casas passam intactas nos dois escopos", () => {
    for (const casa of CASAS)
      for (const escopo of ["cliente", "global"] as const)
        if (!(casa === "vocabulario" && escopo === "global")) expect(casaFinal(casa, escopo)).toBe(casa);
  });
});

describe("precisaPadrao", () => {
  // Sem o campo editável nesse caminho o usuário bate num erro sem saída: o classificador zera
  // `padrao` fora de frase_banida e a gravação exige um padrão válido.
  test("vocabulário + Global exige o campo padrão", () => {
    expect(precisaPadrao("vocabulario", "global")).toBe(true);
  });
  test("frase banida exige o campo nos dois escopos", () => {
    expect(precisaPadrao("frase_banida", "cliente")).toBe(true);
    expect(precisaPadrao("frase_banida", "global")).toBe(true);
  });
  test("vocabulário por cliente, lição e playbook não mostram o campo", () => {
    expect(precisaPadrao("vocabulario", "cliente")).toBe(false);
    expect(precisaPadrao("licao", "global")).toBe(false);
    expect(precisaPadrao("playbook", "global")).toBe(false);
  });
});

describe("textoNaoDeterminado", () => {
  test("com rastro, a frase é a literal do §7.2", () => {
    expect(textoNaoDeterminado("Nada no rastro determina este trecho.")).toBe(
      "Nada no prompt determinou esta frase. Foi escolha do roteirista."
    );
  });
  test("roteiro anterior à 2.0 mantém a frase honesta do servidor (§8: não inventar causa)", () => {
    const antigo = "Sei que o revisor reescreveu este trecho, mas este roteiro é anterior ao registro de proveniência.";
    expect(textoNaoDeterminado(antigo)).toBe(antigo);
  });
});

describe("precisaDirecao", () => {
  // Sem os chips o usuário não corrige a direção antes de confirmar — e a gravação recusa.
  test("vocabulário por cliente exige a direção", () => {
    expect(precisaDirecao("vocabulario", "cliente")).toBe(true);
  });
  test("vocabulário + Global não: vira frase banida, que não tem direção", () => {
    expect(precisaDirecao("vocabulario", "global")).toBe(false);
  });
  test("as outras casas não pedem direção", () => {
    for (const casa of CASAS)
      if (casa !== "vocabulario") expect(precisaDirecao(casa, "cliente")).toBe(false);
  });
});

test("toda casa tem rótulo na tela", () => {
  expect(Object.keys(CASA_LABEL).sort()).toEqual([...CASAS].sort());
});

test("toda direção tem rótulo na tela", () => {
  expect(Object.keys(DIRECAO_LABEL).sort()).toEqual([...DIRECOES].sort());
});

// 018 §5.1 — o campo que vira vm_lessons.context_note. É a decisão que separa "prova de
// auditoria" de "palavra da máquina gravada como se fosse do humano".
describe("textoCruEditavel", () => {
  test("digitado na sessão é literal e não se edita — editar apagaria a prova", () => {
    expect(textoCruEditavel("usuario")).toBe(false);
  });
  test("síntese do Kasparov nasce editável: ela ainda não é fala de ninguém", () => {
    expect(textoCruEditavel("kasparov")).toBe(true);
  });
});
