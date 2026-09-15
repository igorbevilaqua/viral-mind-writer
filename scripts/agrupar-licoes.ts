// Agrupa as lições pendentes por TEMA, para responder "quantas vezes o piloto pediu a mesma
// coisa". O tamanho do grupo é a recorrência, e é ela que passa a decidir quais lições ocupam
// as 3 vagas por agente (hoje quem decide é a data de criação, em context.ts).
//
// Agrupamento por EMBEDDING e não por LLM: a primeira versão pedia os grupos a uma chamada de
// sonnet e três execuções devolveram 47, 54 e 86 grupos sobre as mesmas 127 lições. Recorrência
// que muda a cada execução não serve de critério para nada. Cosseno com limiar é determinístico:
// mesma entrada, mesmo número, e o limiar é uma perilla visível em vez de humor do modelo.
// O LLM entra só para BATIZAR os grupos, o que não altera contagem nenhuma.
//
//   npx tsx --env-file=.env.local scripts/agrupar-licoes.ts [--dry-run] [--limiar 0.62]
import OpenAI from "openai";
import { appDb } from "../lib/db";
import { ANALYST_MODEL, trackedCreate } from "../lib/anthropic";
import { toolArray, toolInput } from "../lib/pipeline/agents";

const DRY_RUN = process.argv.includes("--dry-run");
const SWEEP = process.argv.includes("--sweep"); // varre limiares e sai, sem chamar LLM nenhum
const li = process.argv.indexOf("--limiar");
const LIMIAR = li >= 0 ? Number(process.argv[li + 1]) : 0.62; // calibrado por --sweep: acima disso tudo vira grupo de 1, abaixo encadeia num blob
if (!Number.isFinite(LIMIAR)) throw new Error("--limiar precisa de um número");

const EMBED_MODEL = "text-embedding-3-small"; // mesmo de context.ts e do backfill do corpus

function cosseno(a: number[], b: number[]): number {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    ab += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return ab / (Math.sqrt(aa) * Math.sqrt(bb));
}

// União por ligação simples: duas lições acima do limiar caem no mesmo grupo, e a transitividade
// junta a cadeia. É o agrupamento mais simples que existe e não tem parâmetro escondido além do
// limiar. ponytail: single-link basta para 127 itens; se virar milhares, trocar por HDBSCAN.
function agrupar(vetores: number[][], limiar: number): number[] {
  const pai = vetores.map((_, i) => i);
  const raiz = (i: number): number => (pai[i] === i ? i : (pai[i] = raiz(pai[i])));
  for (let i = 0; i < vetores.length; i++) {
    for (let j = i + 1; j < vetores.length; j++) {
      if (cosseno(vetores[i], vetores[j]) >= limiar) pai[raiz(i)] = raiz(j);
    }
  }
  return vetores.map((_, i) => raiz(i));
}

const ROTULOS_TOOL = {
  name: "registrar_rotulos",
  description: "Dá nome a cada grupo de lições já formado e aponta os grupos que se contradizem.",
  input_schema: {
    type: "object" as const,
    properties: {
      rotulos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            grupo: { type: "integer", description: "o número do grupo, como veio na entrada" },
            slug: { type: "string", description: "identificador curto em kebab-case" },
            rotulo: { type: "string", description: "a queixa em uma frase, como o piloto a diria" },
            contradiz: { type: "string", description: "slug de outro grupo que pede o oposto, se houver" },
            testavel: {
              type: "string",
              enum: ["detector", "classificacao", "nao"],
              description:
                "detector = dá para checar no texto de um roteiro com regra determinística; classificacao = só com LLM lendo cada vídeo; nao = julgamento de contexto, não dá para medir no acervo",
            },
          },
          required: ["grupo", "slug", "rotulo", "testavel"],
        },
      },
    },
    required: ["rotulos"],
  },
};

interface Rotulo {
  grupo: number;
  slug: string;
  rotulo: string;
  contradiz?: string;
  testavel: "detector" | "classificacao" | "nao";
}

void (async () => {
  const { data, error } = await appDb
    .from("vm_lesson_learnings")
    .select("id, dimensao, titulo, descricao")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const licoes = data ?? [];
  console.log(`${licoes.length} lições, limiar de cosseno ${LIMIAR}`);

  const openai = new OpenAI();
  // Só o TÍTULO, que é a regra. A `descricao` carrega o exemplo daquele roteiro (Rolls-Royce,
  // Apple, geopolítica) e faz o cosseno medir ASSUNTO em vez de regra: duas lições dizendo
  // "cheque o fato contra a fonte" sobre vídeos diferentes ficavam longe uma da outra.
  const textos = licoes.map((l) => `${l.dimensao}: ${l.titulo}`.slice(0, 8000));
  const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: textos });
  const vetores = emb.data.map((d) => d.embedding);

  if (SWEEP) {
    for (const t of [0.62, 0.66, 0.7, 0.74, 0.78, 0.82, 0.86]) {
      const rs = agrupar(vetores, t);
      const tam = new Map<number, number>();
      rs.forEach((r) => tam.set(r, (tam.get(r) ?? 0) + 1));
      const sizes = [...tam.values()].sort((a, b) => b - a);
      console.log(
        `limiar ${t}: ${sizes.length} grupos, maior ${sizes[0]}, ${sizes.filter((n) => n >= 2).length} com 2+, ${sizes.filter((n) => n === 1).length} sozinhas  [${sizes.slice(0, 8).join(",")}]`
      );
    }
    return;
  }

  const raizes = agrupar(vetores, LIMIAR);
  const porGrupo = new Map<number, number[]>();
  raizes.forEach((r, i) => porGrupo.set(r, [...(porGrupo.get(r) ?? []), i]));
  // Renumera na ordem de tamanho: o grupo 0 é sempre o maior, execução após execução.
  const ordenados = [...porGrupo.values()].sort((a, b) => b.length - a.length || a[0] - b[0]);
  console.log(`${ordenados.length} grupos (maior: ${ordenados[0]?.length ?? 0} lições)`);

  const entrada = ordenados
    .map((idxs, g) => `GRUPO ${g} (${idxs.length} lições)\n${idxs.map((i) => `  - ${licoes[i].titulo}`).join("\n")}`)
    .join("\n\n");

  const res = await trackedCreate(
    undefined,
    "rotular_licoes",
    {
      model: ANALYST_MODEL,
      max_tokens: 16000,
      tools: [ROTULOS_TOOL],
      tool_choice: { type: "tool", name: "registrar_rotulos" },
      system:
        "Você nomeia grupos de aprendizados de um produto que escreve roteiros curtos. Os grupos JÁ ESTÃO FORMADOS: não mude, não junte, não divida. Dê nome a cada um e diga se dá para medir a regra no acervo.\n\nMarque `contradiz` quando dois grupos pedem coisas opostas: é a informação mais valiosa aqui, porque ativar os dois juntos coloca regras brigando no mesmo prompt.",
      messages: [{ role: "user", content: `${entrada}\n\nNomeie os ${ordenados.length} grupos.` }],
    },
    "medium"
  );

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block) throw new Error(`sem saída da tool (stop_reason=${res.stop_reason})`);
  const rotulos = new Map(toolArray<Rotulo>(toolInput(block), "rotulos").map((r) => [r.grupo, r]));

  console.log("");
  for (let g = 0; g < ordenados.length; g++) {
    const r = rotulos.get(g);
    const n = ordenados[g].length;
    if (n < 2 && !r?.contradiz) continue; // grupo de 1 só polui a leitura; vai pro banco do mesmo jeito
    const flags = [r?.testavel && r.testavel !== "nao" ? `testável: ${r.testavel}` : null, r?.contradiz ? `CONTRADIZ ${r.contradiz}` : null]
      .filter(Boolean)
      .join(", ");
    console.log(`${String(n).padStart(3)}x  ${r?.slug ?? `grupo-${g}`}${flags ? `  (${flags})` : ""}\n      ${r?.rotulo ?? "(sem rótulo)"}`);
  }
  const sozinhos = ordenados.filter((g) => g.length === 1).length;
  console.log(`\n${ordenados.length - sozinhos} grupos com 2+ lições, ${sozinhos} lições sem par`);

  if (DRY_RUN) return console.log("\n[dry-run] nada gravado");

  for (let g = 0; g < ordenados.length; g++) {
    const slug = rotulos.get(g)?.slug ?? `grupo-${g}`;
    const ids = ordenados[g].map((i) => licoes[i].id);
    const { error: upErr } = await appDb.from("vm_lesson_learnings").update({ grupo: slug }).in("id", ids);
    if (upErr) throw new Error(`gravar ${slug}: ${upErr.message}`);
  }
  console.log(`\ngravado: ${ordenados.length} grupos em vm_lesson_learnings.grupo`);
})();
