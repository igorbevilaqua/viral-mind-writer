import { describe, expect, test } from "vitest";
import { extrairEstudos } from "@/lib/pipeline/estudos";

const dossie = (corpo: string) =>
  `# Dossiê\n\n## FATOS E NÚMEROS\n- algo\n\n## ESTUDOS\n${corpo}\n\n## FONTES\n- https://exemplo.com\n`;

describe("extrairEstudos", () => {
  test("linha sem URL vai para descartados, com motivo", () => {
    const r = extrairEstudos(dossie("- Trabalho remoto sobe 40% — Harvard, 2024"));
    expect(r.aceitos).toEqual([]);
    expect(r.descartados).toHaveLength(1);
    expect(r.descartados[0].linha).toContain("Harvard");
    expect(r.descartados[0].motivo).toBeTruthy();
  });

  test("linha com URL entra em aceitos", () => {
    const r = extrairEstudos(dossie("- Trabalho remoto sobe 40% — Nature, 2024 — https://www.nature.com/articles/x1"));
    expect(r.descartados).toEqual([]);
    expect(r.aceitos).toHaveLength(1);
    expect(r.aceitos[0].url).toBe("https://www.nature.com/articles/x1");
    expect(r.aceitos[0].texto).toContain("Trabalho remoto sobe 40%");
  });

  // o JSON tem 14 domínios por tier e não é exaustivo: descartar por ausência jogaria fora
  // estudo legítimo. Rebaixa e marca — não descarta (016 §5.1).
  test("domínio fora do JSON entra com tier null, não é descartado", () => {
    const r = extrairEstudos(dossie("- Achado qualquer — Instituto X, 2023 — https://institutox.org/paper"));
    expect(r.descartados).toEqual([]);
    expect(r.aceitos).toHaveLength(1);
    expect(r.aceitos[0].dominio).toBe("institutox.org");
    expect(r.aceitos[0].tier).toBeNull();
  });

  test("domínio conhecido entra com o tier certo", () => {
    const r = extrairEstudos(
      dossie(
        [
          "- A — Nature, 2024 — https://www.nature.com/a",
          "- B — Reuters, 2024 — https://reuters.com/b",
          "- C — Wikipedia, 2024 — https://pt.wikipedia.org/wiki/C",
        ].join("\n")
      )
    );
    expect(r.aceitos.map((e) => e.tier)).toEqual([1, 2, 3]);
  });

  test("subdomínio casa por sufixo", () => {
    const r = extrairEstudos(dossie("- Registro anual — SEC, 2025 — https://data.sec.gov/api/x"));
    expect(r.aceitos[0].dominio).toBe("data.sec.gov");
    expect(r.aceitos[0].tier).toBe(1);
  });

  // regressão do recorte: com a flag `m` o `$` casaria o fim da PRIMEIRA linha e este
  // teste veria um estudo só (016 §5.1, padrão de checagemSection).
  test("seção com vários estudos devolve todos", () => {
    const r = extrairEstudos(
      dossie(
        [
          "- A — Nature, 2024 — https://nature.com/a",
          "- B — Science, 2023 — https://science.org/b",
          "- C sem link — Alguém, 2022",
          "- D — IBGE, 2025 — https://ibge.gov.br/d",
        ].join("\n")
      )
    );
    expect(r.aceitos).toHaveLength(3);
    expect(r.descartados).toHaveLength(1);
  });

  test("dossiê sem a seção devolve as duas listas vazias, sem lançar", () => {
    expect(() => extrairEstudos("# Dossiê\n\n## FATOS E NÚMEROS\n- algo\n")).not.toThrow();
    expect(extrairEstudos("# Dossiê\n\n## FATOS E NÚMEROS\n- algo\n")).toEqual({ aceitos: [], descartados: [] });
    expect(extrairEstudos("")).toEqual({ aceitos: [], descartados: [] });
  });
});
