"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finalizeSession, markPublished, quickFeedback, swapHook, updateScript, suggestFragment, bobAssistAction } from "@/lib/actions";
import type { BobModo } from "@/lib/pipeline/bob";
import { spliceRoteiro, mergeFontes } from "@/lib/bob-edit";
import type { NarrativaCandidata, RankingItem, SessionArtifacts } from "@/lib/pipeline/types";
import type { LintViolation } from "@/lib/pipeline/slop-lint";
import { fmtNum, fmtRatio, ratioTone } from "@/lib/format";
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
  // extraídos de pipeline_trace no server component (WP-F.4/.3)
  violations: LintViolation[];
  edicao_humana: boolean;
}

export interface Baseline {
  views: number;
  periodo: "30d" | "geral";
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

// Copia a URL pública de leitura do roteiro (token = uuid do script).
function ShareBtn({ scriptId }: { scriptId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/r/${scriptId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title="Copiar link de leitura (acesso sem login, só leitura)"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-[5px] text-xs text-white/65 hover:border-gold/50 hover:text-cream transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M6 8.5 10 5.5M6 7.5l4 3" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {copied ? "Link copiado ✓" : "Compartilhar"}
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
            <div className="text-[12px] text-white/55">fase {Math.max(idx + 1, 1)} de {PHASES.length}</div>
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

      {/* aria-live sempre montado: leitores de tela anunciam a troca de fase */}
      <p aria-live="polite" className="text-xs text-white/55 mt-4 text-center sm:text-left">
        {idx >= 0 ? PHASE_LABELS[PHASES[idx]] : "Preparando a sala de agentes..."}
      </p>
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
  collapsible,
}: {
  candidatas: NarrativaCandidata[];
  ranking: RankingItem[];
  escolhida: number;
  disabled: boolean;
  onPick: (i: number) => void;
  collapsible?: boolean; // roteiro pronto: negociação encerrada, pode recolher
}) {
  const scoreOf = (i: number) => ranking.find((r) => r.indice === i);
  const Wrapper = collapsible ? "details" : "div";
  const Header = collapsible ? "summary" : "div";
  return (
    // roteiro pronto → <details> recolhido por padrão; senão <div> sempre aberto
    <Wrapper className={collapsible ? "group" : undefined}>
      <Header className={`flex items-baseline gap-2.5 mb-3${collapsible ? " cursor-pointer select-none" : ""}`}>
        {collapsible && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            className="self-center text-white/40 transition-transform group-open:rotate-90"
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className="kicker text-white/40">NARRATIVAS CANDIDATAS</span>
        <span className="text-xs text-white/55">storytelling propõe · dados rankeiam</span>
      </Header>
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
              </div>
              {/* score como barra 0-100 — o voto dos dados visível, não um número solto */}
              {r && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[4px] rounded-full bg-white/[.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${winner ? "bg-gold" : "bg-gold/45"}`}
                      style={{ width: `${Math.min(Math.max(r.score, 0), 100)}%` }}
                    />
                  </div>
                  <span className={`shrink-0 font-mono text-[11px] ${winner ? "text-gold" : "text-white/50"}`}>
                    {Math.round(r.score)}
                  </span>
                </div>
              )}
              <div>
                <p className={`text-[14px] font-medium leading-snug ${winner ? "text-cream" : "text-white/85"}`}>{n.titulo}</p>
                <p className="text-[11px] text-white/40 mt-1">{n.estrutura}</p>
              </div>
              <p className="text-[12px] leading-relaxed text-white/55">{n.mecanismo_emocional}</p>
              {r && <p className="text-[12px] leading-relaxed text-white/55 italic">“{r.justificativa}”</p>}
              {/* WP-F.1: evidência concreta que pesou no score (sessões antigas não têm) */}
              {!!r?.evidencia?.length && (
                <ul className="space-y-1">
                  {r.evidencia.map((e, j) => (
                    <li key={j} className="text-[12px] leading-snug text-gold/80 border-l-2 border-gold/30 pl-2">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
              <details className="mt-auto">
                <summary className="cursor-pointer text-[11px] text-white/40 select-none hover:text-white/60">beats</summary>
                <ol className="mt-1.5 space-y-1 text-[12px] text-white/55 list-decimal list-inside">
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
    </Wrapper>
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
        {!disabled && <span className="text-[12px] text-white/55">clique para substituir o hook do roteiro</span>}
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

const fullScriptText = (s: Script) =>
  [s.headline, s.roteiro, s.comando, s.fontes ? `FONTES:\n${s.fontes}` : null].filter(Boolean).join("\n\n");

// Fechamento do flywheel: marcar publicado → ETL casa com o vídeo do corpus →
// performance real volta como chips e vira insight do agente Dados.
function PublishBox({ script, perf, baseline }: { script: Script; perf: ScriptPerformance | null; baseline: Baseline | null }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (script.status !== "published") {
    return (
      <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:p-5 space-y-3">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="kicker text-white/40">PUBLICOU ESTE ROTEIRO?</span>
          <span className="text-xs text-white/55">a performance real volta para cá e ensina a sala</span>
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
        <>
        {/* WP-F.2: baseline do cliente vs este vídeo — o multiplicador dá a escala do resultado */}
        {baseline && perf.views != null && (() => {
          const ratio = perf.views / baseline.views;
          const tone = ratioTone(ratio);
          const toneCls = tone === "gold" ? "text-gold" : tone === "amber" ? "text-amber-300" : "text-white/70";
          return (
            <p className="text-xs text-white/55">
              média {baseline.periodo === "30d" ? "30d" : "geral"} do cliente: {fmtNum(baseline.views)} → este vídeo:{" "}
              {fmtNum(perf.views)} <span className={`font-mono font-semibold ${toneCls}`}>({fmtRatio(ratio)})</span>
            </p>
          );
        })()}
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
        </>
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
        <span className="text-xs text-white/55">a sala reescreve usando esta versão como base</span>
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

// WP-F.3: 👍/👎 por versão — grava rating 5/1 sem encerrar a sessão; o último clique fica marcado.
function ThumbBtns({ scriptId, sessionId, rating }: { scriptId: string; sessionId: string; rating: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const send = (thumb: "up" | "down") =>
    startTransition(async () => {
      await quickFeedback(scriptId, sessionId, thumb);
      router.refresh();
    });
  const btn = (on: boolean) =>
    `rounded-lg border px-2.5 py-[5px] text-xs transition-colors disabled:opacity-40 ${
      on ? "border-gold/60 bg-gold/15" : "border-white/15 opacity-70 hover:opacity-100 hover:border-gold/50"
    }`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        aria-label="Aprovar esta versão"
        aria-pressed={rating != null && rating >= 4}
        disabled={pending}
        onClick={() => send("up")}
        className={btn(rating != null && rating >= 4)}
      >
        👍
      </button>
      <button
        aria-label="Descartar esta versão"
        aria-pressed={rating != null && rating <= 2}
        disabled={pending}
        onClick={() => send("down")}
        className={btn(rating != null && rating <= 2)}
      >
        👎
      </button>
    </span>
  );
}

// Bob inline (edição manual): dockado abaixo do textarea. Completa no cursor,
// reescreve a seleção ou pesquisa e insere — accept/recriar, insere no draft.
const BOB_MODOS: { key: BobModo; label: string; hint: string }[] = [
  { key: "completar", label: "Completar", hint: "escreve no cursor seguindo sua orientação" },
  { key: "reescrever", label: "Reescrever seleção", hint: "troca o trecho selecionado" },
  { key: "pesquisar", label: "Pesquisar e inserir", hint: "busca o dado na web e escreve na voz do cliente" },
];

function BobInlinePanel({
  sessionId,
  roteiro,
  sel,
  onCancel,
  onApply,
}: {
  sessionId: string;
  roteiro: string;
  sel: { start: number; end: number; trecho: string };
  onCancel: () => void;
  onApply: (texto: string, fonte?: string) => void;
}) {
  const [modo, setModo] = useState<BobModo>(sel.trecho ? "reescrever" : "completar");
  const [instrucao, setInstrucao] = useState("");
  const [sugestao, setSugestao] = useState<{ texto: string; fonte?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gerar = async (evitar?: string) => {
    if (!instrucao.trim()) return;
    if (modo === "reescrever" && !sel.trecho.trim()) return setError("selecione um trecho para reescrever");
    setLoading(true);
    setError(null);
    try {
      const r = await bobAssistAction(sessionId, {
        modo,
        roteiro,
        antes: roteiro.slice(0, sel.start),
        depois: roteiro.slice(sel.end),
        trecho: sel.trecho,
        instrucao: instrucao.trim(),
        evitar,
      });
      setSugestao(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-[12px] border border-gold/30 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <QuillIcon size={13} color="#c9a35c" />
        <span className="kicker text-gold">BOB</span>
        <span className="text-[11px] text-white/40">
          {sel.trecho ? `trecho: "${sel.trecho.slice(0, 60)}${sel.trecho.length > 60 ? "…" : ""}"` : "inserindo na posição do cursor"}
        </span>
        <button onClick={onCancel} aria-label="Fechar" className="ml-auto text-white/40 hover:text-white/80 text-lg leading-none">
          ×
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BOB_MODOS.map((m) => {
          const disabled = m.key === "reescrever" && !sel.trecho;
          return (
            <button
              key={m.key}
              onClick={() => setModo(m.key)}
              disabled={disabled}
              title={m.hint}
              className={`rounded-lg border px-3 py-[5px] text-xs transition-colors disabled:opacity-30 ${
                modo === m.key ? "border-gold/60 bg-gold/15 text-cream" : "border-white/15 text-white/60 hover:border-gold/40"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={instrucao}
        onChange={(e) => setInstrucao(e.target.value)}
        rows={2}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) gerar();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={
          modo === "pesquisar"
            ? "Ex: o número de obesos na China · a inflação dos EUA em 2024"
            : modo === "reescrever"
              ? "Ex: deixe mais simples · quero mais emoção · encurte"
              : "Ex: complete essa linha com um dado de impacto · adicione uma virada aqui"
        }
        className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
      />

      {sugestao !== null && (
        <div>
          <p className="text-[12px] text-white/55 mb-1.5">Sugestão da sala (edite se quiser)</p>
          <textarea
            value={sugestao.texto}
            onChange={(e) => setSugestao((s) => (s ? { ...s, texto: e.target.value } : s))}
            rows={Math.max(3, sugestao.texto.split("\n").length + 1)}
            className="w-full rounded-[10px] border border-gold/25 bg-black/20 px-3.5 py-2.5 text-[13.5px] leading-[1.7] text-cream outline-none focus:border-gold/50"
          />
          {sugestao.fonte && (
            <p className="mt-1.5 text-[11px] text-white/40 break-all">fonte (vai pro campo FONTES): {sugestao.fonte.replace(/\n/g, " · ")}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-300">{error}</p>}

      <div className="flex items-center gap-2.5 flex-wrap">
        {sugestao === null ? (
          <button
            onClick={() => gerar()}
            disabled={loading || !instrucao.trim()}
            className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
          >
            <QuillIcon color="#161410" />
            {loading ? (modo === "pesquisar" ? "Pesquisando..." : "Gerando...") : "Gerar"}
          </button>
        ) : (
          <>
            <button
              onClick={() => onApply(sugestao.texto, sugestao.fonte)}
              disabled={!sugestao.texto.trim()}
              className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
            >
              {sel.trecho && modo === "reescrever" ? "Substituir" : "Inserir"}
            </button>
            <button
              onClick={() => gerar(sugestao.texto)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/20 px-4 py-2 text-[13px] text-white/80 hover:border-gold/50 hover:text-cream transition-colors disabled:opacity-40"
            >
              {loading ? "Recriando..." : "Recriar"}
            </button>
          </>
        )}
        <button onClick={onCancel} className="text-[13px] text-white/45 hover:text-white/80 px-2">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Card do roteiro final: leitura, edição manual inline e "Chame o Bob" ──────
function ScriptCard({
  script,
  sessionId,
  disabled,
  rating,
}: {
  script: Script;
  sessionId: string;
  disabled: boolean;
  rating: number | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    headline: script.headline ?? "",
    hook: script.hook ?? "",
    roteiro: script.roteiro,
    comando: script.comando ?? "",
    fontes: script.fontes ?? "",
  });
  const [saving, startSave] = useTransition();
  const roteiroRef = useRef<HTMLParagraphElement>(null);
  const roteiroTaRef = useRef<HTMLTextAreaElement>(null);
  const [sel, setSel] = useState<{ x: number; y: number; start: number; end: number; trecho: string } | null>(null);
  const [bob, setBob] = useState<{ start: number; end: number; trecho: string } | null>(null);
  // Bob inline na edição (completar/reescrever/pesquisar) — insere no draft, não persiste.
  const [bobInline, setBobInline] = useState<{ start: number; end: number; trecho: string } | null>(null);

  const startEdit = () => {
    setSel(null);
    setDraft({
      headline: script.headline ?? "",
      hook: script.hook ?? "",
      roteiro: script.roteiro,
      comando: script.comando ?? "",
      fontes: script.fontes ?? "",
    });
    setEditing(true);
  };

  const save = () =>
    startSave(async () => {
      await updateScript(script.id, {
        headline: draft.headline.trim() || null,
        hook: draft.hook.trim() || null,
        roteiro: draft.roteiro,
        comando: draft.comando.trim() || null,
        fontes: draft.fontes.trim() || null,
      });
      setEditing(false);
      router.refresh();
    });

  // Seleção dentro do roteiro (nó de texto único) → offsets no string do roteiro.
  const onSelect = () => {
    if (editing || disabled) return;
    const s = window.getSelection();
    const p = roteiroRef.current;
    if (!s || s.isCollapsed || s.rangeCount === 0 || !p) return setSel(null);
    const range = s.getRangeAt(0);
    // o roteiro é um nó de texto único → offsets = índices no string. Só aceito seleção
    // contida nesse mesmo nó (senão os offsets não mapeiam pro string e o splice corromperia).
    const textNode = p.firstChild;
    if (
      !textNode ||
      textNode.nodeType !== Node.TEXT_NODE ||
      range.startContainer !== textNode ||
      range.endContainer !== textNode
    )
      return setSel(null);
    const start = Math.min(range.startOffset, range.endOffset);
    const end = Math.max(range.startOffset, range.endOffset);
    if (end - start < 2) return setSel(null);
    const rect = range.getBoundingClientRect();
    setSel({ x: rect.left + rect.width / 2, y: rect.top, start, end, trecho: script.roteiro.slice(start, end) });
  };

  const applyBob = (start: number, end: number, replacement: string) =>
    startSave(async () => {
      const novo = script.roteiro.slice(0, start) + replacement + script.roteiro.slice(end);
      await updateScript(script.id, { roteiro: novo });
      setBob(null);
      router.refresh();
    });

  // Abre o Bob inline na posição/seleção atual do textarea do roteiro.
  const openBobInline = (ta: HTMLTextAreaElement | null) => {
    const start = ta?.selectionStart ?? draft.roteiro.length;
    const end = ta?.selectionEnd ?? start;
    setBobInline({ start, end, trecho: draft.roteiro.slice(start, end) });
  };

  // Atalho: "/" no início da linha ou após espaço abre o Bob (a "/" não é digitada).
  const onRoteiroKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "/" || bobInline) return;
    const ta = e.currentTarget;
    const pos = ta.selectionStart ?? 0;
    const prev = pos === 0 ? "\n" : draft.roteiro[pos - 1];
    if (prev === "\n" || prev === " ") {
      e.preventDefault();
      openBobInline(ta);
    }
  };

  // Insere a sugestão do Bob no draft. Guard anti-drift: se a seleção não bate mais
  // (usuário mexeu no texto), insere no lugar em vez de substituir — nunca corrompe.
  const applyBobInline = (texto: string, fonte?: string) => {
    if (!bobInline) return;
    setDraft((d) => ({
      ...d,
      roteiro: spliceRoteiro(d.roteiro, bobInline, texto),
      fontes: fonte ? mergeFontes(d.fontes, fonte) : d.fontes,
    }));
    setBobInline(null);
  };

  const kicker = "kicker text-gold";
  const sectionCls = "px-5 sm:px-6 pt-5 pb-4 border-b border-white/[.07]";
  const taCls =
    "w-full rounded-[10px] border border-white/[.12] bg-black/20 px-3.5 py-2.5 text-[13.5px] leading-[1.7] outline-none focus:border-gold/40";

  return (
    <div
      className="rounded-[18px] border border-gold/30 overflow-hidden relative"
      style={{ background: "linear-gradient(180deg, rgba(201,163,92,.05), rgba(255,255,255,.02) 120px)" }}
    >
      <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3 border-b border-white/[.07] bg-black/20">
        <span className="kicker text-gold">ROTEIRO COMPLETO</span>
        {!editing && <ThumbBtns scriptId={script.id} sessionId={sessionId} rating={rating} />}
        {!disabled && !editing && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-[5px] text-xs text-white/65 hover:border-gold/50 hover:text-cream transition-colors"
          >
            <QuillIcon size={12} />
            Editar
          </button>
        )}
        {editing ? (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-lg border border-white/15 px-3 py-[5px] text-xs text-white/60 hover:text-white/90 disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="btn-gold rounded-lg px-3.5 py-[5px] text-xs font-semibold disabled:opacity-40"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <ShareBtn scriptId={script.id} />
            <CopyBtn text={fullScriptText(script)} label="Copiar tudo" />
          </div>
        )}
      </div>

      {/* HEADLINE */}
      {(editing || script.headline) && (
        <section className={sectionCls}>
          <div className="flex items-center gap-2.5">
            <span className={kicker}>HEADLINE</span>
            <span className="text-[11px] text-white/35">texto de tela</span>
          </div>
          {editing ? (
            <textarea
              value={draft.headline}
              onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              rows={2}
              className={`${taCls} mt-3 uppercase`}
            />
          ) : (
            <p className="font-cinzel text-base sm:text-lg font-semibold tracking-[.06em] leading-snug text-cream mt-3 uppercase">
              {script.headline}
            </p>
          )}
        </section>
      )}

      {/* HOOK */}
      {(editing || script.hook) && (
        <section className={sectionCls}>
          <div className="flex items-center gap-2.5">
            <span className={kicker}>HOOK</span>
          </div>
          {editing ? (
            <textarea
              value={draft.hook}
              onChange={(e) => setDraft((d) => ({ ...d, hook: e.target.value }))}
              rows={3}
              className={`${taCls} mt-3`}
            />
          ) : (
            <p className="font-display text-xl sm:text-[23px] font-medium leading-[1.4] text-ivory mt-3">
              &ldquo;{script.hook}&rdquo;
            </p>
          )}
        </section>
      )}

      {/* ROTEIRO */}
      <section className={sectionCls}>
        <div className="flex items-center gap-2.5">
          <span className={kicker}>ROTEIRO</span>
          {!disabled && !editing && (
            <span className="text-[12px] text-white/55">selecione um trecho para chamar o Bob</span>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={() => openBobInline(roteiroTaRef.current)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-[3px] text-[11px] text-white/65 hover:border-gold/50 hover:text-cream transition-colors"
              >
                <QuillIcon size={11} />
                Bob
              </button>
              <span className="text-[11px] text-white/35">
                selecione um trecho, ou digite <kbd className="font-mono text-white/55">/</kbd> pra chamar o Bob no cursor
              </span>
            </>
          )}
        </div>
        {editing ? (
          <textarea
            ref={roteiroTaRef}
            value={draft.roteiro}
            onChange={(e) => setDraft((d) => ({ ...d, roteiro: e.target.value }))}
            onKeyDown={onRoteiroKeyDown}
            rows={Math.max(10, draft.roteiro.split("\n").length + 1)}
            className={`${taCls} mt-3`}
          />
        ) : (
          <p
            ref={roteiroRef}
            onMouseUp={onSelect}
            className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#ededf0]/80 mt-3"
          >
            {script.roteiro}
          </p>
        )}
        {editing && bobInline && (
          <BobInlinePanel
            sessionId={sessionId}
            roteiro={draft.roteiro}
            sel={bobInline}
            onCancel={() => setBobInline(null)}
            onApply={applyBobInline}
          />
        )}
      </section>

      {/* COMANDO */}
      {(editing || script.comando) && (
        <section className="px-5 sm:px-6 pt-5 pb-5">
          <div className="flex items-center gap-2.5">
            <span className={kicker}>COMANDO</span>
            <span className="text-[11px] text-white/35">fechamento do roteiro</span>
          </div>
          {editing ? (
            <textarea
              value={draft.comando}
              onChange={(e) => setDraft((d) => ({ ...d, comando: e.target.value }))}
              rows={3}
              className={`${taCls} mt-3`}
            />
          ) : (
            <p className="text-[13.5px] leading-relaxed text-[#ededf0]/80 mt-3">&ldquo;{script.comando}&rdquo;</p>
          )}
        </section>
      )}

      {/* FONTES */}
      {(editing || script.fontes) && (
        <section className="px-5 sm:px-6 pt-4 pb-5 border-t border-white/[.07] bg-black/20">
          <div className="flex items-center gap-2.5">
            <span className="kicker text-white/40">FONTES</span>
            <span className="text-[12px] text-white/55">confira nos links</span>
          </div>
          {editing ? (
            <textarea
              value={draft.fontes}
              onChange={(e) => setDraft((d) => ({ ...d, fontes: e.target.value }))}
              rows={4}
              className={`${taCls} mt-2.5 font-mono text-[11.5px]`}
            />
          ) : (
            <p className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-white/50 mt-2.5">
              <Linkified text={script.fontes!} />
            </p>
          )}
        </section>
      )}

      {/* botão flutuante "Chame o Bob" ao selecionar trecho */}
      {sel && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setBob({ start: sel.start, end: sel.end, trecho: sel.trecho });
            setSel(null);
          }}
          style={{ position: "fixed", left: sel.x, top: sel.y - 42, transform: "translateX(-50%)", zIndex: 40 }}
          className="btn-gold inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-lg whitespace-nowrap"
        >
          <QuillIcon size={12} color="#161410" />
          Chame o Bob
        </button>
      )}

      {bob && (
        <BobModal
          sessionId={sessionId}
          roteiro={script.roteiro}
          trecho={bob.trecho}
          busy={saving}
          onClose={() => setBob(null)}
          onAccept={(replacement) => applyBob(bob.start, bob.end, replacement)}
        />
      )}
    </div>
  );
}

// Janela flutuante do "Chame o Bob": mostra o trecho, coleta o pedido, gera a sugestão
// (editável) e oferece Aceitar (aplica no roteiro) ou Recriar (gera outra).
function BobModal({
  sessionId,
  roteiro,
  trecho,
  busy,
  onClose,
  onAccept,
}: {
  sessionId: string;
  roteiro: string;
  trecho: string;
  busy: boolean;
  onClose: () => void;
  onAccept: (replacement: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [instrucao, setInstrucao] = useState("");
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // <dialog> nativo (padrão do client-prefs-editor): Esc e backdrop fecham de graça
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const gerar = async (evitar?: string) => {
    if (!instrucao.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await suggestFragment(sessionId, { roteiro, trecho, instrucao: instrucao.trim(), evitar });
      setSugestao(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close();
      }}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(560px,92vw)] max-h-[85vh] rounded-2xl border border-gold/30 bg-[#161410] text-[#ededf0] p-0 shadow-2xl"
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <QuillIcon size={15} color="#c9a35c" />
          <span className="kicker text-gold">CHAME O BOB</span>
          <button
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="ml-auto text-white/40 hover:text-white/80 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div>
          <p className="text-[12px] text-white/55 mb-1.5">Trecho que será substituído</p>
          <p className="rounded-[10px] border border-white/10 bg-white/[.03] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/70 whitespace-pre-wrap">
            {trecho}
          </p>
        </div>

        <div>
          <p className="text-[12px] text-white/55 mb-1.5">O que você quer mudar?</p>
          <textarea
            value={instrucao}
            onChange={(e) => setInstrucao(e.target.value)}
            rows={2}
            autoFocus
            placeholder="Ex: deixe mais simples de entender · quero mais emoção nessa parte · encurte"
            className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
          />
        </div>

        {sugestao !== null && (
          <div>
            <p className="text-[12px] text-white/55 mb-1.5">Sugestão da sala (edite se quiser)</p>
            <textarea
              value={sugestao}
              onChange={(e) => setSugestao(e.target.value)}
              rows={Math.max(3, sugestao.split("\n").length + 1)}
              className="w-full rounded-[10px] border border-gold/25 bg-black/20 px-3.5 py-2.5 text-[13.5px] leading-[1.7] text-cream outline-none focus:border-gold/50"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-300">{error}</p>}

        <div className="flex items-center gap-2.5 flex-wrap">
          {sugestao === null ? (
            <button
              onClick={() => gerar()}
              disabled={loading || !instrucao.trim()}
              className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
            >
              <QuillIcon color="#161410" />
              {loading ? "Gerando..." : "Gerar"}
            </button>
          ) : (
            <>
              <button
                onClick={() => onAccept(sugestao)}
                disabled={busy || !sugestao.trim()}
                className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
              >
                {busy ? "Aplicando..." : "Aceitar"}
              </button>
              <button
                onClick={() => gerar(sugestao)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-[10px] border border-white/20 px-4 py-2 text-[13px] text-white/80 hover:border-gold/50 hover:text-cream transition-colors disabled:opacity-40"
              >
                {loading ? "Recriando..." : "Recriar"}
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

// Dialog de confirmação nativo — substitui o confirm() do navegador (Esc/backdrop cancelam).
function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmed = useRef(false);
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      onClose={() => (confirmed.current ? onConfirm() : onCancel())}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close();
      }}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(440px,92vw)] rounded-2xl border border-gold/30 bg-[#161410] text-[#ededf0] p-0 shadow-2xl"
    >
      <div className="p-5 sm:p-6 space-y-4">
        <p className="text-[13.5px] leading-relaxed text-white/80">{message}</p>
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={() => dialogRef.current?.close()}
            className="rounded-[10px] px-4 py-2 text-[13px] text-white/60 hover:text-white hover:bg-white/[.06]"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              confirmed.current = true;
              dialogRef.current?.close();
            }}
            className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function SessionView({
  session,
  scripts,
  performance,
  baseline,
  lastRating,
  analyses,
  artifacts,
  autoStart,
  generationStale,
}: {
  session: { id: string; prompt: string; status: string; error_message: string | null; clientNome: string | null };
  scripts: Script[];
  performance: ScriptPerformance[];
  baseline: Baseline | null;
  lastRating: Record<string, number>;
  analyses: { analysis: unknown; replication_brief: string }[];
  artifacts: SessionArtifacts | null;
  autoStart: boolean;
  generationStale: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(
    session.error_message ??
      (generationStale ? "A geração anterior foi interrompida (mais de 10 minutos sem concluir)." : null)
  );
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(0);
  const [confirmPick, setConfirmPick] = useState<number | null>(null);
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
            let e;
            try {
              e = JSON.parse(line.slice(6));
            } catch {
              continue; // evento truncado/corrompido não aborta o stream
            }
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

  // Geração em andamento em outra conexão (montou com status=generating não-stale):
  // modo "acompanhando" — polling leve até sair de generating, o refresh traz o resultado.
  const watching = session.status === "generating" && !generationStale && !generating;
  useEffect(() => {
    if (!watching) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [watching, router]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [streamText]);

  const script = scripts[selected];
  const closed = session.status === "closed";

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
          {(generating || watching) && (
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
            <div key={i} className="mt-3 space-y-3 text-sm">
              <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{a.replication_brief}</p>
              <AnalysisSections analysis={a.analysis} />
              <details>
                <summary className="cursor-pointer text-xs text-white/40 select-none">JSON cru</summary>
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

      {/* geração iniciada em outra aba/conexão: acompanha por polling, sem stream */}
      {watching && (
        <div className="rounded-2xl border border-gold/25 bg-gold/[.04] px-4 py-3.5 text-[13px] text-white/70">
          Geração em andamento nesta sessão. Acompanhando — a página atualiza sozinha quando o roteiro ficar pronto.
        </div>
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
          disabled={generating || watching || closed}
          onPick={setConfirmPick}
          collapsible={!generating && !!script}
        />
      )}

      {/* confirmação da troca de narrativa — dialog nativo no lugar do confirm() */}
      {confirmPick != null && (
        <ConfirmDialog
          message="Reescrever o roteiro com esta narrativa? A pesquisa e as candidatas são reaproveitadas; só a escrita é refeita."
          confirmLabel="Reescrever"
          onCancel={() => setConfirmPick(null)}
          onConfirm={() => {
            const i = confirmPick;
            setConfirmPick(null);
            setNarrativas((prev) => (prev ? { ...prev, escolhida: i } : prev));
            generate(i);
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

          <ScriptCard script={script} sessionId={session.id} disabled={closed} rating={lastRating[script.id] ?? null} />

          {!!script.hook_variants?.length && (
            <HookVariants scriptId={script.id} variants={script.hook_variants} disabled={generating || watching || closed} />
          )}

          {/* visível também com sessão encerrada — a publicação acontece depois */}
          <PublishBox script={script} perf={performance.find((p) => p.script_id === script.id) ?? null} baseline={baseline} />


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
              {/* WP-F.4: os trechos violados, não só a contagem (trace.violations) */}
              {script.violations.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] text-white/55 select-none hover:text-white/75">
                    ver trechos
                  </summary>
                  <ul className="mt-1.5 space-y-1">
                    {script.violations.map((v, i) => (
                      <li key={i} className="text-[12px] leading-relaxed text-white/60">
                        <span className="text-amber-300/90">{v.label}</span>
                        {v.match && (
                          <>
                            {" "}
                            — <span className="font-mono text-[11.5px] text-white/55">&ldquo;{v.match}&rdquo;</span>
                          </>
                        )}
                        {v.severity === "warn" && <span className="text-white/40"> (aviso)</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {!closed && !watching && (
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
                <span className="text-[12px] text-white/55">mesma narrativa · pesquisa reaproveitada</span>
              </div>
              <FeedbackForm sessionId={session.id} scriptId={script.id} editedInline={script.edicao_humana} />
            </>
          )}
        </div>
      )}

      {!generating && !watching && !script && !error && (
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

// WP-F.6: analysis (jsonb) como seções legíveis — chave top-level vira título, valores viram texto/lista.
function AnalysisSections({ analysis }: { analysis: unknown }) {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) return null;
  const pretty = (k: string) => k.replace(/_/g, " ");
  const line = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : JSON.stringify(v));
  const renderVal = (v: unknown) => {
    if (v == null || v === "") return null;
    if (Array.isArray(v)) {
      if (!v.length) return null;
      return (
        <ul className="space-y-1 text-[12.5px] leading-relaxed text-white/70 list-disc list-inside">
          {v.map((it, i) => (
            <li key={i}>{line(it)}</li>
          ))}
        </ul>
      );
    }
    if (typeof v === "object") {
      return (
        <div className="space-y-1">
          {Object.entries(v as Record<string, unknown>).map(([k2, v2]) =>
            v2 == null || v2 === "" ? null : (
              <p key={k2} className="text-[12.5px] leading-relaxed text-white/70">
                <span className="text-white/45">{pretty(k2)}: </span>
                {line(v2)}
              </p>
            )
          )}
        </div>
      );
    }
    return <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/70">{String(v)}</p>;
  };
  return (
    <div className="space-y-3">
      {Object.entries(analysis as Record<string, unknown>).map(([k, v]) => {
        const body = renderVal(v);
        if (!body) return null;
        return (
          <div key={k}>
            <div className="kicker text-amber-300/80 text-[10px] mb-1">{pretty(k)}</div>
            {body}
          </div>
        );
      })}
    </div>
  );
}

// Finaliza a sessão (vira "Encerrada" na lista); feedback opcional alimenta o aprendizado.
function FeedbackForm({
  sessionId,
  scriptId,
  editedInline,
}: {
  sessionId: string;
  scriptId: string;
  editedInline: boolean;
}) {
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
        <span className="text-xs text-white/55">avaliação opcional</span>
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
      {editedInline ? (
        // WP-E já preserva o original no trace: a versão editada inline vira a versão final sozinha
        <p className="text-[12px] leading-relaxed text-white/55 border-l-2 border-gold/30 pl-3">
          Edição inline detectada — a versão editada será usada automaticamente como versão final no aprendizado.
        </p>
      ) : (
        <textarea
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          rows={3}
          placeholder="Se você editou o roteiro antes de usar, cole a versão final aqui — é o insumo mais valioso para o sistema aprender."
          className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
        />
      )}
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
