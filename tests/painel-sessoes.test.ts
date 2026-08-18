import { describe, expect, test } from "vitest";
import { casaComStatus, clientesDoFiltro, entraNoPainel, mesclarPainel } from "@/lib/painel-sessoes";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("clientesDoFiltro", () => {
  test("vários ?cliente= viram lista, sem repetição", () => {
    expect(clientesDoFiltro([A, B, A])).toEqual([A, B]);
  });

  test("um só continua funcionando (link antigo, chip de antes)", () => {
    expect(clientesDoFiltro(A)).toEqual([A]);
  });

  test("lixo na URL não vira filtro: id inválido some em vez de virar consulta", () => {
    expect(clientesDoFiltro(["nao-e-uuid", A])).toEqual([A]);
    expect(clientesDoFiltro(undefined)).toEqual([]);
    expect(clientesDoFiltro("")).toEqual([]);
  });
});

describe("entraNoPainel", () => {
  test("sem filtro, os dois tipos entram", () => {
    expect(entraNoPainel("roteiro")).toBe(true);
    expect(entraNoPainel("kasparov")).toBe(true);
  });

  test("filtro de tipo é explícito e manda", () => {
    expect(entraNoPainel("kasparov", "roteiros")).toBe(false);
    expect(entraNoPainel("roteiro", "kasparov")).toBe(false);
    expect(entraNoPainel("kasparov", "kasparov")).toBe(true);
  });

  test("status é conceito de roteiro: filtrar por status exclui o debate", () => {
    expect(entraNoPainel("roteiro", undefined, "publicada")).toBe(true);
    expect(entraNoPainel("kasparov", undefined, "publicada")).toBe(false);
  });

  test("tipo=kasparov com status pendurado na URL ainda mostra debate", () => {
    expect(entraNoPainel("kasparov", "kasparov", "publicada")).toBe(true);
  });
});

describe("casaComStatus", () => {
  const aguardando = { effStatus: "aguardando_premissa", published: false };

  test("sem chip, tudo passa", () => {
    expect(casaComStatus(undefined, aguardando)).toBe(true);
    expect(casaComStatus(undefined, { effStatus: "done", published: true })).toBe(true);
  });

  test("a sessão que espera ação humana tem chip próprio e não some sob ele", () => {
    expect(casaComStatus("aguardando", aguardando)).toBe(true);
    expect(casaComStatus("aguardando", { effStatus: "generating", published: false })).toBe(false);
  });

  test("os chips existentes continuam valendo", () => {
    expect(casaComStatus("gerando", { effStatus: "generating", published: false })).toBe(true);
    expect(casaComStatus("pronta", { effStatus: "done", published: false })).toBe(true);
    // pronta e publicada são chips diferentes: publicada não conta duas vezes
    expect(casaComStatus("pronta", { effStatus: "done", published: true })).toBe(false);
    expect(casaComStatus("publicada", { effStatus: "done", published: true })).toBe(true);
    expect(casaComStatus("encerrada", { effStatus: "closed", published: false })).toBe(true);
    expect(casaComStatus("interrompida", { effStatus: "stalled", published: false })).toBe(true);
  });

  test("status desconhecido na URL não esvazia a lista", () => {
    expect(casaComStatus("chip-que-nao-existe-mais", aguardando)).toBe(true);
  });
});

describe("mesclarPainel", () => {
  test("as duas listas em uma, mais recente primeiro", () => {
    const roteiros = [{ quando: "2026-08-10T10:00:00Z", q: "r1" }];
    const debates = [
      { quando: "2026-08-17T09:00:00Z", q: "d1" },
      { quando: "2026-08-01T09:00:00Z", q: "d2" },
    ];
    expect(mesclarPainel<{ quando: string; q: string }>([roteiros, debates]).map((l) => l.q)).toEqual([
      "d1",
      "r1",
      "d2",
    ]);
  });

  test("o teto corta o excedente depois de ordenar, não antes", () => {
    const velhas = Array.from({ length: 5 }, (_, i) => ({ quando: `2026-08-0${i + 1}T00:00:00Z`, q: `v${i}` }));
    const nova = [{ quando: "2026-08-17T00:00:00Z", q: "nova" }];
    expect(mesclarPainel([velhas, nova], 2).map((l) => l.q)).toEqual(["nova", "v4"]);
  });
});
