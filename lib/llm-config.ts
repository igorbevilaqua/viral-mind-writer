// O resolvedor: traduz slug de função em id de modelo, lendo a decisão do adm.
//
// Server-only. O catálogo puro, que a tela também lê, é lib/llm-catalogo.ts.
//
// lib/db entra DENTRO das funções, não no topo: este módulo passou a ser importado por quase
// todo agente, e lib/db cria o client do Supabase já no carregamento — no topo, ele faria o
// teste de unidade de qualquer módulo puro exigir as env vars do banco para sequer rodar.
const db = async () => (await import("./db")).appDb;
import { FUNCOES_LLM, funcao, modeloValidoPara, type FuncaoSlug } from "./llm-catalogo";

export type MapaModelos = Record<string, string>;

const PADROES: MapaModelos = Object.fromEntries(FUNCOES_LLM.map((f) => [f.slug, f.padrao]));

// Cache de processo com validade curta. Uma geração chama modeloDe() umas 15 vezes e seria
// absurdo pagar 15 idas ao banco por isso; por outro lado, trocar o modelo na tela e esperar
// o próximo deploy para o efeito aparecer seria uma configuração que não configura. 30s é o
// meio: quem troca vê valendo na geração seguinte, e o caminho quente não toca o banco.
//
// ponytail: cache por processo, não compartilhado. Em serverless cada instância tem o seu, e
// o pior caso é uma instância fria usar o modelo antigo por até 30s depois da troca.
const TTL_MS = 30_000;
let cache: { mapa: MapaModelos; em: number } | null = null;

export function esquecerCacheLLM() {
  cache = null;
}

/** O mapa inteiro, já com os padrões preenchidos para toda função sem decisão gravada. */
export async function modelosConfigurados(): Promise<MapaModelos> {
  if (cache && Date.now() - cache.em < TTL_MS) return cache.mapa;

  const mapa: MapaModelos = { ...PADROES };

  // Config indisponível NÃO derruba geração: os padrões do catálogo são exatamente o que o
  // sistema fazia antes desta tela existir. Try/catch e não só o `error` do supabase porque a
  // falha aqui pode ser a conexão (ou, nos testes, um lib/db sem o client inteiro) — e um
  // throw neste ponto quebraria todo caminho que chama modelo, que é quase todos.
  let data: { funcao: string; modelo: string }[] = [];
  try {
    const r = await (await db())
      .from("vm_config_llm")
      .select("funcao, modelo, created_at")
      .order("created_at", { ascending: false });
    if (r.error) throw new Error(r.error.message);
    data = (r.data ?? []) as { funcao: string; modelo: string }[];
  } catch (e) {
    console.error("vm_config_llm inacessível, usando padrões", e instanceof Error ? e.message : e);
    return mapa;
  }

  // Ordenado do mais novo para o mais velho: a PRIMEIRA linha de cada função é a que vale.
  const vistos = new Set<string>();
  for (const l of data) {
    if (vistos.has(l.funcao)) continue;
    vistos.add(l.funcao);
    // Revalida contra o catálogo: modelo retirado da lista (ou função renomeada) não
    // ressuscita por estar gravado — cai no padrão de hoje.
    const valido = modeloValidoPara(l.funcao, l.modelo);
    if (valido) mapa[l.funcao] = valido;
  }

  cache = { mapa, em: Date.now() };
  return mapa;
}

/** O modelo de uma função. É isto que os call sites chamam. */
export async function modeloDe(slug: FuncaoSlug): Promise<string> {
  const mapa = await modelosConfigurados();
  return mapa[slug] ?? funcao(slug)?.padrao ?? PADROES.escrita;
}

/** Grava a troca. Quem confere se é adm é a server action — aqui já se escreve. */
export async function salvarModelo(slug: string, modeloId: string, userId: string | null) {
  const valido = modeloValidoPara(slug, modeloId);
  if (!valido) throw new Error(`modelo inválido para ${slug}: ${String(modeloId)}`);
  const f = funcao(slug);
  if (!f || "fixo" in f) throw new Error(`função não configurável: ${slug}`);
  const { error } = await (await db())
    .from("vm_config_llm")
    .insert({ funcao: slug, modelo: valido, decidido_por: userId });
  if (error) throw new Error(error.message);
  esquecerCacheLLM();
}
