// Testa lições do /ensinar contra o acervo: a regra que o piloto pediu separa vídeo bom de
// vídeo ruim, ou é gosto?
//
// Régua: `coeficiente_viral` do Oráculo (views sobre a mediana móvel 180d do próprio canal),
// a mesma que o estudo do plano 020 usa. `top` = quartil superior DENTRO do estrato
// (cliente, plataforma), então audiência herdada não decide. Lift com Wilson 95% e
// encolhimento vêm de lib/study-stats, sem régua nova inventada aqui.
//
// Só entram regras que viram DETECTOR: função determinística sobre o texto do roteiro. Lição
// que depende do contexto daquele vídeo não é testável assim, e forçar um detector ruim para
// ela seria pior que não medir.
//
//   npx tsx --env-file=.env.local scripts/testar-licoes.ts
import { appDb, viralData } from "../lib/db";
import { lift, topNoEstrato } from "../lib/study-stats";

const PAGE = 1000;
const MIN_ESTRATO = 8; // estrato menor que isso não tem quartil que preste (mesmo do estudo)

interface Fato {
  video_id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  plataforma: string | null;
  coeficiente_viral: number | null;
  maturando: boolean | null;
}

async function paginar<T>(nome: string, q: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let i = 0; ; i += PAGE) {
    const { data, error } = await q(i, i + PAGE - 1);
    if (error) throw new Error(`${nome}: ${JSON.stringify(error)}`);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

// ── Detectores ───────────────────────────────────────────────────────────────
// Cada um responde "este roteiro SEGUE a regra?". Nome = o grupo de lições que ele testa.
const ABERTURA = 240; // ~as primeiras frases: onde hook e primeira promessa vivem

const DETECTORES: { grupo: string; regra: string; segue: (roteiro: string) => boolean }[] = [
  {
    grupo: "hook-emocional-concreto",
    regra: "abre com número de impacto nas primeiras frases",
    segue: (r) => /\d/.test(r.slice(0, ABERTURA)),
  },
  // NÃO dá para testar `fluidez-corte-enrolacao` aqui. `paragrafosLongos` divide por linha em
  // branco, e `videos.roteiro` é transcrição: a maioria vem com ZERO quebra de linha, então o
  // roteiro inteiro conta como um parágrafo só e 10.602 de 10.618 "reprovam". O número saía
  // parecendo evidência e não era. Testar essa regra exige texto formatado (os roteiros do
  // próprio Codex, em vm_generated_scripts), e lá a amostra ainda é pequena.
  {
    grupo: "estrutura-paradoxo-contraste",
    // Nome próprio no meio da frase: descarta início de frase e a primeira palavra do texto.
    regra: "ancora num personagem/marca nomeada na abertura",
    segue: (r) => /[a-zà-ú,]\s+[A-ZÀ-Ú][a-zà-ú]{2,}/.test(r.slice(0, ABERTURA)),
  },
  {
    grupo: "estrutura-paradoxo-contraste",
    regra: "fala com o espectador na segunda pessoa na abertura",
    segue: (r) => /\b(voc[êe]|te|teu|tua|seu|sua)\b/i.test(r.slice(0, ABERTURA)),
  },
  {
    grupo: "estrutura-paradoxo-contraste",
    regra: "liga causa e consequência com conectivo explícito",
    segue: (r) => (r.match(/\b(porque|por isso|ent[ãa]o|ou seja|resultado|consequ[êe]ncia|isso significa)\b/gi) ?? []).length >= 2,
  },
];

void (async () => {
  // O slug do grupo é batizado por LLM em agrupar-licoes.ts, então pode mudar entre execuções.
  // Detector apontando para grupo inexistente gravaria veredito que nenhuma tela lê. Falha alto.
  const { data: gruposReais } = await appDb.from("vm_lesson_learnings").select("grupo").not("grupo", "is", null);
  const conhecidos = new Set((gruposReais ?? []).map((g) => g.grupo as string));
  const orfaos = [...new Set(DETECTORES.map((d) => d.grupo))].filter((g) => !conhecidos.has(g));
  if (orfaos.length)
    throw new Error(`detector aponta para grupo que não existe em vm_lesson_learnings.grupo: ${orfaos.join(", ")}. Rodar agrupar-licoes.ts de novo renomeia os grupos: reaponte os detectores.`);

  const fatos = await paginar<Fato>("oraculo.fato_video", (a, b) =>
    viralData
      .schema("oraculo")
      .from("fato_video")
      .select("video_id, cliente_id, cliente_nome, plataforma, coeficiente_viral, maturando")
      .order("video_id")
      .range(a, b)
  );
  const roteiros = await paginar<{ id: string; roteiro: string | null }>("videos", (a, b) =>
    viralData.from("videos").select("id, roteiro").not("roteiro", "is", null).order("id").range(a, b)
  );
  const texto = new Map(roteiros.map((v) => [v.id, v.roteiro ?? ""]));

  // Maduro, com métrica, com roteiro, e num estrato grande o bastante para ter quartil.
  const base = fatos
    .filter((f) => !f.maturando && f.coeficiente_viral != null && f.cliente_id && f.plataforma)
    .map((f) => ({ ...f, roteiro: texto.get(f.video_id) ?? "" }))
    .filter((f) => f.roteiro.length > 200);
  const porEstrato = new Map<string, number>();
  for (const f of base) {
    const e = `${f.cliente_id}|${f.plataforma}`;
    porEstrato.set(e, (porEstrato.get(e) ?? 0) + 1);
  }
  const corpus = base.filter((f) => (porEstrato.get(`${f.cliente_id}|${f.plataforma}`) ?? 0) >= MIN_ESTRATO);

  const marcados = topNoEstrato(
    corpus,
    (f) => `${f.cliente_id}|${f.plataforma}`,
    (f) => f.coeficiente_viral!
  );
  console.log(
    `${corpus.length} vídeos maduros com roteiro em ${porEstrato.size} estratos; ${marcados.filter((m) => m.top).length} no quartil superior\n`
  );

  const vereditos: Record<string, unknown>[] = [];
  for (const d of DETECTORES) {
    const rows = marcados.map((m) => ({
      label: d.segue(m.roteiro) ? "segue" : "nao_segue",
      top: m.top,
      cliente: m.cliente_nome,
    }));
    const res = lift(rows).find((r) => r.label === "segue");
    if (!res) {
      console.log(`${d.grupo}: nenhum vídeo segue a regra`);
      continue;
    }
    const n_nao = rows.filter((r) => r.label === "nao_segue").length;
    // O veredito é o LIMITE INFERIOR do IC, não o ponto: lift 1,3 com lb 0,9 não separa nada.
    const vd =
      res.flag !== "ok" ? "amostra_fina" : res.lift_lb > 1 ? "confirma" : res.lift_ub < 1 ? "contraria" : "nao_separa";
    const veredito = { confirma: "CONFIRMA", contraria: "CONTRARIA", nao_separa: "não separa", amostra_fina: "AMOSTRA FINA" }[vd];
    vereditos.push({
      grupo: d.grupo,
      regra: d.regra,
      n_segue: res.n,
      n_nao_segue: n_nao,
      lift: res.lift,
      lift_lb: res.lift_lb,
      lift_ub: res.lift_ub,
      veredito: vd,
      medido_em: new Date().toISOString(),
    });
    console.log(
      `${d.grupo}\n  regra: ${d.regra}\n  seguem ${res.n} vídeos, não seguem ${n_nao}\n` +
        `  lift ${res.lift} (IC ${res.lift_lb} a ${res.lift_ub})  →  ${veredito}` +
        `${res.dominancia > 0.5 ? `  [${Math.round(res.dominancia * 100)}% de um cliente só: ${res.dominante}]` : ""}\n` +
        `  positivo em ${res.consistencia.positivos} de ${res.consistencia.clientes} clientes\n`
    );
  }

  // Grava para o /ensinar mostrar ao lado do botão de ativar. Upsert: o grupo é a chave, e
  // rodar de novo com mais vídeos maduros atualiza o número em vez de empilhar histórico.
  const { error } = await appDb.from("vm_licao_vereditos").upsert(vereditos, { onConflict: "grupo,regra" });
  if (error) throw new Error(`gravar vereditos: ${error.message}`);
  console.log(`${vereditos.length} vereditos gravados em vm_licao_vereditos`);
})();
