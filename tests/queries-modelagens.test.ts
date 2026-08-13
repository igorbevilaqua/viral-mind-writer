import { describe, expect, it, vi } from "vitest";

// queries.ts importa lib/db (client Supabase instanciado no import) — mock vazio basta:
// aqui só rodam as funções puras, sem banco e sem LLM.
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { limparQueries, montarSemente, precisaRegenerar, type VideoCorpus } from "@/lib/modelagens/queries";

const AGORA = new Date("2026-08-13T12:00:00Z");
const diasAtras = (d: number) => new Date(AGORA.getTime() - d * 86_400_000).toISOString();

// Corpus com métrica, no formato real do Caio Lima (cliente SEM linha em
// vm_client_preferences): os títulos de maior view são lixo do coletor e as categorias vêm
// como JSON em string.
const COM_METRICA: VideoCorpus[] = [
  { titulo: "TODO", categorias: ['{"rank":1,"nome":"MARKETING"}'], views: 2_882_787 },
  {
    titulo: "Por que Red Bull vende mais que Monster custando mais caro?",
    categorias: ['{"rank":1,"nome":"MARKETING"}', '{"rank":2,"nome":"NEGÓCIOS"}'],
    views: 1_206_548,
  },
  { titulo: "not_found", categorias: ['{"rank":1,"nome":"NEGÓCIOS"}'], views: 760_813 },
  { titulo: "PORQUE O ATACAREJO", categorias: ["NEGÓCIOS", "MARKETING"], views: 97_620 },
  { titulo: "TE DÁ", categorias: ['{"rank":1,"nome":"PSICOLOGIA"}'], views: 40_356 },
];

// Corpus SEM métrica nenhuma, no formato real do Café com Ferri (nem prefs nem linha em
// vm_video_stats): categoria pura, com o placeholder do coletor no meio.
const SEM_METRICA: VideoCorpus[] = [
  { titulo: "Todo brasileiro", categorias: ["História de Empresa/Empresário"], views: 0 },
  { titulo: "O Silvio Santos transformou imperfeição em império durante 60 anos", categorias: ["MARKETING", "ENTRETENIMENTO"], views: 0 },
  { titulo: "do Silvio", categorias: ["CONTEÚDO INDEFINIDO", "CONTEÚDO INDEFINIDO"], views: 0 },
  { titulo: "O ensino que separa os filhos dos ricos dos filhos dos pobres", categorias: ["Educação", "Carreira"], views: 0 },
];

describe("precisaRegenerar", () => {
  it("regenera sem cache, com cache vencido ou com data corrompida", () => {
    expect(precisaRegenerar(null, AGORA)).toBe(true);
    expect(precisaRegenerar({ search_queries: [], search_queries_em: diasAtras(1) }, AGORA)).toBe(true);
    expect(precisaRegenerar({ search_queries: ["a"], search_queries_em: null }, AGORA)).toBe(true);
    expect(precisaRegenerar({ search_queries: ["a"], search_queries_em: diasAtras(8) }, AGORA)).toBe(true);
    expect(precisaRegenerar({ search_queries: ["a"], search_queries_em: "não é data" }, AGORA)).toBe(true);
  });

  it("aproveita o cache dentro dos 7 dias", () => {
    expect(
      precisaRegenerar({ search_queries: ["leilão de imóvel"], search_queries_em: diasAtras(3), updated_at: diasAtras(40) }, AGORA)
    ).toBe(false);
  });

  it("regenera quando a preferência é mais nova que o cache", () => {
    expect(
      precisaRegenerar({ search_queries: ["a"], search_queries_em: diasAtras(5), updated_at: diasAtras(1) }, AGORA)
    ).toBe(true);
  });

  it("não se autoinvalida quando o próprio write criou a linha", () => {
    // Linha nova: updated_at = now() do banco nasce alguns ms/s depois do
    // search_queries_em = new Date() do app. Sem margem, cada busca pagaria um LLM.
    const em = diasAtras(1);
    const logoDepois = new Date(Date.parse(em) + 800).toISOString();
    expect(precisaRegenerar({ search_queries: ["a"], search_queries_em: em, updated_at: logoDepois }, AGORA)).toBe(false);
  });
});

describe("montarSemente", () => {
  it("pesa pela mediana DO CLIENTE e descarta título-lixo do coletor", () => {
    const s = montarSemente(COM_METRICA, [], 97_620);
    expect(s).toContain("Red Bull");
    expect(s).toMatch(/12\.4x a média dele/); // 1.206.548 / 97.620
    // "TODO" e "not_found" são os dois vídeos MAIS vistos do cliente e ainda assim saem:
    // gerar query a partir deles é gerar busca por "not_found".
    expect(s).not.toContain("not_found");
    expect(s).not.toMatch(/"TODO"/);
    expect(s).not.toContain("TE DÁ");
  });

  it("extrai o nome da categoria nas duas formas que convivem na base", () => {
    const s = montarSemente(COM_METRICA, [], 97_620);
    expect(s).toContain("MARKETING (3 vídeos)"); // 2 em JSON + 1 pura, somadas
    expect(s).not.toContain("rank");
  });

  it("gera semente utilizável só com o corpus, sem preferência nenhuma", () => {
    // Caio Lima e Igor Bevilaqua: corpus com performance, zero linha em prefs.
    const s = montarSemente(COM_METRICA, [], 97_620);
    expect(s).toContain("ACIMA DA MÉDIA DELE");
    expect(s).not.toContain("TEMAS DECLARADOS");
    expect(s.length).toBeGreaterThan(80);
  });

  it("gera semente utilizável com corpus sem métrica alguma", () => {
    // Café com Ferri: 132 vídeos, zero linha em vm_video_stats, zero preferência.
    const s = montarSemente(SEM_METRICA, [], 0);
    expect(s).toContain("cliente sem métrica de views");
    expect(s).toContain("Silvio Santos");
    expect(s).not.toContain("CONTEÚDO INDEFINIDO"); // placeholder do coletor não é tema
    expect(s).not.toContain("Todo brasileiro"); // título-lixo
    expect(s).toContain("MARKETING");
  });

  it("soma a camada declarada quando ela existe", () => {
    const s = montarSemente(COM_METRICA, ["Revisão tributária (metodologia Effect)", "Futebol"], 97_620);
    expect(s).toContain("ACIMA DA MÉDIA DELE");
    expect(s).toContain("TEMAS DECLARADOS PELO CLIENTE");
    expect(s).toContain("Futebol");
  });

  it("passa as proibições adiante, e nunca sozinhas", () => {
    // Sem proibição no prompt, o caçador gera busca em território proibido: crédito gasto
    // para trazer vídeo que o Ideador descarta. suggest.ts já passa esse bloco ao Grok e ao
    // Ideador — a caça tinha ficado de fora.
    const s = montarSemente(COM_METRICA, [], 97_620, ["política partidária", "falar mal de concorrente"]);
    expect(s).toContain("PROIBIÇÕES DO CLIENTE");
    expect(s).toContain("política partidária");
    // Proibição não é semente: sem corpus e sem tema, não há busca a gerar.
    expect(montarSemente([], [], 0, ["política partidária"])).toBe("");
  });

  it("devolve vazio quando não há sinal nenhum", () => {
    expect(montarSemente([], [], 0)).toBe("");
    expect(montarSemente([{ titulo: "TODO", categorias: null, views: 0 }], [], 0)).toBe("");
  });
});

describe("limparQueries", () => {
  it("tira hashtag e aspas, deduplica sem diferenciar caixa e corta o que é curto demais", () => {
    expect(limparQueries(["#empresasQueFaliram", "empresas que faliram", "Empresas Que Faliram", '"leilão da Caixa"', "ok", ""])).toEqual([
      "empresasQueFaliram",
      "empresas que faliram",
      "leilão da Caixa",
    ]);
  });
});
