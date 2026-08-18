import { describe, expect, test } from "vitest";
import { pessoasPresentes } from "@/lib/presenca";
import { SEM_NOME } from "@/lib/usuarios";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("pessoasPresentes", () => {
  test("mesma pessoa em 3 abas é uma pessoa", () => {
    const estado = {
      c1: [{ userId: A, nome: "Igor Bevilaqua", editando: false }],
      c2: [{ userId: A, nome: "Igor Bevilaqua", editando: false }],
      c3: [{ userId: A, nome: "Igor Bevilaqua", editando: false }],
    };
    expect(pessoasPresentes(estado)).toEqual([{ userId: A, nome: "Igor Bevilaqua", editando: false }]);
  });

  test("editando é o OU das abas: uma aba no editor já acende o aviso", () => {
    const estado = {
      c1: [{ userId: A, nome: "Igor", editando: false }],
      c2: [{ userId: A, nome: "Igor", editando: true }],
    };
    expect(pessoasPresentes(estado)[0].editando).toBe(true);
  });

  test("exclui você mesmo — a sessão não lista quem está olhando", () => {
    const estado = {
      c1: [{ userId: A, nome: "Igor" }],
      c2: [{ userId: B, nome: "Maria" }],
    };
    expect(pessoasPresentes(estado, A).map((p) => p.userId)).toEqual([B]);
    expect(pessoasPresentes(estado).length).toBe(2);
  });

  test("ordem estável por nome — a lista não dança a cada sync", () => {
    const estado = {
      c1: [{ userId: A, nome: "Zeca" }],
      c2: [{ userId: B, nome: "Ana" }],
    };
    expect(pessoasPresentes(estado).map((p) => p.nome)).toEqual(["Ana", "Zeca"]);
  });

  test("payload torto não vira 'undefined' na tela", () => {
    const estado = {
      c1: [{ nome: "Sem id" }],
      c2: [{ userId: "  " }],
      c3: [{ userId: B }],
      c4: [{ userId: A, nome: 42, editando: "sim" }],
      c5: [null],
    } as unknown as Record<string, unknown[]>;
    // os dois caem no rótulo neutro (nome ausente e nome que não é string)
    expect(pessoasPresentes(estado)).toEqual([
      { userId: B, nome: SEM_NOME, editando: false },
      { userId: A, nome: SEM_NOME, editando: false },
    ]);
  });

  test("estado vazio/ausente é lista vazia (Realtime fora do ar)", () => {
    expect(pessoasPresentes({})).toEqual([]);
    expect(pessoasPresentes(null)).toEqual([]);
    expect(pessoasPresentes(undefined)).toEqual([]);
  });
});
