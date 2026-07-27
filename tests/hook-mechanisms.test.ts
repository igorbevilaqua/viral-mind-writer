import { describe, expect, it } from "vitest";
import { selectHook, type HookCandidate } from "@/lib/pipeline/hook-mechanisms";

// Fase 3: seleção do hook principal + variantes a partir dos candidatos gerados.
const c = (hook: string, mecanismo: string): HookCandidate => ({ hook, mecanismo });

describe("selectHook", () => {
  it("principal = candidato do mecanismo mais bem ranqueado", () => {
    const cands = [c("a", "Urgência"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Superlativo")];
    const rank = new Map([["Contraste Extremo", 0.58], ["Revelação Secreta", 0.26], ["Superlativo", 0.16]]);
    const out = selectHook(cands, rank)!;
    expect(out.principal.hook).toBe("b"); // Contraste Extremo, maior share
    expect(out.variantes).toHaveLength(3);
    // variantes de mecanismos distintos
    expect(new Set(out.variantes.map((v) => v.mecanismo)).size).toBe(3);
  });

  it("sem ranking → ordem estável (principal = 1º candidato)", () => {
    const cands = [c("a", "Urgência"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Superlativo")];
    const out = selectHook(cands, new Map())!;
    expect(out.principal.hook).toBe("a");
    expect(out.variantes.map((v) => v.hook)).toEqual(["b", "d", "e"]);
  });

  it("mecanismos repetidos → variantes preferem distintos, completam com o resto", () => {
    const cands = [c("a", "Contraste Extremo"), c("b", "Contraste Extremo"), c("d", "Revelação Secreta"), c("e", "Contraste Extremo")];
    const rank = new Map([["Contraste Extremo", 0.58], ["Revelação Secreta", 0.26]]);
    const out = selectHook(cands, rank)!;
    expect(out.principal.mecanismo).toBe("Contraste Extremo");
    expect(out.variantes).toHaveLength(3);
    // primeira variante deve ser o mecanismo distinto (Revelação), depois completa
    expect(out.variantes[0].mecanismo).toBe("Revelação Secreta");
  });

  it("candidatos vazios → null", () => {
    expect(selectHook([{ hook: "  ", mecanismo: "Outro" }], new Map())).toBeNull();
  });
});
