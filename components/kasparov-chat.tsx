"use client";

// 018 §10 — chat de verdade: lista de mensagens, campo fixo embaixo, streaming.
// O que esta tela NÃO tem, e não é esquecimento:
//   • memória de conversa — o turno N não recebe os turnos 1..N-1 (§4). A tela diz isso;
//   • tela para as filas — calibração e lições pendentes entram como assunto (§8);
//   • confirmação própria de gravação — é o teach-dialog da peça 1, com a síntese editável.

import { useEffect, useRef, useState } from "react";
import { useTeachDialog } from "./teach-dialog";
import type { PropostaDeDestilacao } from "@/lib/pipeline/kasparov";
import type { Pendencia, Resposta } from "@/lib/pipeline/kasparov-filas";

interface Msg {
  papel: "usuario" | "kasparov";
  conteudo: string;
}

const FASES: Record<string, string> = {
  pensando: "Lendo o estado do sistema…",
  "vendo-video": "Assistindo ao vídeo…",
  escrevendo: "Respondendo…",
  destilando: "Vendo se sobrou regra…",
};

const inputCls =
  "w-full rounded-[10px] border border-white/[.14] bg-transparent px-3 py-2 text-[13px] text-cream outline-none placeholder:text-white/30 focus:border-gold/40";

/** Conversa recuperada do banco (rota /kasparov/[id]): a tela reabre e o debate continua nela. */
export interface ConversaRecuperada {
  thread: { id: string; origem: string };
  clientId: string | null;
  msgs: Msg[];
}

export default function KasparovChat({
  clients,
  inicial,
}: {
  clients: { id: string; nome: string }[];
  inicial?: ConversaRecuperada;
}) {
  const [clientId, setClientId] = useState<string | null>(inicial?.clientId ?? null);
  const [thread, setThread] = useState<{ id: string; origem: string } | null>(inicial?.thread ?? null);
  const [msgs, setMsgs] = useState<Msg[]>(inicial?.msgs ?? []);
  const [parcial, setParcial] = useState("");
  const [fase, setFase] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [proposta, setProposta] = useState<PropostaDeDestilacao | null>(null);
  const [pendencia, setPendencia] = useState<Pendencia | null>(null);
  const [texto, setTexto] = useState("");
  const fim = useRef<HTMLDivElement>(null);
  const rodando = fase !== null;

  // A confirmação da peça 1, inteira: mesma classificação, mesmo painel, mesmas quatro casas.
  // `sourceUrl` é o que salva a procedência — sem ele gravarEnsinamento recusa a lição (§5.3).
  const teach = useTeachDialog({
    scriptId: "",
    sessionId: "",
    clientId,
    roteiro: "",
    sourceUrl: thread?.origem,
    onMudar: () => {},
  });

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, parcial, fase]);

  const enviar = async () => {
    const m = texto.trim();
    if (!m || rodando) return;
    setTexto("");
    setErro(null);
    setProposta(null);
    setPendencia(null);
    setMsgs((v) => [...v, { papel: "usuario", conteudo: m }]);
    setFase("pensando");
    let recebido = "";
    try {
      const res = await fetch("/api/kasparov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread?.id, clientId, mensagem: m }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `falha no debate (${res.status})`);
      if (!res.body) throw new Error("sem stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n\n");
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          let e;
          try {
            e = JSON.parse(linha.slice(6));
          } catch {
            continue; // evento truncado não aborta o stream
          }
          if (e.type === "thread") setThread({ id: e.threadId, origem: e.origem });
          if (e.type === "phase") setFase(e.phase);
          if (e.type === "token") {
            recebido += e.t;
            setParcial(recebido);
          }
          if (e.type === "error") setErro(e.message);
          if (e.type === "done") {
            setMsgs((v) => [...v, { papel: "kasparov", conteudo: e.texto }]);
            setParcial("");
            setProposta(e.proposta ?? null);
            setPendencia(e.pendencia ?? null);
          }
        }
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setFase(null);
      setParcial("");
    }
  };

  // §8: a resposta volta pela porta que já existe (vm_calibration_votes / setLearningActive).
  // Falha some com a pendência? Não: ela continua na tela, com o motivo.
  const responderFila = async (resposta: Resposta) => {
    if (!pendencia) return;
    try {
      const res = await fetch("/api/kasparov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread?.id, clientId, pendencia, resposta }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `não consegui registrar (${res.status})`);
      setPendencia(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-[820px] mx-auto px-4 sm:px-6">
      <header className="pt-8 pb-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Kasparov</h1>
          <span className="text-[13px] text-white/40">debate de estratégia, com o lastro que existir</span>
          <select
            value={clientId ?? ""}
            onChange={(e) => setClientId(e.target.value || null)}
            disabled={!!thread}
            title={thread ? "o cliente da conversa não muda no meio dela" : undefined}
            className={`sm:ml-auto rounded-[10px] border border-white/[.14] bg-[#0b0b0f] px-2.5 py-1.5 text-[12.5px] text-cream outline-none disabled:opacity-40`}
          >
            <option value="">sem cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        {/* §4: a amnésia é o desenho, não um defeito. Dita aqui para não ser descoberta como bug. */}
        <p className="mt-2 rounded-[10px] border border-gold/25 bg-gold/[.04] px-3 py-2 text-[12.5px] leading-relaxed text-white/60">
          Eu não guardo a conversa: cada turno vê o estado do sistema (playbooks, lições ativas, preferências do
          cliente), nunca o que a gente disse há dez mensagens.{" "}
          <span className="text-gold/80">O que a gente acordar eu registro; o resto eu esqueço.</span> Se uma conclusão
          importa, ela vira lição, e é por isso que a confirmação aparece no fim do turno.
        </p>
        {/* Reabrir a conversa não é reabrir a memória dele: sem isto na tela, o usuário lê os
            turnos antigos ali em cima e assume que o Kasparov também está lendo. */}
        {inicial && (
          <p className="mt-1.5 text-[12px] text-white/40">
            Conversa recuperada: você relê os turnos acima, ele não. O próximo turno vê o estado do sistema e o assunto
            corrente, como sempre.
          </p>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4">
        {!msgs.length && !parcial && (
          <p className="text-[13.5px] text-white/35 py-8">
            Cole um link de vídeo para dissecar, jogue um tema, ou discorde de alguma coisa. Discordar é o uso principal.
          </p>
        )}
        {msgs.map((m, i) => (
          <Bolha key={i} papel={m.papel} conteudo={m.conteudo} />
        ))}
        {parcial && <Bolha papel="kasparov" conteudo={parcial} />}
        {rodando && !parcial && (
          <p className="text-[12.5px] text-white/40 animate-pulse">{FASES[fase] ?? "Pensando…"}</p>
        )}

        {erro && (
          <p className="rounded-[10px] border border-red-400/30 bg-red-400/[.06] px-3 py-2 text-[12.5px] text-red-300">
            {erro}
          </p>
        )}

        {proposta && (
          <div className="rounded-[12px] border border-gold/35 bg-gold/[.05] p-3.5 space-y-2.5">
            <div className="kicker text-gold text-[10px]">ISSO VIRA REGRA?</div>
            <p className="text-[13px] italic leading-relaxed text-white/75">&ldquo;{proposta.sintese}&rdquo;</p>
            <p className="text-[11.5px] text-white/40">
              Palavras minhas, não suas. Na confirmação você reescreve antes de virar registro.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => teach.abrir("ensinar", undefined, proposta)}
                className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold"
              >
                Registrar
              </button>
              <button
                onClick={() => setProposta(null)}
                className="rounded-[10px] border border-white/15 px-4 py-2 text-[13px] text-white/60 hover:text-white"
              >
                Fica só na conversa
              </button>
            </div>
          </div>
        )}

        {pendencia && <FilaCard p={pendencia} onResponder={responderFila} />}
        <div ref={fim} />
      </div>

      <div className="sticky bottom-0 bg-[#0b0b0f] pt-2 pb-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={2}
          placeholder="Discorde, pergunte, ou cole o link do vídeo. Enter envia, Shift+Enter quebra linha."
          className={`${inputCls} resize-y`}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => void enviar()}
            disabled={rodando || !texto.trim()}
            className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
          >
            {rodando ? "Pensando…" : "Enviar"}
          </button>
          {thread && <span className="font-mono text-[10.5px] text-white/25">{thread.origem}</span>}
        </div>
      </div>

      {teach.dialog}
    </div>
  );
}

// O Kasparov escreve em markdown (§6.1 da persona) e a tela mostrava os asteriscos crus.
// Não vale uma dependência de markdown: o vocabulário é fechado e é só este. Streaming mostra
// o marcador por um instante antes de fechar o par — é o preço de não bufferizar o token.
// ponytail: bold, itálico, bullet, numerada e rótulo. Link e tabela não entram porque o
// Kasparov não escreve nenhum dos dois; se um dia escrever, aí sim uma lib.
const INLINE = /(\*\*[^*\n]+\*\*|(?<![*\w])\*[^*\n]+\*(?!\w))/g;

function Inline({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(INLINE).map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-cream">
            {p.slice(2, -2)}
          </strong>
        ) : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? (
          <em key={i} className="text-white/70">
            {p.slice(1, -1)}
          </em>
        ) : (
          p
        )
      )}
    </>
  );
}

// Hierarquia de leitura: rótulo (###) > parágrafo > item de lista. O recuo e o marcador em
// dourado são o que faz a lista ser varrida com o olho em vez de lida palavra por palavra.
function Formatado({ texto }: { texto: string }) {
  const linhas = texto.split("\n");
  return (
    <>
      {linhas.map((linha, i) => {
        const l = linha.trim();
        if (!l) return <div key={i} className="h-2.5" />;

        const rotulo = /^#{1,4}\s+(.*)$/.exec(l);
        if (rotulo)
          return (
            <div key={i} className="kicker text-gold/85 text-[10px] mt-3 mb-1 first:mt-0">
              {rotulo[1].replace(/[:.]$/, "")}
            </div>
          );

        const bullet = /^[-*•]\s+(.*)$/.exec(l);
        const numerada = /^(\d{1,2})[.)]\s+(.*)$/.exec(l);
        if (bullet || numerada)
          return (
            <div key={i} className="flex gap-2 pl-0.5 my-0.5">
              <span className="shrink-0 font-mono text-[11.5px] text-gold/70 leading-[1.7]">
                {bullet ? "•" : `${numerada![1]}.`}
              </span>
              <span className="min-w-0">
                <Inline texto={bullet ? bullet[1] : numerada![2]} />
              </span>
            </div>
          );

        return (
          <p key={i} className="my-0.5">
            <Inline texto={l} />
          </p>
        );
      })}
    </>
  );
}

function Bolha({ papel, conteudo }: Msg) {
  const meu = papel === "usuario";
  return (
    <div className={meu ? "flex justify-end" : ""}>
      <div
        className={
          meu
            ? "max-w-[85%] rounded-[12px] border border-white/[.12] bg-white/[.05] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-cream whitespace-pre-wrap"
            : "max-w-[95%] text-[13.5px] leading-relaxed text-white/80"
        }
      >
        {!meu && <span className="kicker text-gold text-[10px] block mb-1.5">KASPAROV</span>}
        {meu ? conteudo : <Formatado texto={conteudo} />}
      </div>
    </div>
  );
}

// A fila é ASSUNTO, não tela (§8): um item por vez, no fim do turno. O par de calibração
// chega cego — sem eixo, sem origem, sem mecanismo — porque revelar enviesa o voto.
function FilaCard({ p, onResponder }: { p: Pendencia; onResponder: (r: Resposta) => void }) {
  const opcao =
    "flex-1 min-w-[200px] rounded-[10px] border border-white/15 px-3.5 py-2.5 text-left text-[13px] leading-relaxed text-white/75 hover:border-gold/50 hover:text-white";
  return (
    <div className="rounded-[12px] border border-white/[.12] bg-white/[.02] p-3.5 space-y-2.5">
      {p.tipo === "calibracao" ? (
        <>
          <p className="text-[13px] text-white/70">
            Aproveitando: qual destes dois hooks é mais forte?{" "}
            <span className="text-white/35">({p.restantes} pares esperando)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onResponder("a")} className={opcao}>
              {p.a}
            </button>
            <button onClick={() => onResponder("b")} className={opcao}>
              {p.b}
            </button>
          </div>
        </>
      ) : p.tipo === "metrica" ? (
        <>
          {/* Peça 5: lembrete, não coleta. Não há número para digitar aqui — vm_script_performance
              é preenchida pelo ETL, e é por isso que a única resposta é "agora não". */}
          <p className="text-[13px] text-white/70">
            Você publicou um roteiro há {p.dias} dias e a gente ainda não tem a performance dele.{" "}
            <span className="text-white/35">({p.restantes} esperando)</span>
          </p>
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[12.5px] text-gold underline underline-offset-2 hover:text-cream"
          >
            abrir o vídeo publicado
          </a>
          <p className="text-[12px] leading-relaxed text-white/45">
            Sem esse número eu discuto no achismo: é ele que vira ratio, e o ratio é o que me deixa
            sustentar uma posição em vez de só opinar.
          </p>
        </>
      ) : (
        <>
          <p className="text-[13px] text-white/70">
            Tem uma lição extraída que ninguém nunca ligou.{" "}
            <span className="text-white/35">({p.restantes} esperando)</span>
          </p>
          <p className="text-[13.5px] text-cream">{p.titulo}</p>
          <p className="text-[12.5px] leading-relaxed text-white/60">{p.descricao}</p>
          {p.evidencia && <p className="text-[12px] italic text-white/40">&ldquo;{p.evidencia}&rdquo;</p>}
          <button
            onClick={() => onResponder("ativar")}
            className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold"
          >
            Ativar (vale da próxima geração)
          </button>
        </>
      )}
      <button onClick={() => onResponder("skip")} className="text-[12px] text-white/35 hover:text-white/70">
        agora não
      </button>
    </div>
  );
}
