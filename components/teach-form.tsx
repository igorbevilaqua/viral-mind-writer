"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLesson, type LessonLearningInput } from "@/lib/actions";
import type { Dimensao, ExtractedLearning } from "@/lib/pipeline/teach";
import { DIMENSAO_ORDER, DIMENSAO_LABEL, DIMENSAO_CLS } from "./dimensoes";

const VIDEO_URL = /youtube\.com|youtu\.be|instagram\.com|tiktok\.com/i;

interface ReviewItem extends LessonLearningInput {
  key: number;
}

export default function TeachForm({ clients }: { clients: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [sourceKind, setSourceKind] = useState<"video_link" | "texto">("video_link");
  const [url, setUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [clientId, setClientId] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [saving, startSaving] = useTransition();

  // busca a transcrição ao colar o link (mesma rota do formulário de sessão)
  const transcribe = async () => {
    if (!VIDEO_URL.test(url) || transcript.trim() || transcribing) return;
    setTranscribing(true);
    setError(null);
    try {
      const res = await fetch("/api/transcribe-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "falha na transcrição");
      setSourceTitle(data.title ?? null);
      setTranscript(data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTranscribing(false);
    }
  };

  const extract = async () => {
    if (!transcript.trim() || extracting) return;
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-learnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          sourceUrl: sourceKind === "video_link" ? url : undefined,
          contextNote: contextNote || undefined,
          clientNome: clients.find((c) => c.id === clientId)?.nome,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "falha na extração");
      setItems(
        (data.learnings as ExtractedLearning[]).map((l, i) => ({
          key: i,
          dimensao: l.dimensao,
          titulo: l.titulo,
          descricao: l.descricao,
          evidencia: l.evidencia ?? null,
          origem: "extraido",
          active: true,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExtracting(false);
    }
  };

  const update = (key: number, patch: Partial<ReviewItem>) =>
    setItems((arr) => (arr ?? []).map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const addManual = () =>
    setItems((arr) => [
      ...(arr ?? []),
      {
        key: Math.max(0, ...(arr ?? []).map((x) => x.key)) + 1,
        dimensao: "geral",
        titulo: "",
        descricao: "",
        evidencia: null,
        origem: "manual",
        active: true,
      },
    ]);

  const save = () =>
    startSaving(async () => {
      try {
        const id = await saveLesson({
          clientId: clientId || null,
          sourceKind,
          sourceUrl: sourceKind === "video_link" ? url.trim() || null : null,
          sourceTitle,
          transcript,
          contextNote: contextNote.trim() || null,
          learnings: (items ?? [])
            .filter((l) => l.titulo.trim() && l.descricao.trim())
            .map(({ key: _key, ...l }) => l),
        });
        router.push(`/ensinar/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

  const ordered = DIMENSAO_ORDER.flatMap((d) => (items ?? []).filter((l) => l.dimensao === d));

  return (
    <div className="w-full max-w-2xl mt-8 space-y-5">
      {/* passo 1: fonte */}
      <div className="rounded-[18px] border border-white/[.12] bg-white/[.03] p-5 space-y-4">
        <div className="flex items-center gap-2">
          {(["video_link", "texto"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSourceKind(k)}
              disabled={!!items}
              className={`rounded-[10px] border px-4 py-2 text-[12.5px] transition-colors disabled:opacity-50 ${
                sourceKind === k
                  ? "border-gold/50 bg-gold/10 text-cream"
                  : "border-white/[.12] text-white/60 hover:border-white/30"
              }`}
            >
              {k === "video_link" ? "Link de vídeo" : "Roteiro em texto"}
            </button>
          ))}
        </div>

        {sourceKind === "video_link" && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={transcribe}
            disabled={!!items}
            placeholder="Link do vídeo viral (YouTube/Shorts, Reels, TikTok)"
            className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 font-mono text-[12.5px] outline-none placeholder:text-white/30 focus:border-gold/40 disabled:opacity-60"
          />
        )}
        {transcribing && <p className="text-xs text-gold/70">Buscando transcrição do vídeo...</p>}

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={!!items}
          rows={sourceKind === "texto" ? 8 : 4}
          placeholder={
            sourceKind === "video_link"
              ? "A transcrição aparece aqui — ou cole manualmente..."
              : "Cole o roteiro viral completo..."
          }
          className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[12.5px] resize-y outline-none placeholder:text-white/35 focus:border-gold/40 disabled:opacity-60"
        />

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={!!items}
            className="rounded-[10px] border border-indigo-500/40 bg-indigo-500/[.07] px-3.5 py-2 text-[12.5px] text-indigo-300 outline-none cursor-pointer disabled:opacity-60"
          >
            <option value="" className="bg-neutral-900 text-white">
              Global — vale para todos
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                {c.nome}
              </option>
            ))}
          </select>
          <input
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            disabled={!!items}
            placeholder="Contexto (opcional): por que este vídeo importa, o que observar..."
            className="flex-1 min-w-[220px] rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2 text-[12.5px] outline-none placeholder:text-white/35 focus:border-gold/40 disabled:opacity-60"
          />
        </div>

        {!items && (
          <button
            onClick={extract}
            disabled={!transcript.trim() || extracting}
            className="btn-gold inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-semibold disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="#161410">
              <path d="M8 1.5l1.4 3.6 3.6 1.4-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5Z" />
            </svg>
            {extracting ? "Professor analisando o viral..." : "Extrair aprendizados"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/[.05] px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {/* passo 2: revisão */}
      {items && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2.5">
            <span className="kicker text-gold">APRENDIZADOS EXTRAÍDOS</span>
            <span className="text-xs text-white/30">desmarque o que discordar · edite · adicione os seus</span>
          </div>

          {ordered.map((l) => (
            <div
              key={l.key}
              className={`rounded-[14px] border p-4 space-y-2.5 transition-colors ${
                l.active ? "border-white/10 bg-white/[.02]" : "border-white/[.06] bg-white/[.01] opacity-50"
              }`}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={l.active}
                    onChange={(e) => update(l.key, { active: e.target.checked })}
                    className="accent-[#c9a35c] w-4 h-4"
                  />
                </label>
                <select
                  value={l.dimensao}
                  onChange={(e) => update(l.key, { dimensao: e.target.value as Dimensao })}
                  className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium outline-none cursor-pointer ${DIMENSAO_CLS[l.dimensao]}`}
                >
                  {DIMENSAO_ORDER.map((d) => (
                    <option key={d} value={d} className="bg-neutral-900 text-white">
                      {DIMENSAO_LABEL[d]}
                    </option>
                  ))}
                </select>
                {l.origem === "manual" && <span className="text-[10.5px] text-white/35">manual</span>}
              </div>
              <input
                value={l.titulo}
                onChange={(e) => update(l.key, { titulo: e.target.value })}
                placeholder="Título do aprendizado (curto, imperativo)"
                className="w-full rounded-[10px] border border-white/[.1] bg-transparent px-3 py-2 text-[13.5px] font-medium text-cream outline-none placeholder:text-white/35 focus:border-gold/40"
              />
              <textarea
                value={l.descricao}
                onChange={(e) => update(l.key, { descricao: e.target.value })}
                rows={2}
                placeholder="Por que funciona (o mecanismo)"
                className="w-full rounded-[10px] border border-white/[.1] bg-transparent px-3 py-2 text-[12.5px] text-white/75 resize-y outline-none placeholder:text-white/35 focus:border-gold/40"
              />
              {l.evidencia && (
                <details>
                  <summary className="cursor-pointer text-[11px] text-white/40 select-none hover:text-white/60">
                    evidência na transcrição
                  </summary>
                  <p className="mt-1.5 text-[12px] italic text-white/50 leading-relaxed">“{l.evidencia}”</p>
                </details>
              )}
            </div>
          ))}

          <button
            onClick={addManual}
            className="rounded-[10px] border border-white/15 px-4 py-2 text-[12.5px] text-white/70 hover:border-gold/50 hover:text-cream transition-colors"
          >
            + Adicionar aprendizado
          </button>

          <details className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-3">
            <summary className="cursor-pointer text-[12px] text-white/40 select-none">transcrição completa</summary>
            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-white/55 max-h-64 overflow-y-auto">
              {transcript}
            </p>
          </details>

          {/* passo 3: salvar */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <button
              onClick={save}
              disabled={saving || !items.some((l) => l.active && l.titulo.trim())}
              className="btn-gold inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-semibold disabled:opacity-40"
            >
              {saving ? "Salvando..." : "Salvar aprendizados"}
            </button>
            <span className="text-[11.5px] text-white/35 max-w-sm">
              Aprovados passam a influenciar a sala de agentes imediatamente; desmarcados ficam guardados na lição.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
