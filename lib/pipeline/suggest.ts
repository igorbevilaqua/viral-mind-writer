import { appDb, viralData } from "../db";
import { anthropic, ANALYST_MODEL } from "../anthropic";
import { grokClient, RESEARCH_MODEL } from "../grok";
import { cacarModelagens, type ModelagemSugerida } from "../modelagens/cacar";
import { fmtNum } from "../format";
import { agentPrompt, clientInsightBlock, toolInput, toolArray } from "./agents";
import type { GenerationContext } from "./types";

// Teto da caça: a rota tem maxDuration de 120s e a síntese vem depois dela.
const TETO_CACA_MS = 60_000;

// Ideador: sugere temas com alto potencial de viralização para um cliente,
// cruzando padrões validados (insights), hits de clientes afins e pesquisa fresca (Grok).

export interface ThemeSuggestion {
  tema: string;
  // A tese que o vídeo defenderia, 1-2 frases. Vai direto para o campo Premissa do formulário
  // quando o usuário aplica o tema — é a segunda das três fontes de premissa do sistema.
  premissa: string;
  angulo_narrativo: string;
  forma_abordagem: string;
  estrutura_sugerida: string;
  gancho_potencial: string;
  por_que_para_este_cliente: string;
  informacoes_de_apoio: string[];
  // `url` vem do código (RPC), nunca do modelo: hit interno também vira modelagem num clique.
  reaproveitado_de?: { cliente_origem: string; titulo: string; views: number; url?: string | null } | null;
  // Vídeo EXTERNO que já performou, escolhido pelo rank.ts. O Ideador só associa o índice;
  // todos os números aqui são de código.
  modelagem_sugerida?: {
    url: string;
    plataforma: string;
    autor: string;
    views: number;
    ratio: number;
    timing_classe: string | null;
  } | null;
  // Só trafega entre o parse e a associação — removido antes de emitir.
  modelagem_indice?: number | null;
}

export type SuggestEvent =
  | { type: "phase"; phase: "dados" | "caca" | "pesquisa" | "sintese" }
  | { type: "done"; sugestoes: ThemeSuggestion[] }
  | { type: "error"; message: string };

interface CrossHit {
  titulo: string;
  assunto: string | null;
  tema: string;
  cliente_origem: string;
  views: number;
  data_publicacao: string;
  storytelling_tipo: string | null;
  hook_tipo: string | null;
  vm_script: boolean;
  // Chega só depois da migration 0026; até lá fica undefined e o card não ganha o botão.
  link_video?: string | null;
}

const SUGESTOES_TOOL = {
  name: "registrar_sugestoes",
  description: "Registra as sugestões de tema para o cliente.",
  input_schema: {
    type: "object" as const,
    properties: {
      sugestoes: {
        type: "array",
        minItems: 4,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            tema: { type: "string" },
            premissa: {
              type: "string",
              description:
                "A TESE que este vídeo defenderia, em 1-2 frases AFIRMATIVAS: o que o espectador " +
                "passa a acreditar ao final. Não é o assunto, é a afirmação sobre o assunto, e " +
                "precisa ser contestável. Nunca formule pela negação ('não é X, é Y').",
            },
            angulo_narrativo: { type: "string" },
            forma_abordagem: { type: "string" },
            estrutura_sugerida: { type: "string" },
            gancho_potencial: { type: "string" },
            por_que_para_este_cliente: { type: "string" },
            informacoes_de_apoio: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
            reaproveitado_de: {
              type: ["object", "null"],
              properties: {
                cliente_origem: { type: "string" },
                titulo: { type: "string" },
                views: { type: "number" },
              },
              required: ["cliente_origem", "titulo", "views"],
            },
            modelagem_indice: {
              type: ["number", "null"],
              description:
                "Número do MODELO EXTERNO ([M3] → 3) que esta pauta poderia modelar, ou null se " +
                "nenhum encaixa. Só associação: a lista já vem rankeada por código, não reordene.",
            },
          },
          required: [
            "tema",
            "premissa",
            "angulo_narrativo",
            "forma_abordagem",
            "estrutura_sugerida",
            "gancho_potencial",
            "por_que_para_este_cliente",
            "informacoes_de_apoio",
          ],
        },
      },
    },
    required: ["sugestoes"],
  },
};

const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * O modelo escolheu o PAR; o código põe os números. Nada de URL, views ou ratio saindo do
 * LLM: índice fora da faixa vira `null` em vez de vídeo inventado, e a URL do hit interno
 * vem da RPC pelo título. Muta as sugestões no lugar (é o último passo antes de emitir).
 */
export function associarModelagens(
  sugestoes: ThemeSuggestion[],
  modelagens: ModelagemSugerida[],
  hits: Pick<CrossHit, "titulo" | "link_video">[]
): void {
  const urlPorTitulo = new Map(hits.filter((h) => h.link_video).map((h) => [norm(h.titulo), h.link_video as string]));
  const usados = new Set<number>();
  for (const s of sugestoes) {
    const i = (typeof s.modelagem_indice === "number" ? s.modelagem_indice : 0) - 1;
    const m = Number.isInteger(i) && i >= 0 && !usados.has(i) ? modelagens[i] : undefined;
    if (m) usados.add(i); // dois cards com o mesmo vídeo é ruído, não reforço
    s.modelagem_sugerida = m
      ? {
          url: m.url,
          plataforma: m.plataforma,
          autor: m.autor,
          views: m.views,
          ratio: m.ratio,
          timing_classe: m.timing_classe,
        }
      : null;
    delete s.modelagem_indice;
    if (s.reaproveitado_de) s.reaproveitado_de.url = urlPorTitulo.get(norm(s.reaproveitado_de.titulo)) ?? null;
  }
}

export async function suggestThemes(clientId: string, emit: (e: SuggestEvent) => void): Promise<void> {
  try {
    emit({ type: "phase", phase: "dados" });
    const [clienteRes, prefsRes, insightsRes, hitsRes] = await Promise.all([
      appDb.from("clientes").select("nome").eq("id", clientId).single(),
      appDb
        .from("vm_client_preferences")
        .select("proibicoes, tom_de_voz, temas_preferidos, vocabulario_evitar")
        .eq("client_id", clientId)
        .maybeSingle(),
      appDb
        .from("vm_viral_insights")
        .select("insight_type, scope, payload")
        .eq("scope", `client:${clientId}`)
        .like("insight_type", "client_%"),
      viralData.rpc("vm_cross_client_hits", { p_cliente_id: clientId, p_limit: 12 }),
    ]);
    if (clienteRes.error || !clienteRes.data) throw new Error("cliente não encontrado");

    const nome = clienteRes.data.nome;
    const prefs = prefsRes.data;
    const hits = (hitsRes.data ?? []) as CrossHit[];

    // clientInsightBlock só precisa de ctx.insights — contexto mínimo
    const ctx = { insights: insightsRes.data ?? [] } as GenerationContext;
    const validados = [
      clientInsightBlock(ctx, ["tema", "storytelling"], 8),
      clientInsightBlock(ctx, ["hook"], 4),
      clientInsightBlock(ctx, ["geral"], 4),
    ]
      .filter(Boolean)
      .join("\n");

    const nicho = [
      ...(prefs?.temas_preferidos ?? []),
      ...ctx.insights
        .filter((i) => i.insight_type === "client_tema")
        .map((i) => (i.payload as { tipo?: string }).tipo)
        .filter(Boolean),
    ].join(", ");

    // ── Caça de modelagens ∥ pesquisa fresca (Grok) — as duas fail-soft ──
    // Em paralelo de propósito: a rota tem maxDuration de 120s e a síntese ainda vem
    // depois. A caça não transcreve nada e tem teto próprio de tempo; se estourar, a
    // sugestão sai sem vídeo externo, que é degradação e não erro.
    emit({ type: "phase", phase: "caca" });
    const cacaP = cacarModelagens(clientId, { sinal: AbortSignal.timeout(TETO_CACA_MS) })
      .catch((e) => {
        console.error("caça de modelagens falhou, sugestão segue sem vídeo externo", e);
        return [] as ModelagemSugerida[];
      })
      // A pesquisa é o lado longo do paralelo: quando a caça termina, a copy passa a ser dela.
      .then((r) => {
        emit({ type: "phase", phase: "pesquisa" });
        return r;
      });

    const pesquisaP = (async () => {
      try {
        const res = await grokClient().responses.create({
          model: RESEARCH_MODEL,
          instructions: agentPrompt("ideador-pesquisa"),
          input: `CLIENTE: ${nome}
NICHO / TEMAS FORTES: ${nicho || "(não mapeado — use temas de negócios/economia/atualidades do Brasil)"}
${prefs?.proibicoes?.length ? `PROIBIÇÕES DO CLIENTE (não sugerir nada que esbarre nisso): ${prefs.proibicoes.join("; ")}` : ""}

Traga as oportunidades de pauta.`,
          tools: [{ type: "web_search" }] as never,
        });
        return res.output_text ?? "";
      } catch (e) {
        console.error("pesquisa de pautas falhou, seguindo só com dados internos", e);
        return "";
      }
    })();

    const [modelagens, pesquisa] = await Promise.all([cacaP, pesquisaP]);

    // ── Síntese (diretor de pauta) ──
    emit({ type: "phase", phase: "sintese" });
    const res = await anthropic.messages.create({
      model: ANALYST_MODEL,
      max_tokens: 6000, // thinking divide o teto — 4000 truncava o tool_use
      tools: [SUGESTOES_TOOL],
      tool_choice: { type: "tool", name: "registrar_sugestoes" },
      system: [{ type: "text", text: agentPrompt("ideador"), cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `CLIENTE: ${nome}${prefs?.tom_de_voz ? ` | Tom: ${prefs.tom_de_voz}` : ""}
${prefs?.proibicoes?.length ? `PROIBIÇÕES (INVIOLÁVEIS): ${prefs.proibicoes.join("; ")}` : ""}

1. PADRÕES VALIDADOS DO CLIENTE (pré-rankeados por performance + recência):
${validados || "(sem insights materializados — rode o ETL; aposte no nicho declarado)"}

2. HITS DE CLIENTES AFINS (mesmos temas, views comprovadas — arquiteturas reaproveitáveis;
itens PRODUÇÃO VM são roteiros nossos publicados — dê peso principal a esses padrões):
${
  hits.length
    ? hits
        .map(
          (h) =>
            `- [${h.tema}]${h.vm_script ? " [PRODUÇÃO VM]" : ""} "${h.titulo}" (${h.cliente_origem}, ${Math.round(h.views / 1_000_000)}M views, ${h.data_publicacao})${h.storytelling_tipo ? ` · estrutura: ${h.storytelling_tipo}` : ""}${h.hook_tipo ? ` · hook: ${h.hook_tipo}` : ""}${h.assunto ? `\n  assunto: ${h.assunto.slice(0, 200)}` : ""}`
        )
        .join("\n")
    : "(nenhum hit cruzado encontrado)"
}

3. PESQUISA FRESCA (oportunidades de pauta de agora):
${pesquisa || "(pesquisa indisponível — ancore nas fontes 1 e 2 e diga isso no por_que)"}

4. MODELOS EXTERNOS (vídeos de fora da casa que estouraram a própria audiência, JÁ RANKEADOS
por código — não reordene; só diga em modelagem_indice qual serve para qual pauta, ou null):
${
  modelagens.length
    ? modelagens
        .map(
          (m, i) =>
            `[M${i + 1}] @${m.autor} (${m.plataforma}) · ${fmtNum(m.views)} views · ${m.ratio}x a própria audiência${m.timing_classe ? ` · ${m.timing_classe}` : ""}\n  ${(m.caption || "(sem legenda)").replace(/\s+/g, " ").slice(0, 220)}`
        )
        .join("\n")
    : "(nenhum modelo externo desta vez — use modelagem_indice null em todas)"
}

Proponha as sugestões de tema.`,
        },
      ],
    });

    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("ideador: sem sugestões estruturadas");
    const sugestoes = toolArray<ThemeSuggestion>(toolInput(toolUse), "sugestoes").filter(
      (x): x is ThemeSuggestion => !!x?.tema && !!x?.angulo_narrativo && Array.isArray(x?.informacoes_de_apoio)
    );
    if (!sugestoes.length) {
      console.error(
        `ideador vazio — stop_reason=${res.stop_reason} input=${JSON.stringify(toolUse.input).slice(0, 500)}`
      );
      throw new Error("ideador: nenhuma sugestão válida");
    }

    associarModelagens(sugestoes, modelagens, hits);

    emit({ type: "done", sugestoes });
  } catch (e) {
    emit({ type: "error", message: e instanceof Error ? e.message : String(e) });
  }
}
