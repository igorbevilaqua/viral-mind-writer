import { appDb } from "@/lib/db";

// As filas que o Kasparov drena (018 §8). Nenhuma ganha tela nova: são assunto entre um turno
// e outro. O A/B não é pouco usado porque é ruim — é pouco usado porque é um destino, e destino
// não é visitado (6 votos em 94 pares).
//
// Nada aqui é reservado, marcado como "oferecido" ou guardado em memória: a pendência só sai da
// fila quando a resposta chega no banco (voto em vm_calibration_votes, active=true no learning).
// Turno que morre sem resposta devolve a mesma pendência no seguinte, de graça.

export type Pendencia =
  | { tipo: "calibracao"; pairId: string; a: string; b: string; restantes: number }
  | {
      tipo: "licao";
      learningId: string;
      titulo: string;
      descricao: string;
      evidencia: string | null;
      restantes: number;
    };

// `skip` é resposta legítima — é um valor de `winner` na tabela, não um erro (§8).
export type Resposta = "a" | "b" | "skip" | "ativar";

export interface LicaoPendente {
  id: string;
  titulo: string;
  descricao: string;
  evidencia: string | null;
}

// Comparação CEGA: o par chega sem eixo, sem origem e sem mecanismo. Isto é o CalibPairView de
// hoje, e é de propósito que não há campo por onde o mecanismo passe.
export interface ParCego {
  id: string;
  a: string;
  b: string;
  restantes: number;
}

// Injeção, e não import: `lib/actions.ts` é `"use server"` (todo export vira endpoint) e já
// contém a seleção do par com a rotação de eixos — que este módulo não pode reimplementar.
// A leitura das lições pendentes não existe em lugar nenhum, então ela é feita aqui, no appDb,
// com um default que os testes substituem.
export interface FilasDeps {
  /** `getNextCalibrationPair` — a seleção e a rotação de eixos continuam sendo dele. */
  proximoPar?: (clientId: string | null) => Promise<ParCego | null>;
  /** `submitCalibrationVote` */
  votar?: (pairId: string, winner: "a" | "b" | "skip", clientId: string | null) => Promise<unknown>;
  /** `setLearningActive` */
  ativarLicao?: (id: string, active: boolean) => Promise<void>;
  licoesPendentes?: (clientId: string | null) => Promise<LicaoPendente[]>;
}

// Extraída e NUNCA ativada: `active = false` e `updated_at = created_at`. A segunda metade é o
// que separa "ninguém olhou ainda" de "o usuário desligou" — setLearningActive carimba
// updated_at, e reoferecer o que a pessoa desligou é a mesma praga que esta task veio matar.
async function licoesPendentesDb(clientId: string | null): Promise<LicaoPendente[]> {
  const { data, error } = await appDb
    .from("vm_lesson_learnings")
    .select("id, titulo, descricao, evidencia, created_at, updated_at, vm_lessons!inner(client_id)")
    .eq("active", false)
    .order("created_at", { ascending: true })
    // ponytail: teto de 50 só para o `restantes` não custar um count(); com fila de 28 sobra.
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((l) => {
      const dono = (Array.isArray(l.vm_lessons) ? l.vm_lessons[0] : l.vm_lessons)?.client_id ?? null;
      return (dono === null || dono === clientId) && l.updated_at === l.created_at;
    })
    .map((l) => ({ id: l.id, titulo: l.titulo, descricao: l.descricao, evidencia: l.evidencia ?? null }));
}

// Fila indisponível não derrota o turno: o Kasparov só não puxa assunto (precedente de context.ts).
async function ouNada<T>(p: Promise<T>, oque: string): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    console.error(`fila ${oque} indisponível, seguindo sem`, e);
    return null;
  }
}

export async function proximaPendencia(clientId: string | null, deps: FilasDeps = {}): Promise<Pendencia | null> {
  const [par, licoes] = await Promise.all([
    deps.proximoPar ? ouNada(deps.proximoPar(clientId), "calibração") : null,
    ouNada((deps.licoesPendentes ?? licoesPendentesDb)(clientId), "lições"),
  ]);

  const candidatas: Pendencia[] = [];
  if (par) candidatas.push({ tipo: "calibracao", pairId: par.id, a: par.a, b: par.b, restantes: par.restantes });
  if (licoes?.length) {
    // uma por vez, sorteada: a fila é ordenada por data, e pegar sempre a primeira transformaria
    // um `skip` em nag eterno na mesma lição.
    const l = licoes[Math.floor(Math.random() * licoes.length)];
    candidatas.push({
      tipo: "licao",
      learningId: l.id,
      titulo: l.titulo,
      descricao: l.descricao,
      evidencia: l.evidencia ?? null,
      restantes: licoes.length,
    });
  }
  if (!candidatas.length) return null;
  // sorteio entre as filas: 94 pares contra 28 lições, e a maior monopolizaria o assunto para
  // sempre se a ordem fosse fixa. Mesma rotação por sorteio que o eixo já usa.
  return candidatas[Math.floor(Math.random() * candidatas.length)];
}

export async function responder(
  p: Pendencia,
  resposta: Resposta,
  clientId: string | null,
  deps: FilasDeps = {}
): Promise<void> {
  if (p.tipo === "calibracao") {
    if (resposta === "ativar") throw new Error("voto de calibração só aceita a, b ou skip");
    await deps.votar?.(p.pairId, resposta, clientId);
    return;
  }
  if (resposta !== "ativar" && resposta !== "skip") throw new Error("lição só aceita ativar ou skip");
  // skip não escreve nada: a lição segue inativa e volta a ser sorteada mais adiante.
  if (resposta === "ativar") await deps.ativarLicao?.(p.learningId, true);
}
