"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finalizeSession, markPublished, swapHook } from "@/lib/actions";
import type { NarrativaCandidata, RankingItem, SessionArtifacts } from "@/lib/pipeline/types";
import { BUILD_TAG } from "@/lib/version";

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
  status: string;
  published_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface ScriptPerformance {
  script_id: string;
  views: number | null;
  retencao_hook: number | null;
  retencao_final: number | null;
  compartilhamentos: number | null;
  seguidores_ganhos: number | null;
}

const PHASES = ["pesquisa", "modelagem", "narrativas", "roteiro", "hook_comando", "revisao", "humanizacao", "salvando"] as const;

const PHASE_SHORT: Record<string, string> = {
  pesquisa: "Pesquisa",
  modelagem: "Modelagem",
  narrativas: "Narrativas",
  roteiro: "Roteiro",
  hook_comando: "Hook + CTA",
  revisao: "Revisão",
  humanizacao: "Humanização",
  salvando: "Salvando",
};

const PHASE_LABELS: Record<string, string> = {
  pesquisa: "Agente pesquisador vasculhando a web e o X em tempo real...",
  modelagem: "Desconstruindo o material de modelagem...",
  narrativas: "Storytelling propõe narrativas; o agente de dados rankeia pelo histórico de +6 mil vídeos...",
  roteiro: "Roteirista-chefe executando a narrativa vencedora...",
  hook_comando: "Especialistas desenhando o hook e o comando sobre o roteiro pronto...",
  revisao: "Sala de revisão: hook, storytelling, comando, ritmo, restrições...",
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
      {/* desktop: trilha de agentes */}
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
              <div className="flex flex-col items-center gap-2 w-[74px]">
                {state === "done" && (
                  <div className="w-[28px] h-[28px] rounded-full bg-gold/[.14] border border-gold/60 flex items-center justify-center">
                    <CheckIcon size={12} />
                  </div>
                )}
                {state === "active" && (
                  <div className="w-[32px] h-[32px] rounded-full bg-gold flex items-center justify-center vm-pulse shadow-[0_0_18px_rgba(201,163,92,.35)]">
                    <QuillIcon size={14} color="#161410" />
                  </div>
                )}
                {state === "pending" && (
                  <div className="w-[28px] h-[28px] rounded-full border border-white/15 flex items-center justify-center">
                    <span className="w-[5px] h-[5px] rounded-full bg-white/25" />
                  </div>
                )}
                <span
                  className={`text-[10.5px] text-center leading-tight ${
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

// ── Cards de narrativa: a negociação Storytelling × Dados, visível e clicável ──
function NarrativeCards({
  candidatas,
  ranking,
  escolhida,
  disabled,
  onPick,
}: {
  candidatas: NarrativaCandidata[];
  ranking: RankingItem[];
  escolhida: number;
  disabled: boolean;
  onPick: (i: number) => void;
}) {
  const scoreOf = (i: number) => ranking.find((r) => r.indice === i);
  return (
    <div>
      <div className="flex items-baseline gap-2.5 mb-3">
        <span className="kicker text-white/40">NARRATIVAS CANDIDATAS</span>
        <span className="text-xs text-white/30">storytelling propõe · dados rankeiam</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {candidatas.map((n, i) => {
          const r = scoreOf(i);
          const winner = i === escolhida;
          return (
            <div
              key={i}
              className={`rounded-[14px] border p-4 flex flex-col gap-2.5 transition-colors ${
                winner ? "border-gold/60 bg-gold/[.07]" : "border-white/10 bg-white/[.02]"
              }`}
            >
              <div className="flex items-center gap-2">
                {winner ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-[10.5px] font-medium text-gold">
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.5 10 6l4.8.4-3.6 3.2 1.1 4.7L8 11.8l-4.3 2.5 1.1-4.7L1.2 6.4 6 6 8 1.5Z" />
                    </svg>
                    Escolhida pelos dados
                  </span>
                ) : (
                  <span className="text-[10.5px] text-white/35">candidata {i + 1}</span>
                )}
                {r && (
                  <span className={`ml-auto font-mono text-[12px] ${winner ? "text-gold" : "text-white/50"}`}>
                    {Math.round(r.score)}
                  </span>
                )}
              </div>
              <div>
                <p className={`text-[14px] font-medium leading-snug ${winner ? "text-cream" : "text-white/85"}`}>{n.titulo}</p>
                <p className="text-[11px] text-white/40 mt-1">{n.estrutura}</p>
              </div>
              <p className="text-[12px] leading-relaxed text-white/55">{n.mecanismo_emocional}</p>
              {r && <p className="text-[11.5px] leading-relaxed text-white/45 italic">“{r.justificativa}”</p>}
              <details className="mt-auto">
                <summary className="cursor-pointer text-[11px] text-white/40 select-none hover:text-white/60">beats</summary>
                <ol className="mt-1.5 space-y-1 text-[11.5px] text-white/55 list-decimal list-inside">
                  {n.beats.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ol>
              </details>
              {!winner && !disabled && (
                <button
                  onClick={() => onPick(i)}
                  className="mt-1 rounded-[9px] border border-white/15 px-3 py-1.5 text-[11.5px] text-white/70 hover:border-gold/50 hover:text-cream transition-colors"
                >
                  Reescrever com esta narrativa
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi"];

// Renderiza URLs das fontes como links clicáveis (conferíveis).
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)\]]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noreferrer"
            className="text-sky-300/80 underline decoration-sky-300/40 break-all hover:text-sky-200"
          >
            {p}
          </a>
        ) : (
          p
        )
      )}
    </>
  );
}

// Variações de hook: clicáveis para substituir o hook do roteiro (a antiga vira variação — reversível).
function HookVariants({ scriptId, variants, disabled }: { scriptId: string; variants: string[]; disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="rounded-[18px] border border-white/[.08] bg-white/[.02] px-5 sm:px-6 py-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="kicker text-gold">VARIAÇÕES DE HOOK</span>
        {!disabled && <span className="text-[11px] text-white/35">clique para substituir o hook do roteiro</span>}
      </div>
      <div className="flex flex-col gap-2.5 mt-3">
        {variants.map((v, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="font-display text-gold/70">{ROMAN[i] ?? i + 1}.</span>
            <p className="flex-1 text-[13.5px] leading-relaxed text-[#ededf0]/75">{v}</p>
            {!disabled && (
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await swapHook(scriptId, i);
                    router.refresh();
                  })
                }
                className="shrink-0 rounded-[9px] border border-white/15 px-3 py-1.5 text-[11.5px] text-white/70 hover:border-gold/50 hover:text-cream transition-colors disabled:opacity-40"
              >
                {pending ? "Trocando..." : "Usar este hook"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));

// Fechamento do flywheel: marcar publicado → ETL casa com o vídeo do corpus →
// performance real volta como chips e vira insight do agente Dados.
function PublishBox({ script, perf }: { script: Script; perf: ScriptPerformance | null }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (script.status !== "published") {
    return (
      <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:p-5 space-y-3">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="kicker text-white/40">PUBLICOU ESTE ROTEIRO?</span>
          <span className="text-xs text-white/30">a performance real volta para cá e ensina a sala</span>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link do vídeo publicado (YouTube/Shorts, Reels, TikTok)"
            className="flex-1 min-w-[240px] rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 font-mono text-[12.5px] outline-none placeholder:text-white/30 focus:border-gold/40"
          />
          <button
            onClick={() =>
              startTransition(async () => {
                try {
                  setError(null);
                  await markPublished(script.id, url);
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              })
            }
            disabled={pending || !url.trim()}
            className="btn-gold rounded-[10px] px-4 py-2.5 text-[13px] font-semibold disabled:opacity-40"
          >
            {pending ? "Marcando..." : "Marcar como publicado"}
          </button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[.03] p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="kicker text-emerald-300">PUBLICADO</span>
        {script.published_url && (
          <a
            href={script.published_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-300/80 underline decoration-sky-300/40 break-all hover:text-sky-200"
          >
            {script.published_url}
          </a>
        )}
      </div>
      {perf ? (
        <div className="flex items-center gap-2 flex-wrap">
          {perf.views != null && (
            <span className="rounded-full border border-gold/35 bg-gold/[.07] px-3 py-1 text-xs text-gold">
              {fmtNum(perf.views)} views
            </span>
          )}
          {perf.retencao_hook != null && (
            <span className="rounded-full border border-white/15 bg-white/[.04] px-3 py-1 text-xs text-white/70">
              retenção hook {Math.round(perf.retencao_hook)}%
            </span>
          )}
          {perf.retencao_final != null && (
            <span className="rounded-full border border-white/15 bg-white/[.04] px-3 py-1 text-xs text-white/70">
              retenção final {Math.round(perf.retencao_final)}%
            </span>
          )}
          {perf.compartilhamentos != null && perf.compartilhamentos > 0 && (
            <span className="rounded-full border border-white/15 bg-white/[.04] px-3 py-1 text-xs text-white/70">
              {fmtNum(perf.compartilhamentos)} compart.
            </span>
          )}
          {perf.seguidores_ganhos != null && perf.seguidores_ganhos !== 0 && (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/[.07] px-3 py-1 text-xs text-emerald-300">
              +{fmtNum(perf.seguidores_ganhos)} seguidores
            </span>
          )}
        </div>
      ) : (
        <p className="inline-flex items-center gap-2 text-xs text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 vm-pulse" />
          Aguardando métricas — sincroniza toda segunda, quando o vídeo entrar no corpus.
        </p>
      )}
    </div>
  );
}

// Feedback que orienta uma reescrita: nova geração usando a versão atual como base.
function RewriteBox({ onRewrite }: { onRewrite: (feedback: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:p-5 space-y-3">
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="kicker text-white/40">AJUSTAR O ROTEIRO</span>
        <span className="text-xs text-white/30">a sala reescreve usando esta versão como base</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Diga o que mudar: tom, ângulo, dados, ritmo, o que cortar ou aprofundar..."
        className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
      />
      <button
        onClick={() => text.trim() && onRewrite(text.trim())}
        disabled={!text.trim()}
        className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
      >
        <QuillIcon color="#161410" />
        Reescrever roteiro
      </button>
    </div>
  );
}

export default function SessionView({
  session,
  scripts,
  performance,
  analyses,
  artifacts,
  autoStart,
}: {
  session: { id: string; prompt: string; status: string; error_message: string | null; clientNome: string | null };
  scripts: Script[];
  performance: ScriptPerformance[];
  analyses: { analysis: unknown; replication_brief: string }[];
  artifacts: SessionArtifacts | null;
  autoStart: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(session.error_message);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(0);
  const [narrativas, setNarrativas] = useState<SessionArtifacts | null>(artifacts);
  const started = useRef(false);
  const streamRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(
    async (narrativeIndex?: number, feedback?: string) => {
      setGenerating(true);
      setError(null);
      setStreamText("");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, narrativeIndex, feedback }),
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
            if (e.type === "narrativas")
              setNarrativas((prev) => ({
                dossie: prev?.dossie ?? "",
                orientacao_roteiro: prev?.orientacao_roteiro ?? "",
                orientacao_hook: prev?.orientacao_hook ?? "",
                candidatas: e.candidatas,
                ranking: e.ranking,
                escolhida: e.escolhida,
              }));
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
    },
    [session.id, router]
  );

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
  const closed = session.status === "closed";
  const fullScriptText = (s: Script) =>
    [s.headline, s.roteiro, s.comando, s.fontes ? `FONTES:\n${s.fontes}` : null].filter(Boolean).join("\n\n");

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
        {(() => {
          // Prompts vindos de uma sugestão trazem tema + briefing longo (ângulo, abordagem, apoio).
          // Título = 1ª linha; o resto vira um briefing recolhível — não polui o topo da sessão.
          const nl = session.prompt.indexOf("\n");
          const titulo = (nl === -1 ? session.prompt : session.prompt.slice(0, nl)).trim();
          const briefing = nl === -1 ? "" : session.prompt.slice(nl + 1).trim();
          return (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-medium leading-[1.25] text-ivory mt-3.5">
                {titulo}
              </h1>
              {briefing && (
                <details className="mt-2.5 group">
                  <summary className="cursor-pointer inline-flex items-center gap-1.5 text-[12.5px] text-white/45 select-none hover:text-white/70">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="transition-transform group-open:rotate-90">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Briefing da pauta
                  </summary>
                  <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-white/70 border-l-2 border-gold/25 pl-4">
                    {briefing}
                  </p>
                </details>
              )}
            </>
          );
        })()}
        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
          {session.clientNome && (
            <span className="rounded-full border border-indigo-500/40 bg-indigo-500/[.08] px-3 py-1 text-xs text-indigo-300">
              Cliente · {session.clientNome}
            </span>
          )}
          {generating && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold/[.08] px-3 py-1 text-xs text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold vm-pulse" />
              Sala de agentes trabalhando
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
          {!generating && closed && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[.05] px-3 py-1 text-xs text-white/60">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              Encerrada
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
          {phase && phase !== "roteiro" && streamText && (
            <p className="text-xs text-white/40">
              O corpo acima está com os especialistas de hook, comando e revisão — a versão final aparece já já.
            </p>
          )}
        </>
      )}

      {/* dossiê de pesquisa */}
      {narrativas?.dossie && (
        <details className="rounded-[14px] border border-sky-500/25 bg-sky-500/[.04] px-4 py-3.5">
          <summary className="cursor-pointer inline-flex items-center gap-2 text-[13px] text-sky-300 font-medium select-none">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Dossiê de pesquisa (Grok)
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-white/70">{narrativas.dossie}</p>
        </details>
      )}

      {/* narrativas candidatas — a negociação da sala */}
      {narrativas && narrativas.candidatas.length > 0 && (
        <NarrativeCards
          candidatas={narrativas.candidatas}
          ranking={narrativas.ranking}
          escolhida={narrativas.escolhida}
          disabled={generating || closed}
          onPick={(i) => {
            if (confirm("Reescrever o roteiro com esta narrativa? A pesquisa e as candidatas são reaproveitadas; só a escrita é refeita.")) {
              setNarrativas((prev) => (prev ? { ...prev, escolhida: i } : prev));
              generate(i);
            }
          }}
        />
      )}

      {/* erro */}
      {error && (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/[.05] p-4 text-sm">
          <p className="text-red-300">Erro: {error}</p>
          <button onClick={() => generate()} className="mt-2 underline text-white/80 hover:text-white">
            Tentar de novo
          </button>
          {/* auto-identificação do print: versão/git + id da sessão → detalhe fica em vm_sessions.debug */}
          <p className="mt-3 font-mono text-[10px] text-white/30 select-all">
            {BUILD_TAG} · sessão {session.id.slice(0, 8)}
          </p>
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
            <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3 border-b border-white/[.07] bg-black/20">
              <span className="kicker text-gold">ROTEIRO COMPLETO</span>
              <CopyBtn text={fullScriptText(script)} label="Copiar tudo" />
            </div>
            {script.headline && (
              <section className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-gold">HEADLINE</span>
                  <span className="text-[11px] text-white/35">texto de tela</span>
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
                </div>
                <p className="font-display text-xl sm:text-[23px] font-medium leading-[1.4] text-ivory mt-3">
                  &ldquo;{script.hook}&rdquo;
                </p>
              </section>
            )}
            <section className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]">
              <div className="flex items-center gap-2.5">
                <span className="kicker text-gold">ROTEIRO</span>
              </div>
              <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#ededf0]/80 mt-3">{script.roteiro}</p>
            </section>
            {script.comando && (
              <section className="px-5 sm:px-6 pt-5 pb-5">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-gold">COMANDO</span>
                  <span className="text-[11px] text-white/35">fechamento do roteiro</span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-[#ededf0]/80 mt-3">&ldquo;{script.comando}&rdquo;</p>
              </section>
            )}
            {script.fontes && (
              <section className="px-5 sm:px-6 pt-4 pb-5 border-t border-white/[.07] bg-black/20">
                <div className="flex items-center gap-2.5">
                  <span className="kicker text-white/40">FONTES</span>
                  <span className="text-[11px] text-white/30">confira nos links</span>
                </div>
                <p className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-white/50 mt-2.5">
                  <Linkified text={script.fontes} />
                </p>
              </section>
            )}
          </div>

          {!!script.hook_variants?.length && (
            <HookVariants scriptId={script.id} variants={script.hook_variants} disabled={generating || closed} />
          )}

          {/* visível também com sessão encerrada — a publicação acontece depois */}
          <PublishBox script={script} perf={performance.find((p) => p.script_id === script.id) ?? null} />


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

          {!closed && (
            <>
              <RewriteBox onRewrite={(fb) => generate(undefined, fb)} />
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => generate()}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-white/20 px-4 py-2 text-[13px] text-white/80 hover:border-gold/50 hover:text-cream transition-colors"
                >
                  <QuillIcon />
                  Gerar nova versão
                </button>
                <span className="text-[11.5px] text-white/35">mesma narrativa · pesquisa reaproveitada</span>
              </div>
              <FeedbackForm sessionId={session.id} scriptId={script.id} />
            </>
          )}
        </div>
      )}

      {!generating && !script && !error && (
        <button
          onClick={() => generate()}
          className="btn-gold inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-semibold"
        >
          <QuillIcon color="#161410" />
          Conjurar roteiro
        </button>
      )}
    </div>
  );
}

// Finaliza a sessão (vira "Encerrada" na lista); feedback opcional alimenta o aprendizado.
function FeedbackForm({ sessionId, scriptId }: { sessionId: string; scriptId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [edited, setEdited] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  if (sent)
    return <p className="text-sm text-emerald-300">Sessão encerrada. O feedback alimenta o aprendizado do sistema.</p>;

  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:p-5 space-y-3">
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="kicker text-white/40">FINALIZAR SESSÃO</span>
        <span className="text-xs text-white/30">avaliação opcional</span>
      </div>
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
        onClick={() =>
          startTransition(async () => {
            await finalizeSession(sessionId, scriptId, { rating, notes, edited_version: edited });
            setSent(true);
            router.refresh();
          })
        }
        disabled={pending}
        className="btn-gold rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold disabled:opacity-40"
      >
        {pending ? "Encerrando..." : "Finalizar"}
      </button>
    </div>
  );
}
