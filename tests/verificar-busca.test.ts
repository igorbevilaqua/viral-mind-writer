import { describe, expect, test, vi } from "vitest";
import { TETO_POR_RODADA, verificarRoteiro, type ItemBusca, type Veredicto } from "@/lib/pipeline/verificar";

// Passo 3 + orquestração (017 §5, §8, §11). Determinístico: as três chamadas externas
// (extração, busca, classificação) entram por injeção — nenhum teste toca rede.

const roteiro = { hook: "hook", roteiro: "roteiro", comando: "comando" };

const confirmado = (alegacao: string): Veredicto => ({
  alegacao,
  trecho_literal: alegacao,
  veredicto: "confirmado",
  fonte: { url: "https://exemplo.com/a", veiculo: "IBGE", ano: "2024" },
  correcao: null,
  explicacao: "a fonte confirma",
});

/** deps que devolvem `confirmado` para tudo que chegar à classificação. */
function deps(alegacoes: string[], buscar?: (q: string) => Promise<{ texto: string; fontes: string[] }>) {
  const classificar = vi.fn(async (itens: ItemBusca[]) => itens.map((it) => confirmado(it.alegacao)));
  return {
    extrair: vi.fn(async () => alegacoes),
    buscar: vi.fn(buscar ?? (async () => ({ texto: "a fonte confirma", fontes: ["https://exemplo.com/a"] }))),
    classificar,
  };
}

const fecham = (r: { total_alegacoes: number; rastreadas: number; verificadas: number; excedentes: number }) =>
  expect(r.rastreadas + r.verificadas + r.excedentes).toBe(r.total_alegacoes);

describe("fail-soft por alegação (§11)", () => {
  test("busca que rejeita vira nao_verificavel, nunca confirmado, e as outras seguem", async () => {
    const boa = "A Vale lucrou 45 bilhões em 2024";
    const ruim = "A Petrobras produziu 3 milhões de barris em 2023";
    const d = deps([boa, ruim], async (q) => {
      if (q.includes("Petrobras")) throw new Error("grok fora do ar");
      return { texto: "ok", fontes: ["https://exemplo.com/a"] };
    });

    const r = await verificarRoteiro({ roteiro, dossie: "", regime: "delta" }, d);

    const item = r.itens.find((i) => i.alegacao === ruim)!;
    expect(item.veredicto).toBe("nao_verificavel");
    expect(item.veredicto).not.toBe("confirmado");
    expect(item.explicacao).toMatch(/busca falhou/i);
    expect(item.fonte).toBeNull();

    // a outra alegação sobrevive: foi classificada normalmente
    expect(r.itens.find((i) => i.alegacao === boa)!.veredicto).toBe("confirmado");
    // e a alegação da busca quebrada NÃO foi mandada para a classificação
    expect(d.classificar.mock.calls[0][0].map((i) => i.alegacao)).toEqual([boa]);
    expect(r.itens).toHaveLength(2);
    fecham(r);
  });

  test("todas as buscas falhando não derruba a rodada nem chama a classificação", async () => {
    const d = deps(["A Vale lucrou 45 bilhões em 2024"], async () => {
      throw new Error("grok fora do ar");
    });
    const r = await verificarRoteiro({ roteiro, dossie: "", regime: "delta" }, d);
    expect(r.itens.map((i) => i.veredicto)).toEqual(["nao_verificavel"]);
    expect(d.classificar).not.toHaveBeenCalled();
    fecham(r);
  });
});

describe("regime", () => {
  const alegacao = "A Vale lucrou 45 bilhões em 2024";

  test("delta com tudo rastreável ao dossiê: zero busca, zero classificação", async () => {
    const d = deps([alegacao]);
    const r = await verificarRoteiro({ roteiro, dossie: `Relatório: ${alegacao}.`, regime: "delta" }, d);

    expect(d.buscar).not.toHaveBeenCalled();
    expect(d.classificar).not.toHaveBeenCalled();
    expect(r).toMatchObject({ total_alegacoes: 1, rastreadas: 1, verificadas: 0, excedentes: 0, itens: [] });
    expect(r.dossie_presente).toBe(true);
    fecham(r);
  });

  test("completa não filtra nada pelo dossiê, mesmo com o dossiê inteiro casando", async () => {
    const d = deps([alegacao]);
    const r = await verificarRoteiro({ roteiro, dossie: `Relatório: ${alegacao}.`, regime: "completa" }, d);

    expect(d.buscar).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ regime: "completa", rastreadas: 0, verificadas: 1 });
    fecham(r);
  });

  test("sem dossiê tudo é delta e dossie_presente é falso", async () => {
    const d = deps([alegacao]);
    const r = await verificarRoteiro({ roteiro, dossie: "   ", regime: "delta" }, d);
    expect(r.dossie_presente).toBe(false);
    expect(r.rastreadas).toBe(0);
    expect(r.verificadas).toBe(1);
    fecham(r);
  });
});

describe("teto por rodada (§8, §11)", () => {
  const muitas = Array.from({ length: TETO_POR_RODADA + 3 }, (_, i) => `A Empresa ${i} lucrou ${i + 1} bilhões em 2024`);

  test("excedente é listado como não verificada nesta rodada, nunca omitido", async () => {
    const d = deps(muitas);
    const r = await verificarRoteiro({ roteiro, dossie: "", regime: "completa" }, d);

    expect(d.buscar).toHaveBeenCalledTimes(TETO_POR_RODADA);
    expect(r.verificadas).toBe(TETO_POR_RODADA);
    expect(r.excedentes).toBe(3);
    // nada some: toda alegação extraída tem uma linha na tabela
    expect(r.itens).toHaveLength(muitas.length);
    expect(r.itens.map((i) => i.alegacao)).toEqual(muitas);

    for (const a of muitas.slice(TETO_POR_RODADA)) {
      const item = r.itens.find((i) => i.alegacao === a)!;
      expect(item.veredicto).toBe("nao_verificavel");
      expect(item.explicacao).toMatch(/não verificada nesta rodada/i);
    }
    fecham(r);
  });
});

describe("registro e progresso", () => {
  test("as contagens fecham com rastreadas, verificadas e excedentes juntas", async () => {
    // 1 rastreada + TETO buscadas + 2 excedentes
    const rastreada = "A Vale lucrou 45 bilhões em 2024";
    const resto = Array.from({ length: TETO_POR_RODADA + 2 }, (_, i) => `A Empresa ${i} lucrou ${i + 1} bilhões em 2023`);
    const d = deps([rastreada, ...resto]);

    const r = await verificarRoteiro({ roteiro, dossie: rastreada, regime: "delta" }, d);

    expect(r).toMatchObject({
      total_alegacoes: TETO_POR_RODADA + 3,
      rastreadas: 1,
      verificadas: TETO_POR_RODADA,
      excedentes: 2,
      regime: "delta",
    });
    fecham(r);
    expect(Date.parse(r.at)).not.toBeNaN();
  });

  test("emite progresso das fases longas — o heartbeat depende disso (§8)", async () => {
    const eventos: { etapa: string; feito?: number; total?: number }[] = [];
    const d = deps(["A Vale lucrou 45 bilhões em 2024", "A Petrobras produziu 3 milhões de barris em 2023"]);

    await verificarRoteiro({ roteiro, dossie: "", regime: "delta", onProgresso: (e) => eventos.push(e) }, d);

    expect(eventos.map((e) => e.etapa)).toContain("extraindo");
    expect(eventos.map((e) => e.etapa)).toContain("classificando");
    const buscas = eventos.filter((e) => e.etapa === "buscando");
    expect(buscas.at(-1)).toEqual({ etapa: "buscando", feito: 2, total: 2 });
  });
});
