"use client";

// Dialog de três modos da sessão (015 §7): Por quê? · Mudar · Ensinar.
// Hook `{abrir, dialog}` no padrão do useClassVideosDialog — é chamado de três pontos da
// tela (popover em leitura, popover em edição, header do ScriptCard).

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  classificarTexto,
  explicarTrecho,
  getLearning,
  gravarEnsinamento,
  setLearningActive,
  updateLearning,
} from "@/lib/actions";
import type { Casa, Direcao, Ensinamento } from "@/lib/pipeline/classify-teaching";
import type { Explicacao } from "@/lib/pipeline/explain";
import type { PropostaDeDestilacao } from "@/lib/pipeline/kasparov";
import type { Etapa } from "@/lib/provenance";
import { DESTINATARIOS } from "@/lib/pipeline/destinatarios";
import {
  CASA_LABEL,
  DIRECAO_LABEL,
  casaFinal,
  precisaDirecao,
  precisaPadrao,
  textoCruEditavel,
  textoNaoDeterminado,
  type Escopo,
} from "@/lib/ensino-ui";
import { preview, validarPadrao } from "@/lib/regex-safety";

export type TeachModo = "porque" | "mudar" | "ensinar";

export interface TeachDialogArgs {
  scriptId: string;
  sessionId: string;
  clientId: string | null;
  /** roteiro aberto na tela — é contra ele que o preview do regex roda (§5.1). */
  roteiro: string;
  /**
   * Procedência quando o ensino NÃO nasceu numa sessão: `origemDoDebate(threadId)` do Kasparov
   * (018 §5.3). Sem isto a gravação cai na guarda de procedência de `gravarEnsinamento` e
   * devolve erro — de propósito: falha visível em vez de `/sessions/` inventado.
   */
  sourceUrl?: string;
  /** O modo "Mudar" é o Bob de hoje, que vive dentro do session-view. Ver comentário abaixo. */
  onMudar: (trecho: string) => void;
}

const CASAS_UI = Object.keys(CASA_LABEL) as Casa[];
const DIRECOES_UI = Object.keys(DIRECAO_LABEL) as Direcao[];

const ETAPA_SELO: Record<Etapa, string> = {
  roteirista: "o roteirista escreveu isto",
  revisao: "o revisor reescreveu isto",
  humanizacao: "o humanizador reescreveu isto",
  pos_save: "uma edição posterior à geração produziu isto",
};

const chipCls = (on: boolean) =>
  `rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
    on
      ? "border-gold/60 bg-gold/[.12] text-gold"
      : "border-white/15 text-white/50 hover:border-white/35 hover:text-white/80"
  }`;

const inputCls =
  "w-full rounded-[10px] border border-white/[.14] bg-transparent px-3 py-2 text-[13px] text-cream outline-none placeholder:text-white/30 focus:border-gold/40";

const Rotulo = ({ children }: { children: ReactNode }) => (
  <div className="kicker text-white/35 text-[10px] mb-1.5">{children}</div>
);

export function useTeachDialog(args: TeachDialogArgs) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // `n` reseta o painel a cada abertura (key), sem um useEffect de limpeza.
  const [sessao, setSessao] = useState<{
    n: number;
    modo: "porque" | "ensinar";
    trecho: string;
    referenciaId?: string;
    proposta?: PropostaDeDestilacao;
  } | null>(null);

  // `proposta` só vem do Kasparov: é a síntese dele, que entra no campo "Você disse" EDITÁVEL
  // (018 §5.1). Sem ela o caminho é o de sempre — o usuário digita, e o que ele digitou é literal.
  const abrir = (modo: TeachModo, trecho?: string, proposta?: PropostaDeDestilacao) => {
    // ponytail: "Mudar" é o BobModal que já existe DENTRO de session-view.tsx, sem export.
    // Mover ou duplicar o Bob para cá seria reescrever uma tela que funciona; o dialog só
    // devolve o trecho e quem liga no Bob é o call site (Task 11).
    if (modo === "mudar") {
      args.onMudar(trecho ?? "");
      return;
    }
    setSessao((s) => ({ n: (s?.n ?? 0) + 1, modo, trecho: trecho ?? "", proposta }));
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  };

  const fechar = () => dialogRef.current?.close();

  const dialog = (
    /* <dialog> nativo (padrão do report-problem): Esc e backdrop fecham de graça */
    <dialog
      ref={dialogRef}
      onClose={() => setSessao(null)}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(560px,92vw)] max-h-[85dvh] overflow-y-auto rounded-2xl border border-gold/30 bg-[#161410] text-[#ededf0] p-0 shadow-2xl"
    >
      {sessao && (
        <div key={sessao.n} className="p-5 sm:p-6 space-y-4">
          {sessao.modo === "porque" ? (
            <PorqueView
              scriptId={args.scriptId}
              trecho={sessao.trecho}
              onFechar={fechar}
              onEnsinar={(referenciaId) =>
                setSessao((s) => (s ? { ...s, modo: "ensinar", referenciaId } : s))
              }
            />
          ) : (
            <EnsinarView
              args={args}
              trecho={sessao.trecho}
              referenciaId={sessao.referenciaId}
              proposta={sessao.proposta}
              onFechar={fechar}
            />
          )}
        </div>
      )}
    </dialog>
  );

  return { abrir, dialog };
}

function Cabecalho({ titulo, onFechar }: { titulo: string; onFechar: () => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="kicker text-gold">{titulo}</span>
      <button
        onClick={onFechar}
        aria-label="Fechar"
        className="ml-auto text-white/40 hover:text-white/80 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

const Trecho = ({ texto }: { texto: string }) =>
  texto ? (
    <p className="rounded-[10px] border border-white/[.08] bg-white/[.03] px-3 py-2 text-[12.5px] italic leading-relaxed text-white/60">
      &ldquo;{texto}&rdquo;
    </p>
  ) : null;

// ── Modo "Por quê" (§7.2) ────────────────────────────────────────────────────
function PorqueView({
  scriptId,
  trecho,
  onEnsinar,
  onFechar,
}: {
  scriptId: string;
  trecho: string;
  onEnsinar: (referenciaId?: string) => void;
  onFechar: () => void;
}) {
  const [exp, setExp] = useState<Explicacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [corrigindo, setCorrigindo] = useState(false);

  useEffect(() => {
    let vivo = true;
    explicarTrecho(scriptId, trecho)
      .then((e) => vivo && setExp(e))
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : String(e)));
    return () => {
      vivo = false;
    };
  }, [scriptId, trecho, tentativa]);

  const licaoId = exp?.referencia?.tipo === "licao" ? exp.referencia.id : null;

  return (
    <>
      <Cabecalho titulo="POR QUÊ" onFechar={onFechar} />
      <Trecho texto={trecho} />

      {erro ? (
        <div className="space-y-2">
          <p className="text-[13px] text-red-300">{erro}</p>
          <button
            onClick={() => {
              setErro(null);
              setTentativa((t) => t + 1);
            }}
            className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold"
          >
            Tentar de novo
          </button>
        </div>
      ) : !exp ? (
        <p className="text-[13px] text-white/40 animate-pulse">Consultando o rastro…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10.5px] text-white/60">
              {ETAPA_SELO[exp.etapa]}
            </span>
            {exp.referencia && (
              <button
                type="button"
                onClick={() => licaoId && setCorrigindo(true)}
                disabled={!licaoId}
                className={`rounded-full border border-gold/40 bg-gold/[.08] px-2.5 py-0.5 text-[10.5px] text-gold ${
                  licaoId ? "hover:border-gold/80" : "cursor-default opacity-70"
                }`}
              >
                {exp.referencia.tipo}: {exp.referencia.id}
              </button>
            )}
          </div>

          <p className="text-[13.5px] leading-relaxed text-white/80">
            {exp.causa === "nao_determinado" ? textoNaoDeterminado(exp.explicacao) : exp.explicacao}
          </p>

          {corrigindo && licaoId ? (
            <CorrigirLicao id={licaoId} onFechar={() => setCorrigindo(false)} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEnsinar(exp.referencia?.id)}
                className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold"
              >
                Ensinar algo sobre isto
              </button>
              {licaoId && (
                <button
                  onClick={() => setCorrigindo(true)}
                  className="rounded-[10px] border border-white/15 px-4 py-2 text-[13px] text-white/70 hover:border-white/35 hover:text-white"
                >
                  Corrigir esta lição
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

// Edição inline da lição culpada: as duas actions já existem e são as mesmas que o /ensinar usa.
function CorrigirLicao({ id, onFechar }: { id: string; onFechar: () => void }) {
  const [l, setL] = useState<{ titulo: string; descricao: string; active: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let vivo = true;
    getLearning(id)
      .then((r) => vivo && (r ? setL(r) : setErro("lição não encontrada")))
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : String(e)));
    return () => {
      vivo = false;
    };
  }, [id]);

  const rodar = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      setErro(null);
      try {
        await fn();
        setSalvo(true);
      } catch (e) {
        setErro(e instanceof Error ? e.message : String(e));
      }
    });

  if (erro && !l) return <p className="text-[13px] text-red-300">{erro}</p>;
  if (!l) return <p className="text-[13px] text-white/40 animate-pulse">Abrindo a lição…</p>;

  return (
    <div className="space-y-2 rounded-[12px] border border-white/[.1] p-3">
      <Rotulo>CORRIGIR A LIÇÃO</Rotulo>
      <input value={l.titulo} onChange={(e) => setL({ ...l, titulo: e.target.value })} className={inputCls} />
      <textarea
        value={l.descricao}
        onChange={(e) => setL({ ...l, descricao: e.target.value })}
        rows={3}
        className={`${inputCls} resize-y`}
      />
      {erro && <p className="text-[12px] text-red-300">{erro}</p>}
      {salvo && <p className="text-[12px] text-emerald-300">Salvo — vale da próxima geração.</p>}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={pending || !l.titulo.trim() || !l.descricao.trim()}
          onClick={() => rodar(() => updateLearning(id, { titulo: l.titulo, descricao: l.descricao }))}
          className="btn-gold rounded-[9px] px-3.5 py-1.5 text-[12px] font-semibold disabled:opacity-40"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          disabled={pending}
          onClick={() =>
            rodar(async () => {
              await setLearningActive(id, !l.active);
              setL({ ...l, active: !l.active });
            })
          }
          className="rounded-[9px] border border-white/15 px-3.5 py-1.5 text-[12px] text-white/60 hover:text-white disabled:opacity-40"
        >
          {l.active ? "Desativar lição" : "Reativar lição"}
        </button>
        <button onClick={onFechar} className="ml-auto text-[12px] text-white/40 hover:text-white/80">
          voltar
        </button>
      </div>
    </div>
  );
}

// ── Modo "Ensinar" (§7.4) ────────────────────────────────────────────────────
function EnsinarView({
  args,
  trecho,
  referenciaId,
  proposta,
  onFechar,
}: {
  args: TeachDialogArgs;
  trecho: string;
  referenciaId?: string;
  proposta?: PropostaDeDestilacao;
  onFechar: () => void;
}) {
  // `texto` NUNCA é limpo por erro: é o que o usuário digitou (§8) — ou, vindo do Kasparov, a
  // síntese dele, que o usuário confirma ou reescreve antes de virar context_note (018 §5.1).
  const [texto, setTexto] = useState(proposta?.sintese ?? "");
  const editavel = textoCruEditavel(proposta?.origem ?? "usuario");
  const [ens, setEns] = useState<Ensinamento | null>(null);
  const [escopo, setEscopo] = useState<Escopo>(args.clientId ? "cliente" : "global");
  const [classificando, setClassificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startSave] = useTransition();

  const classificar = () => {
    setErro(null);
    setClassificando(true);
    classificarTexto({ texto, trecho: trecho || undefined, referenciaId, clientId: args.clientId })
      .then((r) => (r.ok ? setEns(r.ensinamento) : setErro(r.erro)))
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setClassificando(false));
  };

  if (salvo)
    return (
      <>
        <Cabecalho titulo="ENSINAR" onFechar={onFechar} />
        <p className="text-[13.5px] text-emerald-300">Gravado. Vale da próxima geração.</p>
        <button onClick={onFechar} className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold">
          Fechar
        </button>
      </>
    );

  if (!ens)
    return (
      <>
        <Cabecalho titulo="ENSINAR" onFechar={onFechar} />
        <Trecho texto={trecho} />
        {editavel && (
          <p className="text-[12px] text-white/45">
            Esta frase é do Kasparov, não sua. Reescreva do seu jeito antes de continuar — é ela que fica registrada.
          </p>
        )}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          autoFocus
          placeholder="O que você quer que o sistema aprenda? Escreva do seu jeito."
          className={`${inputCls} resize-y`}
        />
        {erro && (
          <p className="text-[12.5px] text-red-300">
            Não consegui entender agora — {erro}. Seu texto continua aí; tente de novo.
          </p>
        )}
        <button
          onClick={classificar}
          disabled={classificando || !texto.trim()}
          className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
        >
          {classificando ? "Entendendo…" : erro ? "Tentar de novo" : "Continuar"}
        </button>
      </>
    );

  // ── painel de confirmação ──
  const casaF = casaFinal(ens.casa, escopo);
  const mostraPadrao = precisaPadrao(ens.casa, escopo);
  const vPadrao = mostraPadrao ? validarPadrao(ens.padrao ?? "") : null;
  const casos = mostraPadrao && vPadrao?.ok ? preview(ens.padrao ?? "", args.roteiro) : [];
  const faltaDestinatario = casaF === "licao" && !ens.destinatarios.length;
  // Vocabulário sem direção grava na lista oposta à ensinada: o portão é aqui (pendência 10).
  const mostraDirecao = precisaDirecao(ens.casa, escopo);
  const faltaDirecao = mostraDirecao && (!ens.direcao || !ens.termo?.trim());
  // `texto` entra em podeConfirmar porque no caminho do Kasparov ele é editável: esvaziado,
  // gravaria context_note em branco — a auditoria da peça 1 sem a frase que a justifica.
  const podeConfirmar =
    !!texto.trim() && !!ens.regra.trim() && !faltaDestinatario && !faltaDirecao && (!mostraPadrao || !!vPadrao?.ok);

  const confirmar = () =>
    startSave(async () => {
      setErro(null);
      const r = await gravarEnsinamento({
        ...ens,
        textoCru: texto,
        escopo,
        sessionId: args.sessionId,
        clientId: args.clientId,
        sourceUrl: args.sourceUrl,
      });
      // Falha de gravação não descarta nada: o painel inteiro continua na tela (§8).
      if (r.ok) setSalvo(true);
      else setErro(r.erro ?? "não consegui gravar — tente de novo");
    });

  return (
    <>
      <Cabecalho titulo="ENSINAR" onFechar={onFechar} />

      <div>
        <Rotulo>{editavel ? "VOCÊ DISSE (nas palavras do Kasparov — corrija)" : "VOCÊ DISSE"}</Rotulo>
        {editavel ? (
          // A síntese é do Kasparov e ainda não é fala de ninguém: o que for gravado em
          // context_note é o que o humano deixar aqui (018 §5.1).
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            className={`${inputCls} resize-y italic`}
          />
        ) : (
          /* literal e não editável: é assim que o usuário confere se foi compreendido (§7.4) */
          <p className="whitespace-pre-wrap rounded-[10px] border border-white/[.08] bg-white/[.03] px-3 py-2 text-[12.5px] italic leading-relaxed text-white/70">
            &ldquo;{texto}&rdquo;
          </p>
        )}
      </div>

      <div>
        <Rotulo>ENTENDI COMO</Rotulo>
        <textarea
          value={ens.regra}
          onChange={(e) => setEns({ ...ens, regra: e.target.value })}
          rows={2}
          className={`${inputCls} resize-y`}
        />
      </div>

      <div>
        <Rotulo>VAI PARA</Rotulo>
        <div className="flex flex-wrap gap-1.5">
          {CASAS_UI.map((c) => (
            <button key={c} type="button" onClick={() => setEns({ ...ens, casa: c })} className={chipCls(ens.casa === c)}>
              {CASA_LABEL[c]}
            </button>
          ))}
        </div>
        {casaF !== ens.casa && (
          <p className="mt-1.5 text-[11.5px] text-amber-300/90">
            vocabulário é por cliente: com escopo Global isto vira {CASA_LABEL[casaF]}.
          </p>
        )}
      </div>

      <div>
        <Rotulo>QUEM RECEBE</Rotulo>
        <div className="flex flex-wrap gap-1.5">
          {DESTINATARIOS.map((d) => {
            const on = ens.destinatarios.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  setEns({
                    ...ens,
                    destinatarios: on ? ens.destinatarios.filter((x) => x !== d) : [...ens.destinatarios, d],
                  })
                }
                className={chipCls(on)}
              >
                {d}
              </button>
            );
          })}
        </div>
        {casaF !== "licao" && (
          <p className="mt-1.5 text-[11.5px] text-white/35">
            destinatário roteia lição; em {CASA_LABEL[casaF]} a regra vale para todos os agentes.
          </p>
        )}
        {faltaDestinatario && <p className="mt-1.5 text-[11.5px] text-amber-300/90">escolha ao menos um destinatário.</p>}
      </div>

      <div>
        <Rotulo>ESCOPO</Rotulo>
        <div className="flex flex-wrap gap-4 text-[13px]">
          <label className={`flex items-center gap-2 ${args.clientId ? "" : "opacity-40"}`}>
            <input
              type="radio"
              name="escopo"
              checked={escopo === "cliente"}
              disabled={!args.clientId}
              onChange={() => setEscopo("cliente")}
              className="accent-[#c9a227]"
            />
            Cliente
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="escopo"
              checked={escopo === "global"}
              onChange={() => setEscopo("global")}
              className="accent-[#c9a227]"
            />
            Global
          </label>
          {!args.clientId && <span className="text-[11.5px] text-white/35">esta sessão não tem cliente</span>}
        </div>
      </div>

      {mostraDirecao && (
        <div>
          <Rotulo>TERMO E DIREÇÃO</Rotulo>
          <input
            value={ens.termo ?? ""}
            onChange={(e) => setEns({ ...ens, termo: e.target.value })}
            placeholder="a palavra em si — assinante"
            className={inputCls}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {DIRECOES_UI.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setEns({ ...ens, direcao: d })}
                className={chipCls(ens.direcao === d)}
              >
                {DIRECAO_LABEL[d]}
              </button>
            ))}
          </div>
          {faltaDirecao ? (
            <p className="mt-1.5 text-[11.5px] text-amber-300/90">
              escreva o termo e escolha a direção — sem isso a gravação erraria a lista.
            </p>
          ) : (
            <p className="mt-1.5 text-[11.5px] text-white/45">
              {ens.direcao === "evitar"
                ? `o roteirista deixa de escrever “${ens.termo?.trim()}”.`
                : `o roteirista passa a escrever “${ens.termo?.trim()}”.`}
            </p>
          )}
        </div>
      )}

      {mostraPadrao && (
        <div>
          <Rotulo>PADRÃO (REGEX)</Rotulo>
          <input
            value={ens.padrao ?? ""}
            onChange={(e) => setEns({ ...ens, padrao: e.target.value })}
            placeholder="manchete|manchetes"
            className={`${inputCls} font-mono text-[12px]`}
          />
          {vPadrao && !vPadrao.ok ? (
            <p className="mt-1.5 text-[11.5px] text-red-300">{vPadrao.motivo}</p>
          ) : (
            <p className="mt-1.5 text-[11.5px] text-white/45">
              {casos.length
                ? `Casa ${casos.length} trecho${casos.length > 1 ? "s" : ""} no roteiro aberto: ${casos
                    .map((c) => `“${c}”`)
                    .join("  ")}`
                : "Não casa nada no roteiro aberto."}
            </p>
          )}
        </div>
      )}

      {erro && <p className="text-[12.5px] text-red-300">{erro}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={confirmar}
          disabled={salvando || !podeConfirmar}
          className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
        >
          {salvando ? "Gravando…" : "Confirmar — vale da próxima geração"}
        </button>
        <button onClick={onFechar} className="text-[12.5px] text-white/45 hover:text-white/80 px-2">
          Cancelar
        </button>
      </div>
    </>
  );
}
