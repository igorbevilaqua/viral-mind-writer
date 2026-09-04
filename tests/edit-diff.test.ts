import { describe, expect, test } from "vitest";
import {
  classificarMudanca,
  clusters,
  observacoesDaEdicao,
  parearParagrafos,
  termosTrocados,
  type Observacao,
} from "@/lib/edit-diff";

describe("classificarMudanca", () => {
  // O portão que protege o prompt: correção de dado nunca é regra de escrita.
  test("âncora que muda é factual, mesmo com o resto idêntico", () => {
    expect(classificarMudanca("A empresa vale 45 bilhões hoje.", "A empresa vale 4,5 bilhões hoje.")).toBe("factual");
  });

  test("nome próprio trocado é factual", () => {
    expect(classificarMudanca("Quem assinou foi o Banco Central.", "Quem assinou foi a Receita Federal.")).toBe(
      "factual"
    );
  });

  test("factual vence vocabulário — a troca é curta, mas mexe em dado", () => {
    // duas palavras trocadas cairia em vocabulário se a ordem de teste estivesse errada
    expect(classificarMudanca("Foram 12 casos em 2020.", "Foram 30 casos em 2020.")).toBe("factual");
  });

  test("troca de uma palavra é vocabulário", () => {
    expect(classificarMudanca("Leia a manchete do jornal.", "Leia o título do jornal.")).toBe("vocabulario");
  });

  test("mesmas palavras em outra ordem é ritmo", () => {
    expect(classificarMudanca("Ele saiu cedo, e ninguém viu.", "Ninguém viu. Ele saiu cedo.")).toBe("ritmo");
  });

  test("parágrafo refeito é reescrita", () => {
    expect(
      classificarMudanca(
        "O mercado reagiu mal ao anúncio e as ações despencaram durante toda a tarde.",
        "Ninguém esperava esse tombo. Foi uma tarde inteira de queda livre, sem respiro.",
      )
    ).toBe("reescrita");
  });
});

describe("parearParagrafos", () => {
  test("parágrafo idêntico não vira par", () => {
    expect(parearParagrafos("Igual.\n\nMudou aqui.", "Igual.\n\nMudou ali.")).toHaveLength(1);
  });

  test("parágrafo removido vira corte", () => {
    const pares = parearParagrafos("Um.\n\nDois.\n\nTres.", "Um.\n\nTres.");
    expect(pares).toEqual([{ tipo: "corte", antes: "Dois.", depois: "" }]);
  });

  test("parágrafo novo vira insercao", () => {
    const pares = parearParagrafos("Um.\n\nDois.", "Um.\n\nNovo aqui.\n\nDois.");
    expect(pares).toEqual([{ tipo: "insercao", antes: "", depois: "Novo aqui." }]);
  });

  test("texto sem mudança nenhuma devolve lista vazia", () => {
    expect(parearParagrafos("Um.\n\nDois.", "Um.\n\nDois.")).toEqual([]);
  });

  test("parágrafos sem relação viram corte + insercao, não um par forçado", () => {
    const pares = parearParagrafos("Receita de bolo de cenoura com cobertura.", "A taxa Selic subiu meio ponto.");
    expect(pares.map((p) => p.tipo).sort()).toEqual(["corte", "insercao"]);
  });
});

describe("termosTrocados", () => {
  test("devolve o par de→para", () => {
    expect(termosTrocados("Leia a manchete do jornal.", "Leia a título do jornal.")).toEqual([
      { de: "manchete", para: "título" },
    ]);
  });

  test("sem 1:1 não inventa alinhamento", () => {
    expect(termosTrocados("a b c", "a b c d e")).toEqual([]);
  });
});

describe("observacoesDaEdicao", () => {
  // O ponto do plano: factual não é filtrado depois, é descartado na fronteira, para que
  // nenhum consumidor futuro possa esquecer de filtrar.
  test("factual nunca vira observação", () => {
    const obs = observacoesDaEdicao("Custou 10 reais.", "Custou 20 reais.");
    expect(obs).toEqual([]);
  });

  test("vocabulário vira uma observação por termo trocado", () => {
    const obs = observacoesDaEdicao("A manchete estava boa.", "A título estava ótima.");
    expect(obs).toHaveLength(2);
    expect(obs.every((o) => o.tipo === "vocabulario")).toBe(true);
  });

  test("troca de vocabulário sem 1:1 vira ritmo, não some", () => {
    const obs = observacoesDaEdicao("Ele foi.", "Ele foi embora agora.");
    expect(obs).toHaveLength(1);
    expect(obs[0].tipo).toBe("ritmo");
  });
});

describe("clusters", () => {
  const obs = (n: number, de: string, para: string, clientId: string | null = "c1") =>
    Array.from({ length: n }, () => ({
      tipo: "vocabulario" as const,
      antes: "x",
      depois: "y",
      termo_de: de,
      termo_para: para,
      clientId,
    })) as (Observacao & { clientId: string | null })[];

  test("abaixo de N não vira cluster — edição isolada nunca vira regra", () => {
    expect(clusters(obs(2, "manchete", "título"))).toEqual([]);
  });

  test("a partir de N vira cluster", () => {
    const c = clusters(obs(3, "manchete", "título"));
    expect(c).toHaveLength(1);
    expect(c[0].n).toBe(3);
  });

  test("clientes diferentes não se somam", () => {
    expect(clusters([...obs(2, "manchete", "título", "c1"), ...obs(2, "manchete", "título", "c2")])).toEqual([]);
  });

  test("pares diferentes não se somam", () => {
    expect(clusters([...obs(2, "manchete", "título"), ...obs(2, "lead", "abertura")])).toEqual([]);
  });

  test("ordena do mais repetido para o menos", () => {
    const c = clusters([...obs(3, "a", "b"), ...obs(5, "c", "d")]);
    expect(c.map((x) => x.n)).toEqual([5, 3]);
  });
});
