"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFeedback } from "@/lib/actions";

interface Script {
  id: string;
  version: number;
  headline: string | null;
  hook: string | null;
  hook_variants: string[] | null;
  roteiro: string;
  comando: string | null;
  fontes: string | null;
  slop_lint_violations: number;
  created_at: string;
}

const PHASES = ["coleta", "modelagem", "rascunho", "critica", "humanizacao", "salvando"] as const;

const PHASE_SHORT: Record<string, string> = {
  coleta: "Coleta",
  modelagem: "Modelagem",
  rascunho: "Rascunho",
  critica: "Crítica",
  humanizacao: "Humanização",
  salvando: "Salvando",
};

const PHASE_LABELS: Record<string, string> = {
  coleta: "Consultando dados de performance, preferências e playbooks...",
  modelagem: "Desconstruindo o material de modelagem...",
  rascunho: "Roteirista-chefe escrevendo o rascunho...",
  critica: "Sala de revisão: hook, storytelling, comando, ritmo...",
  humanizacao: "Passe final de naturalidade...",
  salvando: "Salvando...",
};

function QuillIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M11 2.5 13.5 5M9.5 4 3 10.5 2.5 13.5 5.5 13 12 6.5 9.5 4Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="#c9a35c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-[5px] text-xs text-white/65 hover:border-gold/50 hover:text-cream transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

function Stepper({ current }: { current: string | null }) {
  const idx = current ? PHASES.indexOf(current as (typeof PHASES)[number]) : -1;
  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5 sm:px-7 sm:py-6">
      {/* desktop: trilha de fases */}
      <div className="hidden sm:flex items-center">
        {PHASES.map((p, i) => {
          const state = i < idx ? "done" : i === idx ? "active" : "pending";
          return (
            <div key={p} className="contents">
              {i > 0 && (
                <div
                  className="flex-1 h-px mb-6 mx-0.5"
                  style={{
                    background:
                      i <= idx
                        ? i === idx
                          ? "linear-gradient(90deg, rgba(201,163,92,.6), rgba(201,163,92,.15))"
                          : "rgba(201,163,92,.6)"
                        : "rgba(255,255,255,.12)",
                  }}
                />
              )}
              <div className="flex flex-col items-center gap-2 w-24">
                {state === "done" && (
                  <div className="w-[30px] h-[30px] rounded-full bg-gold/[.14] border border-gold/60 flex items-center justify-center">
                    <CheckIcon />
                  </div>
                )}
                {state === "active" && (
                  <div className="w-[34px] h-[34px] rounded-full bg-gold flex items-center justify-center vm-pulse shadow-[0_0_18px_rgba(201,163,92,.35)]">
                    <QuillIcon size={15} color="#161410" />
                  </div>
                )}
                {state === "pending" && (
                  <div className="w-[30px] h-[30px] rounded-full border border-white/15 flex items-center justify-center">
                    <span className="w-[5px] h-[5px] rounded-full bg-white/25" />
                  </div>
                )}
                <span
                  className={`text-[11.5px] ${
                    state === "active" ? "text-cream font-medium" : state === "done" ? "text-white/65" : "text-white/35"
                  }`}
                >
                  {PHASE_SHORT[p]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* mobile: barra compacta */}
      <div className="sm:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full bg-gold flex items-center justify-center vm-pulse shrink-0">
            <QuillIcon color="#161410" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium text-cream">{idx >= 0 ? PHASE_SHORT[PHASES[idx]] : "Preparando"}</div>
            <div className="text-[11.5px] text-white/40">fase {Math.max(idx + 1, 1)} de {PHASES.length}</div>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3.5">
          {PHASES.map((p, i) => (
            <span
              key={p}
              className={`flex-1 h-[3px] rounded-sm ${
                i < idx ? "bg-gold" : i === idx ? "bg-gold shadow-[0_0_8px_rgba(201,163,92,.7)]" : "bg-white/[.12]"
              }`}
            />
          ))}
        </div>
      </div>

      {idx >= 0 && <p className="text-xs text-white/40 mt-4 text-center sm:text-left">{PHASE_LABELS[PHASES[idx]]}</p>}
    </div>
  );
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi"];

export default function SessionView({
  session,
  scripts,
  analyses,
  autoStart,
}: {
  session: { id: string; prompt: string; status: string; error_message: string | null; clientNome: string | null };
  scripts: Script[];
  analyses: { analysis: unknown; replication_brief: string }[];
  autoStart: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(session.error_message);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(0);
  const started = useRef(false);
  const streamRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setStreamText("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      if (!res.body) throw new Error("sem stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const e = JSON.parse(line.slice(6));
          if (e.type === "phase") setPhase(e.phase);
          if (e.type === "token") setStreamText((t) => t + e.text);
          if (e.type === "error") setError(e.message);
          if (e.type === "done") router.refresh();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
      setPhase(null);
    }
  }, [session.id, router]);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      generate();
    }
  }, [autoStart, generate]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [streamText]);

  const script = scripts[selected];

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-5">
      {/* breadcrumb + header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <button onClick={() => router.push("/sessions")} className="hover:text-white/70">
            Sessões
          </button>
          <span className="text-white/25">/</span>
          <span className="font-mono text-white/60">#{session.id.slice(0, 6)}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium leading-[1.25] text-ivory mt-3.5">
          {session.prompt}
        </h1>
        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
          {session.clientNome && (
            <span className="rounded-full border border-indigo-500/40 bg-indigo-500/[.08] px-3 py-1 text-xs text-indigo-300">
              Cliente · {session.clientNome}
            </span>
          )}
          {generating && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold/[.08] px-3 py-1 text-xs text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold vm-pulse" />
              Gerando
            </span>
          )}
          {!generating && session.status === "done" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/[.07] px-3 py-1 text-xs text-emerald-300">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Concluída
            </span>
          )}
        </div>
      </div>

      {/* modelagem */}
      {analyses.length > 0 && (
        <details className="rounded-[14px] border border-amber-500/30 bg-amber-500/[.05] px-4 py-3.5">
          <summary className="cursor-pointer inline-flex items-center gap-2 text-[13px] text-amber-300 font-medium select-none">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 1 3 9.5h4L7 15l6-8.5H9L9 1Z" />
            </svg>
            Desconstrução da modelagem ({analyses.length})
          </summary>
          {analyses.map((a, i) => (
            <div key={i} className="mt-3 space-y-2 text-sm">
              <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{a.replication_brief}</p>
              <details>
                <summary className="cursor-pointer text-xs text-white/40 select-none">análise completa (JSON)</summary>
                <pre className="mt-2 text-xs bg-black/30 rounded-lg p-3 overflow-x-auto text-white/60">
                  {JSON.stringify(a.analysis, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </details>
      )}

      {/* geração em andamento */}
      {generating && (
        <>
          <Stepper current={phase} />
          {streamText && (
            <div className="rounded-2xl border border-gold/25 bg-white/[.02] overflow-hidden">
              <div
                className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-white/[.07]"
                style={{ background: "linear-gradient(180deg, rgba(201,163,92,.07), transparent)" }}
              >
                <QuillIcon size={14} color="#c9a35c" />
                <span className="kicker text-gold tracking-[.16em] text-[10px] sm:text-[11px]">TEXTO AO VIVO</span>
                {phase && <span className="text-xs text-white/35">{PHASE_SHORT[phase]?.toLowerCase()}</span>}
              </div>
              <div
                ref={streamRef}
                className="px-4 sm:px-6 py-4 sm:py-5 font-mono text-[12px] sm:text-[13px] leading-[1.8] text-[#ededf0]/85 whitespace-pre-wrap max-h-80 overflow-y-auto"
              >
                {streamText}
                <span className="inline-block w-2 h-4 bg-gold align-text-bottom ml-0.5 vm-caret" />
              </div>
            </div>
          )}
          {phase && phase !== "rascunho" && streamText && (
            <p className="text-xs text-white/40">
              O rascunho acima está passando pela sala de revisão — a versão final aparece já já.
            </p>
          )}
        </>
      )}

      {/* erro */}
      {error && (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/[.05] p-4 text-sm">
          <p className="text-red-300">Erro: {error}</p>
          <button onClick={generate} className="mt-2 underline text-white/80 hover:text-white">
            Tentar de novo
          </button>
        </div>
      )}

      {/* roteiro final */}
      {!generating && script && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {scripts.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelected(i)}
                className={`rounded-[10px] border px-4 py-[7px] text-[13px] transition-colors ${
                  i === selected
                    ? "border-gold/50 bg-gold/10 text-cream"
                    : "border-white/[.12] bg-white/[.03] text-white/60 hover:border-white/30"
                }`}
              >
                v{s.version}
              </button>
            ))}
          </div>

          <div
            className="rounded-[18px] border border-gold/30 overflow-hidden"
            style={{ background: "linear-gradient(180deg, rgba(201,163,92,.05), rgba(255,255,255,.02) 120px)" }}
          >
            {script.headline && (
              <section className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-gold">HEADLINE</span>
                  <span className="text-[11px] text-white/35">texto de tela</span>
                  <CopyBtn text={script.headline} />
                </div>
                <p className="font-cinzel text-base sm:text-lg font-semibold tracking-[.06em] leading-snug text-cream mt-3 uppercase">
                  {script.headline}
                </p>
              </section>
            )}
            {script.hook && (
              <section className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-gold">HOOK</span>
                  <CopyBtn text={script.hook} />
                </div>
                <p className="font-display text-xl sm:text-[23px] font-medium leading-[1.4] text-ivory mt-3">
                  &ldquo;{script.hook}&rdquo;
                </p>
              </section>
            )}
            <section className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]">
              <div className="flex items-center gap-2.5">
                <span className="kicker text-gold">ROTEIRO</span>
                <CopyBtn text={script.roteiro} />
              </div>
              <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#ededf0]/80 mt-3">{script.roteiro}</p>
            </section>
            {!!script.hook_variants?.length && (
              <section className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-gold">VARIAÇÕES DE HOOK</span>
                  <CopyBtn text={script.hook_variants.join("\n")} />
                </div>
                <div className="flex flex-col gap-2 mt-3 text-[13.5px] leading-relaxed text-[#ededf0]/75">
                  {script.hook_variants.map((v, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="font-display text-gold/70">{ROMAN[i] ?? i + 1}.</span>
                      {v}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {script.comando && (
              <section className="px-5 sm:px-6 pt-5 pb-5">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-gold">COMANDO</span>
                  <CopyBtn text={script.comando} />
                </div>
                <p className="text-[13.5px] leading-relaxed text-[#ededf0]/80 mt-3">&ldquo;{script.comando}&rdquo;</p>
              </section>
            )}
            {script.fontes && (
              <section className="px-5 sm:px-6 pt-4 pb-5 border-t border-white/[.07] bg-black/20">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-white/40">FONTES</span>
                  <CopyBtn text={script.fontes} />
                </div>
                <p className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-white/50 mt-2.5">
                  {script.fontes}
                </p>
              </section>
            )}
          </div>

          {script.slop_lint_violations > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[.06] px-4 py-3">
              <div className="inline-flex items-center gap-2 text-xs text-amber-300 font-medium">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2 14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M8 6.5V9.5M8 11.5V11.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Slop-lint
              </div>
              <p className="text-xs text-white/55 mt-1.5">
                {script.slop_lint_violations} {script.slop_lint_violations === 1 ? "padrão" : "padrões"} de IA da lista
                de vigilância detectado{script.slop_lint_violations === 1 ? "" : "s"} no texto.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={generate}
              className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold"
            >
              <QuillIcon color="#161410" />
              Gerar nova versão
            </button>
          </div>

          <FeedbackForm scriptId={script.id} />
        </div>
      )}

      {!generating && !script && !error && (
        <button
          onClick={generate}
          className="btn-gold inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-semibold"
        >
          <QuillIcon color="#161410" />
          Conjurar roteiro
        </button>
      )}
    </div>
  );
}

function FeedbackForm({ scriptId }: { scriptId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [edited, setEdited] = useState("");
  const [sent, setSent] = useState(false);

  if (sent)
    return <p className="text-sm text-emerald-300">Feedback registrado. Isso alimenta o aprendizado do sistema.</p>;

  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-xs text-white/40 mr-1.5">Avaliar:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} estrelas`}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 16 16"
              fill={rating && n <= rating ? "#c9a35c" : "none"}
              stroke={rating && n <= rating ? "none" : "rgba(255,255,255,.3)"}
              strokeWidth="1.2"
            >
              <path d="M8 1.5 10 6l4.8.4-3.6 3.2 1.1 4.7L8 11.8l-4.3 2.5 1.1-4.7L1.2 6.4 6 6 8 1.5Z" />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Observações (opcional)"
        className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
      />
      <textarea
        value={edited}
        onChange={(e) => setEdited(e.target.value)}
        rows={3}
        placeholder="Se você editou o roteiro antes de usar, cole a versão final aqui — é o insumo mais valioso para o sistema aprender."
        className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
      />
      <button
        onClick={async () => {
          await saveFeedback(scriptId, { rating, notes, edited_version: edited });
          setSent(true);
        }}
        disabled={!rating && !notes && !edited}
        className="rounded-[10px] border border-white/20 px-4 py-2 text-[13px] text-white/80 disabled:opacity-40 hover:border-gold/50 hover:text-cream transition-colors"
      >
        Enviar feedback
      </button>
    </div>
  );
}
