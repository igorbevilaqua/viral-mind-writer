import { describe, expect, test } from "vitest";
import { ecosNumericos } from "@/lib/pipeline/slop-lint";

// Os quatro casos de §1.1 do plano 016 são texto de PRODUÇÃO. Os quatro devem ACUSAR:
// o detector sinaliza, não julga. Três deles são repetição boa (refrão, contraste, conta
// derivada) e quem decide é o revisor — por isso nada aqui sai como "block" e a âncora
// devolvida é sempre a frase inteira.

const CASO_60 = [
  "O dado assusta: mais de 60% de quem compra tem entre 18 e 24 anos.",
  "E 60% dizem que gostariam de ter vivido numa época menos conectada.",
].join("\n");

const CASO_400 = [
  "A corretora oferecia alavancagem de até 400%.",
  "Com 400% de alavancagem, uma queda pequena vira um buraco gigante.",
  "Alavancagem de 400% em cima de hype tem um nome no mercado: pólvora.",
].join("\n");

const CASO_375 = [
  "O Brasil tomou tarifas de até 37,5%.",
  "Na prática o exportador daqui paga 37,5% pra entrar nos Estados Unidos e assiste o vizinho pagando 10%.",
].join("\n");

const CASO_2MI = [
  "O acervo tem entre 500 mil e 2 milhões de livros.",
  "Esses 2 milhões de livros usados e raros somam entre R$ 100 e R$ 300 milhões.",
].join("\n");

const valores = (t: string) => ecosNumericos(t).map((e) => e.valor);

describe("ecosNumericos — os quatro casos reais de §1.1 acusam", () => {
  test("60% em dois fatos diferentes acusa", () => {
    const ecos = ecosNumericos(CASO_60);
    expect(ecos).toHaveLength(1);
    expect(ecos[0].valor).toBe("60%");
    expect(ecos[0].frases).toHaveLength(2);
  });

  test("400% repetido três vezes (refrão bom) acusa mesmo assim", () => {
    const ecos = ecosNumericos(CASO_400);
    expect(ecos.map((e) => e.valor)).toEqual(["400%"]);
    expect(ecos[0].frases).toHaveLength(3);
  });

  test("37,5% com decimal (contraste bom) acusa, e o 10% solitário não", () => {
    expect(valores(CASO_375)).toEqual(["37,5%"]);
  });

  test("2 milhões (conta derivada) acusa; 500 mil e 300 milhões, sozinhos, não", () => {
    const ecos = ecosNumericos(CASO_2MI);
    expect(ecos).toHaveLength(1);
    expect(ecos[0].valor).toBe("2 milhões");
    expect(ecos[0].frases).toHaveLength(2);
  });

  test("os quatro juntos, num roteiro só, dão quatro sinais", () => {
    const roteiro = [CASO_60, CASO_400, CASO_375, CASO_2MI].join("\n\n");
    expect(valores(roteiro).sort()).toEqual(["2 milhões", "37,5%", "400%", "60%"]);
  });
});

describe("ecosNumericos — o contrato que protege o passe cirúrgico", () => {
  test("a âncora é a FRASE INTEIRA, nunca o número", () => {
    const ecos = ecosNumericos(CASO_60);
    for (const frase of ecos[0].frases) {
      expect(frase).toContain("60%");
      expect(frase).not.toBe("60%");
      expect(frase.length).toBeGreaterThan(20);
    }
    // Se a âncora fosse "60%", o `split(match).join(...)` de humanize.ts:101 trocaria as
    // DUAS ocorrências pelo mesmo texto. As frases têm que ser distintas entre si.
    expect(ecos[0].frases[0]).not.toBe(ecos[0].frases[1]);
    expect(ecos[0].frases).toContain(
      "O dado assusta: mais de 60% de quem compra tem entre 18 e 24 anos."
    );
    expect(ecos[0].frases).toContain(
      "E 60% dizem que gostariam de ter vivido numa época menos conectada."
    );
  });

  test("nada sai como severity block — o detector não emite veredito", () => {
    for (const eco of ecosNumericos([CASO_60, CASO_400].join("\n\n"))) {
      // Sem campo `severity`: nem "warn", nem "block". Nada aqui entra na mira do retry.
      expect(Object.keys(eco).sort()).toEqual(["frases", "valor"]);
    }
  });

  test("valor que aparece uma vez só não acusa", () => {
    expect(ecosNumericos("A inflação fechou o ano em 4,5% e ninguém comemorou.")).toEqual([]);
  });

  test("mesmo valor duas vezes na MESMA frase não é eco (é uma frase só)", () => {
    expect(ecosNumericos("Subiu 30% num mês e outros 30% no mês seguinte.")).toEqual([]);
  });
});

describe("ecosNumericos — guardas obrigatórias", () => {
  test("linha de ## FONTES não acusa", () => {
    const texto = [
      "## CORPO",
      "O tribunal derrubou a tese.",
      "",
      "## FONTES",
      "Agência Brasil, alta de 12%, https://agenciabrasil.example/a",
      "Reuters, alta de 12%, https://reuters.example/b",
    ].join("\n");
    expect(ecosNumericos(texto)).toEqual([]);
  });

  test("data dd/mm/aaaa não acusa", () => {
    const texto = [
      "Em 12/03/2026 a taxa básica subiu 5%.",
      "Em 15/04/2026 a mesma taxa caiu 5%.",
    ].join("\n");
    expect(ecosNumericos(texto)).toEqual([]);
  });

  test("URL não acusa", () => {
    const texto = [
      "Confira em https://exemplo.example/relatorio o corte de 80%.",
      "O PDF em https://exemplo.example/anexo repete o corte de 80%.",
    ].join("\n");
    expect(ecosNumericos(texto)).toEqual([]);
  });

  test("a seção ## VARIACOES_DE_HOOK não acusa — repete conteúdo por definição", () => {
    const texto = [
      "## VARIACOES_DE_HOOK",
      "Você sabia que 90% dos aprovados vinham da mesma cidade?",
      "90% dos aprovados vinham da mesma cidade, e ninguém percebeu.",
      "Ninguém explicou por que 90% dos aprovados vinham do mesmo lugar.",
    ].join("\n");
    expect(ecosNumericos(texto)).toEqual([]);
  });

  test("a seção muda termina no header seguinte — o corpo depois dela volta a ser lido", () => {
    const texto = [
      "## VARIACOES_DE_HOOK",
      "Você sabia que 90% dos aprovados vinham da mesma cidade?",
      "",
      "## CORPO",
      "A prova mostrou que 70% dos aprovados vinham da mesma cidade.",
      "Depois se descobriu que 70% deles tinham feito o mesmo cursinho.",
    ].join("\n");
    expect(valores(texto)).toEqual(["70%"]);
  });
});

describe("ecosNumericos — fail-soft (§7)", () => {
  test("texto vazio devolve lista vazia", () => {
    expect(ecosNumericos("")).toEqual([]);
  });

  test("entrada inválida devolve [] em vez de derrubar a geração", () => {
    expect(() => ecosNumericos(null as unknown as string)).not.toThrow();
    expect(ecosNumericos(null as unknown as string)).toEqual([]);
  });
});
