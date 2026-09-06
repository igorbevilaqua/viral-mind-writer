import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HOOK_MECHANISMS } from "@/lib/pipeline/hook-mechanisms";
import { extractPlaybookSection } from "@/lib/pipeline/draft";
import {
  COMANDO_SLUG_TO_NOME,
  ESTRUTURAS,
  HOOK_SLUG_TO_MEC,
  STORY_SLUG_TO_CODE,
  mapearOraculo,
  slugConhecido,
} from "@/lib/pipeline/taxonomia";

// Slugs presentes em oraculo.playbook_categorias em 05/09/2026 (verificado no banco).
const HOOK_SLUGS = ["apelo_a_autoridade", "apelo_a_maioria", "apelo_ao_esforco", "apelo_historico", "conflito_declarado", "contraste_extremo", "desafio_de_crenca", "elemento_controverso", "esse_cara", "o_proibido", "ordem_contra_intuitiva", "pergunta_direta", "pergunta_reflexiva", "revelacao_secreta", "superlativo", "ultra_especificidade", "urgencia", "vies_de_negatividade"];
const COMANDO_SLUGS = ["comentario_por_recompensa", "gatilho_autoridade", "gatilho_beneficio", "gatilho_comunicacao", "gatilho_exclusividade", "gatilho_expectativa", "gatilho_inimigo_comum", "gatilho_proposito", "pergunta_de_engajamento", "pergunta_de_opiniao", "pergunta_dicotomica", "pergunta_direta", "pergunta_reflexiva"];
const STORY_SLUGS = ["conflito_imprevisivel", "davi_e_golias", "dois_mundos", "efeito_domino", "erro_fatal", "estrategia_oculta", "evento_global", "heroi_esquecido", "heroi_improvavel", "inovacao_sacada_genial", "investigacao_escandalo", "jornada_do_heroi", "narrativa_filosofica", "o_iconoclasta", "o_profeta_ignorado", "paradoxo_contraintuitivo", "queda_do_gigante", "transformacao_de_identidade", "urgencia_alerta"];

describe("taxonomia: todo slug do Oráculo tem mapa", () => {
  it("hook (18)", () => {
    expect(HOOK_SLUGS).toHaveLength(18);
    for (const s of HOOK_SLUGS) expect(slugConhecido("hook", s), s).toBe(true);
  });
  it("comando (13)", () => {
    expect(COMANDO_SLUGS).toHaveLength(13);
    for (const s of COMANDO_SLUGS) expect(slugConhecido("comando", s), s).toBe(true);
  });
  it("storytelling (19)", () => {
    expect(STORY_SLUGS).toHaveLength(19);
    for (const s of STORY_SLUGS) expect(slugConhecido("storytelling", s), s).toBe(true);
    expect(Object.keys(STORY_SLUG_TO_CODE).sort()).toEqual([...STORY_SLUGS].sort());
  });
});

describe("taxonomia: hook", () => {
  it("todo mecanismo produzido está em HOOK_MECHANISMS", () => {
    for (const m of Object.values(HOOK_SLUG_TO_MEC)) expect(HOOK_MECHANISMS).toContain(m);
  });
  it("o_proibido → Viés de Ilegalidade; pergunta_* → Outro", () => {
    expect(HOOK_SLUG_TO_MEC.o_proibido).toBe("Viés de Ilegalidade");
    expect(HOOK_SLUG_TO_MEC.pergunta_direta).toBe("Outro");
    expect(HOOK_SLUG_TO_MEC.pergunta_reflexiva).toBe("Outro");
  });
  it("esse_cara vira formato, mecanismo vem do 2º slug ou Outro", () => {
    expect(HOOK_SLUG_TO_MEC).not.toHaveProperty("esse_cara");
    expect(mapearOraculo("hook", ["esse_cara"])).toEqual({ hook_mecanismos: ["Outro"], hook_formato: "Personagem Central" });
    expect(mapearOraculo("hook", ["esse_cara", "contraste_extremo"])).toEqual({
      hook_mecanismos: ["Contraste Extremo"],
      hook_formato: "Personagem Central",
    });
    // sem esse_cara o formato fica indefinido (o Oráculo não avalia formato)
    expect(mapearOraculo("hook", ["urgencia", "superlativo", "urgencia"])).toEqual({ hook_mecanismos: ["Urgência", "Superlativo"] });
    expect(mapearOraculo("hook", [])).toEqual({ hook_mecanismos: ["Outro"] });
  });
});

describe("taxonomia: storytelling", () => {
  const playbook = readFileSync(path.join(process.cwd(), "playbooks", "storytelling.md"), "utf8");
  it("19 estruturas, cada uma casa com um heading '## <code>. <nome>' do playbook", () => {
    expect(ESTRUTURAS).toHaveLength(19);
    const headings = playbook.split("\n").filter((l) => l.startsWith("## "));
    for (const e of ESTRUTURAS) {
      expect(headings.some((h) => h.startsWith(`## ${e.code}. ${e.nome}`)), `${e.code}. ${e.nome}`).toBe(true);
      expect(extractPlaybookSection(playbook, `${e.code}. ${e.nome}`)).not.toBe("");
    }
  });
  it("mapeia slugs em ordem, sem repetir e ignorando desconhecido", () => {
    expect(mapearOraculo("storytelling", ["davi_e_golias", "heroi_esquecido", "davi_e_golias", "inventado"])).toEqual({ estruturas: ["B1", "A3"] });
    expect(mapearOraculo("storytelling", [])).toEqual({ estruturas: [] });
  });
});

describe("taxonomia: comando", () => {
  it("7 gatilhos com nome do playbook; perguntas e comentário → Pergunta", () => {
    const gatilhos = COMANDO_SLUGS.filter((s) => s.startsWith("gatilho_"));
    expect(gatilhos).toHaveLength(7);
    for (const g of gatilhos) expect(COMANDO_SLUG_TO_NOME[g]).toMatch(/^Gatilho /);
    for (const s of COMANDO_SLUGS.filter((s) => !s.startsWith("gatilho_"))) expect(COMANDO_SLUG_TO_NOME[s]).toBe("Pergunta");
    expect(mapearOraculo("comando", ["pergunta_direta", "gatilho_autoridade", "pergunta_reflexiva"])).toEqual({
      comandos: ["Pergunta", "Gatilho de Autoridade"],
    });
  });
});
