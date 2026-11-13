// Plano 027: o /modelagem em três passos.
//   1. leitura  — o MAPA do vídeo: blocos, peças que carregam cada um, pedidos de reforço.
//   2. pesquisa — só os reforços que a leitura pediu (0 a 3), em paralelo.
//   3. escrita  — a partir do mapa, SEM a transcrição: quem escreve olhando a frase do outro
//                 parafraseia. O conteúdo vai inteiro no mapa; a redação do original não vai.
import { trackedCreate, type UsageLog } from "../anthropic";
import { modeloDe } from "../llm-config";
import { agentPrompt } from "../pipeline/agents";
import { grokPesquisa } from "../pipeline/grok-search";
import { lerVideo } from "./leitura";
import { palavras, partirBlocos, type Leitura, type Reforco } from "./leitura-schema";

// ponytail: uma pesquisa por roteiro. Na prova de 12/11/2026 cada busca no Grok 4.7 saiu por
// cerca de US$ 0,50 e 60 s; subir para 2 quando a busca ficar barata (modelo menor ou teto de páginas).
const MAX_REFORCOS = 1;

export interface ReforcoPesquisado extends Reforco {
  resultado: string;
  fontes: string[];
}

export interface Modelagem {
  leitura: Leitura;
  reforcos: ReforcoPesquisado[];
  hooks: { tipo: string; texto: string }[];
  /** bloco da leitura (ordem) → texto novo. O bloco 1 é o hook recomendado. */
  blocos: Record<number, string>;
  mudancas: string;
  /** hook recomendado + blocos, na ordem: o que se mede e o que se grava. */
  roteiro: string;
  /** o original sem os blocos que não ficam (venda, CTA): a régua justa dos portões. */
  originalQueFica: string;
}

const secao = (texto: string, nome: string) =>
  texto.match(new RegExp(`## ${nome}\\s*\\n([\\s\\S]*?)(?=\\n## [A-Z]|$)`))?.[1]?.trim() ?? "";

/** O que o escritor recebe. Leva o conteúdo de cada bloco e nunca o `trecho` literal. */
export function montarMapa(l: Leitura, reforcos: ReforcoPesquisado[], direcao = ""): string {
  const ficam = l.beats.filter((b) => b.fica);
  const blocos = ficam.map((b) => {
    const pecas = l.ativos.filter((a) => a.beat === b.ordem);
    return [
      `B${b.ordem} | ${b.funcao} | cerca de ${palavras(b.trecho)} palavras`,
      `diz: ${b.ideia}`,
      `sente: ${b.sente}`,
      pecas.length ? `peças:\n${pecas.map((a) => `- (${a.tipo}, ${a.destino}${a.checar ? ", fato" : ""}) ${a.texto}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return [
    direcao.trim() && `DIREÇÃO DO USUÁRIO:\n${direcao.trim()}`,
    `PREMISSA: ${l.premissa}`,
    `EMOÇÃO: ${l.emocao.predominante} | MOTOR: ${l.emocao.motor}`,
    `TOM: ${l.tom}`,
    `HOOK ORIGINAL: promessa: ${l.hook.promessa} | mecanismo: ${l.hook.mecanismo}`,
    `BLOCOS (o B1 é o hook):\n\n${blocos.join("\n\n")}`,
    l.palavras_dificeis.length && `PALAVRAS DIFÍCEIS:\n${l.palavras_dificeis.map((p) => `- ${p.termo} → ${p.troca}`).join("\n")}`,
    reforcos.length
      ? `REFORÇOS PESQUISADOS:\n\n${reforcos
          .map((r, i) => `R${i + 1} | para o B${r.beat} | função: ${r.funcao} | ${r.por_que}\npergunta: ${r.pergunta}\nresultado: ${r.resultado}`)
          .join("\n\n")}`
      : "REFORÇOS PESQUISADOS: nenhum.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function modelar(transcricao: string, direcao = "", log?: UsageLog): Promise<Modelagem> {
  const leitura = await lerVideo(transcricao, direcao, log);

  const reforcos = await Promise.all(
    leitura.reforcos.slice(0, MAX_REFORCOS).map(async (r): Promise<ReforcoPesquisado> => {
      try {
        const p = await grokPesquisa(r.pergunta, log, "modelagem_reforco");
        const citadas = p.fontes.filter((u) => p.texto.includes(u));
        return { ...r, resultado: p.texto.trim() || "(sem resultado)", fontes: citadas.length ? citadas : p.fontes.slice(0, 3) };
      } catch (e) {
        console.error("pesquisa de reforço falhou, seguindo sem ela", e);
        return { ...r, resultado: "(a pesquisa falhou; não use este reforço)", fontes: [] };
      }
    })
  );

  const res = await trackedCreate(log, "modelador", {
    model: await modeloDe("escrita"),
    max_tokens: 16000,
    system: agentPrompt("modelador"),
    messages: [{ role: "user", content: montarMapa(leitura, reforcos, direcao) }],
  });
  const texto = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");

  const hooks = [...secao(texto, "HOOKS").matchAll(/^\d\.\s*\[([^\]]*)\]\s*(.+)$/gm)].map((m) => ({
    tipo: m[1],
    texto: m[2].replace(/\s*\(\d+ palavras\)\s*$/, "").trim(),
  }));
  const blocos = partirBlocos(secao(texto, "ROTEIRO"));
  if (hooks[0]) blocos[1] = hooks[0].texto;
  const ficam = leitura.beats.filter((b) => b.fica);
  if (!hooks.length || Object.keys(blocos).length < 2)
    throw Object.assign(new Error("O escritor não devolveu hooks e blocos no formato esperado. Tente de novo."), {
      debug: { step: "modelador", texto: texto.slice(0, 2000) },
    });

  return {
    leitura,
    reforcos,
    hooks,
    blocos,
    mudancas: secao(texto, "MUDANCAS"),
    roteiro: ficam.map((b) => blocos[b.ordem]).filter(Boolean).join("\n\n"),
    originalQueFica: ficam.map((b) => b.trecho).join(" "),
  };
}
