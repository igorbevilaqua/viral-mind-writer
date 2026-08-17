import { beforeEach, describe, expect, test, vi } from "vitest";

// appDb falso: só o suficiente para a leitura padrão de lições pendentes. Cada `.from()`
// abre um builder novo, então os `.eq()` de uma consulta não vazam para a seguinte.
const db = vi.hoisted(() => {
  const state = { rows: [] as Record<string, unknown>[] };
  interface Res {
    data: Record<string, unknown>[];
    error: { message: string } | null;
  }
  interface Q {
    select(): Q;
    eq(col: string, val: unknown): Q;
    order(): Q;
    limit(): Q;
    then(ok: (r: Res) => unknown, err?: (e: unknown) => unknown): Promise<unknown>;
  }
  const builder = (): Q => {
    const eqs: [string, unknown][] = [];
    const q: Q = {
      select: () => q,
      order: () => q,
      limit: () => q,
      eq: (col, val) => {
        eqs.push([col, val]);
        return q;
      },
      then: (ok, err) =>
        Promise.resolve({
          data: state.rows.filter((r) => eqs.every(([c, v]) => r[c] === v)),
          error: null,
        }).then(ok, err),
    };
    return q;
  };
  return { state, from: () => builder() };
});

vi.mock("@/lib/db", () => ({ appDb: db, viralData: {} }));

import { proximaPendencia, responder, type FilasDeps, type Pendencia } from "@/lib/pipeline/kasparov-filas";

// O que `getNextCalibrationPair` devolve HOJE (CalibPairView) mais campos que ele não devolve:
// a fila não pode virar a porta por onde o mecanismo vaza para a conversa.
const parComVazamento = {
  id: "p1",
  a: "o banco cobra 3% ao mês",
  b: "ninguém lê o extrato de março",
  restantes: 94,
  axis: "curiosity_gap",
  source: "probe",
  mecanismo: "loop aberto",
};

const licao = {
  id: "l1",
  titulo: "Ritmo curto",
  descricao: "frases de até 12 palavras",
  evidencia: "ele corta a frase antes do verbo, sempre",
};

const deps = (over: FilasDeps = {}): FilasDeps => ({
  proximoPar: async () => null,
  licoesPendentes: async () => [],
  ...over,
});

// Sorteio entre as filas disponíveis: 0 pega a primeira (calibração), ~1 pega a última (lição).
const sorteio = (v: number) => vi.spyOn(Math, "random").mockReturnValue(v);

beforeEach(() => {
  vi.restoreAllMocks();
  db.state.rows = [];
});

describe("proximaPendencia — sem fila, sem assunto (018 §8)", () => {
  test("nenhuma pendência devolve null", async () => {
    expect(await proximaPendencia(null, deps())).toBeNull();
  });

  test("fila que explode não derruba o turno — vira null", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const d = deps({
      proximoPar: async () => {
        throw new Error("supabase fora do ar");
      },
      licoesPendentes: async () => {
        throw new Error("supabase fora do ar");
      },
    });
    expect(await proximaPendencia("c1", d)).toBeNull();
  });
});

describe("proximaPendencia — par de calibração é CEGO", () => {
  test("vem o par, sem eixo, sem origem, sem mecanismo", async () => {
    sorteio(0);
    const p = await proximaPendencia("c1", deps({ proximoPar: async () => parComVazamento }));
    expect(p?.tipo).toBe("calibracao");
    expect(Object.keys(p!).sort()).toEqual(["a", "b", "pairId", "restantes", "tipo"]);
    const serializado = JSON.stringify(p);
    expect(serializado).not.toMatch(/curiosity_gap|probe|loop aberto|mecanismo|axis|source/i);
    expect(serializado).toContain("3% ao mês");
  });

  test("o clientId chega em quem faz a seleção — a rotação de eixos continua sendo dele", async () => {
    sorteio(0);
    const proximoPar = vi.fn(async () => parComVazamento);
    await proximaPendencia("c1", deps({ proximoPar }));
    expect(proximoPar).toHaveBeenCalledWith("c1");
  });
});

describe("proximaPendencia — lição extraída e nunca ativada", () => {
  test("uma por vez, com a evidência que a gerou", async () => {
    sorteio(0);
    const p = await proximaPendencia(null, deps({ licoesPendentes: async () => [licao] }));
    expect(p).toEqual({
      tipo: "licao",
      learningId: "l1",
      titulo: "Ritmo curto",
      descricao: "frases de até 12 palavras",
      evidencia: "ele corta a frase antes do verbo, sempre",
      restantes: 1,
    });
  });

  test("lição sem evidência ainda é oferecida, com evidencia null", async () => {
    sorteio(0);
    const p = await proximaPendencia(null, deps({ licoesPendentes: async () => [{ ...licao, evidencia: null }] }));
    expect(p).toMatchObject({ tipo: "licao", evidencia: null });
  });
});

describe("proximaPendencia — as duas filas dividem o assunto", () => {
  const cheio = deps({ proximoPar: async () => parComVazamento, licoesPendentes: async () => [licao] });

  test("94 pares não monopolizam: o sorteio alcança as duas filas", async () => {
    sorteio(0);
    expect((await proximaPendencia("c1", cheio))?.tipo).toBe("calibracao");
    sorteio(0.99);
    expect((await proximaPendencia("c1", cheio))?.tipo).toBe("licao");
  });

  test("fila vazia não entra no sorteio", async () => {
    sorteio(0.99);
    const so = deps({ proximoPar: async () => parComVazamento });
    expect((await proximaPendencia("c1", so))?.tipo).toBe("calibracao");
  });
});

describe("responder — e o que não é respondido volta", () => {
  test("voto vai para o gravador que já existe, com winner a|b", async () => {
    const votar = vi.fn(async () => {});
    const p: Pendencia = { tipo: "calibracao", pairId: "p1", a: "x", b: "y", restantes: 94 };
    await responder(p, "b", "c1", deps({ votar }));
    expect(votar).toHaveBeenCalledWith("p1", "b", "c1");
  });

  test("skip é resposta legítima, não erro", async () => {
    const votar = vi.fn(async () => {});
    const p: Pendencia = { tipo: "calibracao", pairId: "p1", a: "x", b: "y", restantes: 94 };
    await expect(responder(p, "skip", null, deps({ votar }))).resolves.toBeUndefined();
    expect(votar).toHaveBeenCalledWith("p1", "skip", null);
  });

  test("ativar a lição é setLearningActive(id, true)", async () => {
    const ativarLicao = vi.fn(async () => {});
    const p: Pendencia = { tipo: "licao", learningId: "l1", titulo: "t", descricao: "d", evidencia: null, restantes: 28 };
    await responder(p, "ativar", null, deps({ ativarLicao }));
    expect(ativarLicao).toHaveBeenCalledWith("l1", true);
  });

  test("resposta que não pertence à pendência é recusada, e nada é gravado", async () => {
    const votar = vi.fn(async () => {});
    const ativarLicao = vi.fn(async () => {});
    const par: Pendencia = { tipo: "calibracao", pairId: "p1", a: "x", b: "y", restantes: 1 };
    const lic: Pendencia = { tipo: "licao", learningId: "l1", titulo: "t", descricao: "d", evidencia: null, restantes: 1 };
    await expect(responder(par, "ativar", null, deps({ votar, ativarLicao }))).rejects.toThrow();
    await expect(responder(lic, "a", null, deps({ votar, ativarLicao }))).rejects.toThrow();
    expect(votar).not.toHaveBeenCalled();
    expect(ativarLicao).not.toHaveBeenCalled();
  });

  test("pendência oferecida e não respondida volta na próxima — nada é reservado", async () => {
    sorteio(0);
    const d = deps({ proximoPar: async () => parComVazamento });
    const primeira = await proximaPendencia("c1", d);
    const segunda = await proximaPendencia("c1", d);
    expect(segunda).toEqual(primeira);
  });

  test("lição pulada continua na fila — skip não desativa nada", async () => {
    sorteio(0);
    const ativarLicao = vi.fn(async () => {});
    const d = deps({ licoesPendentes: async () => [licao], ativarLicao });
    const p = await proximaPendencia(null, d);
    await responder(p!, "skip", null, d);
    expect(ativarLicao).not.toHaveBeenCalled();
    expect(await proximaPendencia(null, d)).toEqual(p);
  });
});

describe("leitura padrão das lições (appDb, sem injeção)", () => {
  const linha = (over: Record<string, unknown> = {}) => ({
    id: "l1",
    titulo: "Ritmo curto",
    descricao: "até 12 palavras",
    evidencia: "corta antes do verbo",
    active: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    vm_lessons: { client_id: null },
    ...over,
  });

  test("só lição inativa entra na fila", async () => {
    sorteio(0);
    db.state.rows = [linha(), linha({ id: "l2", active: true })];
    const p = await proximaPendencia(null, { proximoPar: async () => null });
    expect(p).toMatchObject({ tipo: "licao", learningId: "l1", restantes: 1 });
  });

  test("lição já desativada pela mão do usuário não volta a ser oferecida", async () => {
    db.state.rows = [linha({ updated_at: "2026-02-01T00:00:00Z" })];
    expect(await proximaPendencia(null, { proximoPar: async () => null })).toBeNull();
  });

  test("lição de outro cliente fica de fora; global entra sempre", async () => {
    sorteio(0);
    db.state.rows = [
      linha({ id: "outro", vm_lessons: { client_id: "c9" } }),
      linha({ id: "global", vm_lessons: { client_id: null } }),
    ];
    const p = await proximaPendencia("c1", { proximoPar: async () => null });
    expect(p).toMatchObject({ learningId: "global", restantes: 1 });
  });
});

// ── Peça 5: lembrete de métrica de publicação ────────────────────────────────
describe("fila de métrica faltando", () => {
  const semOutras = { proximoPar: async () => null, licoesPendentes: async () => [] };

  test("roteiro publicado sem métrica vira pendência", async () => {
    const p = await proximaPendencia("c1", {
      ...semOutras,
      metricasFaltando: async () => [{ scriptId: "s1", url: "https://ig/p/1", dias: 20 }],
    });
    expect(p).toEqual({ tipo: "metrica", scriptId: "s1", url: "https://ig/p/1", dias: 20, restantes: 1 });
  });

  test("cobra o mais antigo primeiro", async () => {
    const p = await proximaPendencia("c1", {
      ...semOutras,
      metricasFaltando: async () => [
        { scriptId: "novo", url: "u", dias: 15 },
        { scriptId: "velho", url: "u", dias: 60 },
      ],
    });
    expect(p).toMatchObject({ scriptId: "velho", dias: 60 });
  });

  test("nada publicado sem métrica, nada a puxar", async () => {
    expect(await proximaPendencia("c1", { ...semOutras, metricasFaltando: async () => [] })).toBeNull();
  });

  // É lembrete, não coleta: vm_script_performance exige viral_data_video_id e quem preenche é o
  // ETL. Aceitar `skip` sem gravar é honesto; fingir que registrou métrica não seria.
  test("só aceita skip, e skip não escreve nada", async () => {
    const p = { tipo: "metrica" as const, scriptId: "s1", url: "u", dias: 20, restantes: 1 };
    const escritas: string[] = [];
    await responder(p, "skip", "c1", {
      votar: async () => escritas.push("voto"),
      ativarLicao: async () => void escritas.push("ativa"),
    });
    expect(escritas).toEqual([]);
    await expect(responder(p, "ativar", "c1", {})).rejects.toThrow(/só aceita skip/);
  });
});
