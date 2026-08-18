import { describe, expect, test } from "vitest";
import { nomeDeEmail, SEM_NOME } from "@/lib/usuarios";

describe("nomeDeEmail", () => {
  test("local-part vira nome: ponto e underscore são separadores", () => {
    expect(nomeDeEmail("igor.bevilaqua@gmail.com")).toBe("Igor Bevilaqua");
    expect(nomeDeEmail("maria_clara@vmedialabs.com.br")).toBe("Maria Clara");
    expect(nomeDeEmail("vm.labs_gestao@vmedialabs.com.br")).toBe("Vm Labs Gestao");
  });

  test("caixa é normalizada — email todo em maiúscula não vira grito na lista", () => {
    expect(nomeDeEmail("IGOR.BEVILAQUA@GMAIL.COM")).toBe("Igor Bevilaqua");
  });

  test("uma palavra só continua sendo um nome", () => {
    expect(nomeDeEmail("igor@gmail.com")).toBe("Igor");
  });

  test("email malformado (sem @) usa o que tem em vez de quebrar", () => {
    expect(nomeDeEmail("igor.bevilaqua")).toBe("Igor Bevilaqua");
  });

  test("nunca devolve string vazia na tela", () => {
    expect(nomeDeEmail("@gmail.com")).toBe(SEM_NOME);
    expect(nomeDeEmail("")).toBe(SEM_NOME);
    expect(nomeDeEmail("   ")).toBe(SEM_NOME);
    expect(nomeDeEmail(null)).toBe(SEM_NOME);
    expect(nomeDeEmail(undefined)).toBe(SEM_NOME);
    // só separadores no local-part: sobra nada depois do split
    expect(nomeDeEmail("._.@gmail.com")).toBe(SEM_NOME);
  });
});
