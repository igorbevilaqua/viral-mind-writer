// tests/few-shot-skill.test.ts
// Plano 025, Task 7: a 0051 (vm_roteiro_modo) chega ao banco depois do código. Com a tabela
// ausente ou vazia, os exemplos de voz têm que ser exatamente os de hoje.
import { beforeEach, expect, test, vi } from "vitest";

const db = vi.hoisted(() => {
  // Query builder falso: qualquer encadeamento devolve a si mesmo, e o await entrega `res`.
  const q = (res: unknown): unknown => {
    const p: unknown = new Proxy(() => {}, {
      get: (_, k) => (k === "then" ? (ok: (r: unknown) => void) => ok(res) : () => p),
    });
    return p;
  };
  const roteiro = (i: number) => `roteiro ${i} `.repeat(80);
  const topo = [1, 2, 3].map((i) => ({ video_id: `v${i}`, coeficiente_viral: 5 - i, views_total: 1000 * i }));
  const videos = [1, 2, 3].map((i) => ({ id: `v${i}`, roteiro: roteiro(i), crm_script_id: `s${i}` }));
  const estado = { modo: { data: null, error: { message: "relation vm_roteiro_modo does not exist" } } as unknown };
  return {
    q,
    estado,
    appDb: { from: () => q(estado.modo) },
    viralData: { schema: () => ({ from: () => q({ data: topo, error: null }) }), from: () => q({ data: videos, error: null }) },
  };
});
vi.mock("@/lib/db", () => ({ appDb: db.appDb, viralData: db.viralData, crmDb: null }));

import { fetchFewShot } from "@/lib/pipeline/context";

beforeEach(() => {
  db.estado.modo = { data: null, error: { message: "relation vm_roteiro_modo does not exist" } };
});

test("tabela de modos ausente: com skill, os mesmos 3 exemplos da casa de hoje", async () => {
  const hoje = await fetchFewShot("pauta", "cli", null);
  const comSkill = await fetchFewShot("pauta", "cli", "historia");
  expect(hoje.exemplos).toHaveLength(3);
  expect(hoje.escopo).toBe("cliente");
  expect(comSkill).toEqual(hoje);
});

test("tabela de modos vazia: idem", async () => {
  db.estado.modo = { data: [], error: null };
  const hoje = await fetchFewShot("pauta", "cli", null);
  expect(await fetchFewShot("pauta", "cli", "mecanismo")).toEqual(hoje);
});

test("com rótulos: os da skill vêm primeiro e a origem diz o modo", async () => {
  db.estado.modo = { data: [{ crm_script_id: "s1", modo: "mecanismo" }, { crm_script_id: "s2", modo: "historia" }, { crm_script_id: "s3", modo: "historia" }], error: null };
  const r = await fetchFewShot("pauta", "cli", "historia");
  expect(r.exemplos.map((e) => e.roteiro.slice(0, 9))).toEqual(["roteiro 2", "roteiro 3", "roteiro 1"]);
  expect(r.exemplos[0].origem.endsWith(" · historia")).toBe(true);
  expect(r.exemplos[2].origem.endsWith(" · mecanismo")).toBe(true);
});

test("menos de 2 da skill no cliente: fica o melhor dele e 2 da skill de outros clientes completam", async () => {
  // o banco falso devolve as mesmas linhas para as duas leituras; basta que nenhum da casa seja da skill
  db.estado.modo = { data: [{ crm_script_id: "s1", modo: "mecanismo" }, { crm_script_id: "s2", modo: "mecanismo" }], error: null };
  const r = await fetchFewShot("pauta", "cli", "historia");
  expect(r.exemplos).toHaveLength(3);
  expect(r.exemplos[0].origem).toContain("para este cliente");
  expect(r.exemplos.slice(1).every((e) => e.origem.includes("OUTRO cliente, mesma skill (historia)"))).toBe(true);
});
