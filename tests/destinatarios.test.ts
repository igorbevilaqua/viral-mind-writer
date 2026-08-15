import { describe, expect, test } from "vitest";
import { DESTINATARIOS, DIMENSAO_DESTINATARIOS, LEGACY_DIMENSOES } from "@/lib/pipeline/destinatarios";

describe("mapa de destinatários", () => {
  test("todo destinatário do backfill é um destinatário válido", () => {
    for (const alvos of Object.values(DIMENSAO_DESTINATARIOS))
      for (const a of alvos) expect(DESTINATARIOS).toContain(a);
  });

  test("toda dimensão produz destinatários não-vazios", () => {
    for (const [dim, alvos] of Object.entries(DIMENSAO_DESTINATARIOS))
      expect(alvos.length, `dimensão ${dim} ficou sem destinatário`).toBeGreaterThan(0);
  });

  // O teste que garante que a migration NÃO muda comportamento: para cada agente, o conjunto de
  // dimensões que ele passa a receber via destinatarios é idêntico ao que taughtBlock lhe entregava.
  test("equivalência com o roteamento legado", () => {
    for (const agente of DESTINATARIOS) {
      const viaNovo = Object.entries(DIMENSAO_DESTINATARIOS)
        .filter(([, alvos]) => alvos.includes(agente))
        .map(([dim]) => dim)
        .sort();
      expect(viaNovo, `roteamento mudou para ${agente}`).toEqual([...LEGACY_DIMENSOES[agente]].sort());
    }
  });
});
