import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { clientPrefsBlock } from "@/lib/pipeline/draft";
import type { ClientPrefs, GenerationContext } from "@/lib/pipeline/types";

const prefs: ClientPrefs = {
  nome: "Dr. Fulano",
  proibicoes: ["falar mal de juízes"],
  tom_de_voz: "professoral e provocativo",
  temas_preferidos: ["direito tributário", "reforma tributária"],
  vocabulario_evitar: ["sonegar"],
  vocabulario_usar: ["planejamento tributário"],
  notas_entrevista: "atende empresários do agro há 15 anos",
};

const ctx = (modoModelagem: boolean, p: ClientPrefs | null = prefs) =>
  ({ clientPrefs: p, modoModelagem }) as GenerationContext;

describe("clientPrefsBlock em modo modelagem", () => {
  it("sem modelagem: bloco completo (tom, vocabulário a usar, temas, notas)", () => {
    const out = clientPrefsBlock(ctx(false));
    expect(out).toContain("Tom: professoral e provocativo");
    expect(out).toContain("Preferir vocabulário: planejamento tributário");
    expect(out).toContain("Notas da entrevista:");
  });

  it("com modelagem: some tudo que ditava voz/tema — o vídeo modelado é que manda", () => {
    const out = clientPrefsBlock(ctx(true));
    expect(out).not.toContain("professoral");
    expect(out).not.toContain("planejamento tributário");
    expect(out).not.toContain("agro");
    expect(out).not.toContain("Temas preferidos");
  });

  it("com modelagem: proibições sobrevivem, e com o header que a revisão procura", () => {
    const out = clientPrefsBlock(ctx(true));
    expect(out).toContain("RESTRIÇÕES DO CLIENTE (INVIOLÁVEIS)");
    expect(out).toContain("PROIBIDO: falar mal de juízes");
    expect(out).toContain("Nunca usar as palavras: sonegar");
    expect(out).toContain("adapte ou remova");
  });

  it("com modelagem: licença de autoridade sai da identidade e exige alta confiança", () => {
    const out = clientPrefsBlock(ctx(true));
    expect(out).toContain("direito tributário");
    expect(out).toContain("ALTA CONFIANÇA");
    expect(out).toContain("PONTUAL");
  });

  it("sem identidade cadastrada, a licença de autoridade nem é oferecida", () => {
    const out = clientPrefsBlock(ctx(true, { ...prefs, temas_preferidos: [] }));
    expect(out).not.toContain("AUTORIDADE");
    expect(out).toContain("PROIBIDO: falar mal de juízes"); // veto continua
  });

  it("sem cliente: bloco vazio nos dois modos", () => {
    expect(clientPrefsBlock(ctx(true, null))).toBe("");
    expect(clientPrefsBlock(ctx(false, null))).toBe("");
  });
});
