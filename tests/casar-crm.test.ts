// tests/casar-crm.test.ts
// Plano 024, 4.1: casamento Codex → CRM → vídeo, sem rede. Os três clientes Supabase são um
// query builder falso que anota cada encadeamento e responde por tabela.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Passo = [string, unknown[]];
type Chamada = { db: string; tabela: string; passos: Passo[] };

const db = vi.hoisted(() => {
  const chamadas: Chamada[] = [];
  const respostas: Record<string, (c: Chamada) => unknown> = {};
  const cliente = (nome: string) => {
    const from = (tabela: string) => {
      const c: Chamada = { db: nome, tabela, passos: [] };
      chamadas.push(c);
      const p: unknown = new Proxy(() => {}, {
        get: (_, k) =>
          k === "then"
            ? (ok: (r: unknown) => void) => ok((respostas[`${nome}:${tabela}`] ?? (() => ({ data: [], error: null })))(c))
            : (...args: unknown[]) => {
                c.passos.push([String(k), args]);
                return p;
              },
      });
      return p;
    };
    return { from, rpc: (fn: string) => from(`rpc:${fn}`) };
  };
  return { chamadas, respostas, appDb: cliente("app"), viralData: cliente("vd"), crmDb: cliente("crm") };
});
vi.mock("@/lib/db", () => ({ appDb: db.appDb, viralData: db.viralData, crmDb: db.crmDb }));

import { casarComCrm, casarRoteiros, casarTextosCrm, MATCH_AUTO } from "@/lib/script-matches";

// Pares no formato da prova de 20/10: o humano reescreve, mas frases inteiras sobrevivem.
const CODEX =
  "existe caminho juridico para reorganizar dividas inclusive com condicoes muito melhores do que o banco oferece e quase ninguem sabe disso";
const CRM_REESCRITO = `Olha só. ${CODEX}. Fica até o final que eu te conto como.`;
// Um 5-grama em comum em 19 (≈ 0,05): zona cinza, mesma pauta com texto refeito.
const CRM_CINZA = "existe caminho juridico para reorganizar a vida de quem deve e o resto do texto foi todo refeito pelo time";
// Do outro lado da cinza: um 5-grama ("quem deve e o resto") em 17 com CRM_CINZA, nada com CODEX.
const CODEX_CINZA = "quem deve e o resto vai para o fundo do poco segundo os analistas do mercado financeiro de sao paulo";
const OUTRO = "a coca cola zero ta virando uma empresa a parte e a culpa disso e do mounjaro e do ozempic";

const tem = (c: Chamada, metodo: string) => c.passos.find(([m]) => m === metodo);
const escritas = (tabela: string, metodo: string) =>
  db.chamadas.filter((c) => c.db === "app" && c.tabela === tabela && tem(c, metodo)).map((c) => tem(c, metodo)![1][0]);

describe("casarTextosCrm", () => {
  const g = (id: string, roteiro: string, created_at = "2026-09-01T12:00:00Z") => ({ id, hook: null, roteiro, created_at });
  const r = (id: string, script_text: string, created_at = "2026-09-03T12:00:00Z") => ({ id, script_text, created_at });

  it("reescrito é automático, mesma pauta refeita é pendente, texto diferente some", () => {
    const out = casarTextosCrm([g("a", CODEX), g("b", OUTRO)], [r("x", CRM_REESCRITO), r("y", "nada a ver com nada disso aqui hoje")]);
    expect(out).toEqual([{ script_id: "a", crm_script_id: "x", sobreposicao: 1, auto: true }]);
    const [cinza] = casarTextosCrm([g("a", CODEX)], [r("y", CRM_CINZA)]);
    expect(cinza.auto).toBe(false);
    expect(cinza.sobreposicao).toBeLessThan(MATCH_AUTO);
  });

  it("janela de −3 a +60 dias da geração", () => {
    expect(casarTextosCrm([g("a", CODEX)], [r("x", CRM_REESCRITO, "2026-08-28T11:00:00Z")])).toEqual([]);
    expect(casarTextosCrm([g("a", CODEX)], [r("x", CRM_REESCRITO, "2026-11-01T12:00:00Z")])).toEqual([]);
    expect(casarTextosCrm([g("a", CODEX)], [r("x", CRM_REESCRITO, "2026-10-30T12:00:00Z")])).toHaveLength(1);
  });

  it("roteiro do CRM fica com a versão de maior sobreposição, e o já reivindicado não volta", () => {
    const out = casarTextosCrm([g("v1", CRM_CINZA), g("v2", CODEX)], [r("x", CRM_REESCRITO)]);
    expect(out.map((c) => c.script_id)).toEqual(["v2"]);
    expect(casarTextosCrm([g("v2", CODEX)], [r("x", CRM_REESCRITO)], new Set(["x"]))).toEqual([]);
  });
});

describe("casarComCrm", () => {
  beforeEach(() => {
    db.chamadas.length = 0;
    for (const k of Object.keys(db.respostas)) delete db.respostas[k];
    const agora = new Date().toISOString();
    db.respostas["app:vm_generated_scripts"] = (c) =>
      tem(c, "not") // os já ligados
        ? { data: [], error: null }
        : tem(c, "update")
          ? { data: [{ id: "x" }], error: null }
          : {
              data: [
                { id: "auto", hook: null, roteiro: CODEX, created_at: agora },
                { id: "cinza", hook: null, roteiro: CODEX_CINZA, created_at: agora },
              ],
              error: null,
            };
    db.respostas["crm:scripts"] = () => ({
      data: [
        { id: "crm-1", script_text: CRM_REESCRITO, created_at: agora },
        { id: "crm-2", script_text: CRM_CINZA, created_at: agora },
      ],
      error: null,
    });
    db.respostas["vd:videos"] = () => ({
      data: [
        { id: "tt", crm_script_id: "crm-1", link_video: "https://tiktok/1", data_publicacao: "2026-10-10", canais: { plataforma: "TikTok" } },
        { id: "ig", crm_script_id: "crm-1", link_video: "https://ig/1", data_publicacao: "2026-10-10", canais: [{ plataforma: "Instagram" }] },
        { id: "fora", crm_script_id: "crm-1", link_video: "https://ig/2", data_publicacao: "2026-10-10", removido: true, canais: null },
        { id: "v-cinza", crm_script_id: "crm-2", link_video: "https://ig/3", data_publicacao: "2026-10-11", canais: null },
      ],
      error: null,
    });
    db.respostas["app:vm_script_matches"] = (c) =>
      tem(c, "upsert") ? { data: (tem(c, "upsert")![1][0] as { confirmado: boolean | null }[]), error: null } : { data: [], error: null };
  });

  it("grava os vídeos em vm_script_matches, o crm_script_id só do automático e o link do Instagram", async () => {
    const r = await casarComCrm();
    expect(r).toEqual({ auto: 2, pendentes: 1, publicados: 1, roteiros: 1 });

    const [linhas] = escritas("vm_script_matches", "upsert") as { video_id: string; script_id: string; metodo: string; confirmado: boolean | null }[][];
    expect(linhas.map((l) => [l.video_id, l.script_id, l.metodo, l.confirmado])).toEqual([
      ["tt", "auto", "crm_shingle", true],
      ["ig", "auto", "crm_shingle", true],
      ["v-cinza", "cinza", "crm_shingle_pendente", null],
    ]);
    const upsert = db.chamadas.find((c) => tem(c, "upsert"))!;
    expect(tem(upsert, "upsert")![1][1]).toMatchObject({ ignoreDuplicates: true });

    const updates = escritas("vm_generated_scripts", "update") as Record<string, unknown>[];
    expect(updates).toEqual([{ crm_script_id: "crm-1", crm_sobreposicao: 1 }, expect.objectContaining({ published_url: "https://ig/1" })]);
    // paginação do CRM ordenada por id (sem ordem o PostgREST duplica e perde linhas)
    expect(tem(db.chamadas.find((c) => c.db === "crm")!, "order")![1][0]).toBe("id");
  });

  it("dry-run não escreve nada", async () => {
    const r = await casarComCrm({ gravar: false });
    expect(r).toEqual({ auto: 2, pendentes: 1, publicados: 0, roteiros: 1 });
    expect(db.chamadas.some((c) => tem(c, "upsert") || tem(c, "update"))).toBe(false);
  });

  it("vídeo já confirmado para outro roteiro não muda de dono", async () => {
    db.respostas["app:vm_script_matches"] = (c) =>
      tem(c, "upsert")
        ? { data: tem(c, "upsert")![1][0], error: null }
        : { data: [{ script_id: "outro", video_id: "ig" }], error: null };
    await casarComCrm();
    const [linhas] = escritas("vm_script_matches", "upsert") as { video_id: string }[][];
    expect(linhas.map((l) => l.video_id)).toEqual(["tt", "v-cinza"]);
    expect(escritas("vm_generated_scripts", "update")).toContainEqual(expect.objectContaining({ published_url: "https://tiktok/1" }));
  });

  it("erro (migration 0055 ausente) volta no resultado em vez de sumir", async () => {
    db.respostas["app:vm_generated_scripts"] = () => ({ data: null, error: { message: "column crm_script_id does not exist" } });
    const r = await casarComCrm();
    expect(r.erro).toMatch(/crm_script_id.*0055/);
    expect(r.roteiros).toBe(0);
  });
});

describe("casarRoteiros", () => {
  it("timeout da RPC antiga volta em `erro`", async () => {
    db.respostas["app:rpc:vm_match_scripts"] = () => ({ data: null, error: { message: "canceling statement due to statement timeout" } });
    expect(await casarRoteiros()).toEqual({ auto: 0, pendentes: 0, publicados: 0, erro: "vm_match_scripts: canceling statement due to statement timeout" });
  });
});
