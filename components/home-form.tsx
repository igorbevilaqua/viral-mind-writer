"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSession, type NewAttachment } from "@/lib/actions";

const KIND_LABELS: Record<NewAttachment["kind"], { label: string; placeholder: string }> = {
  reference_script: { label: "Roteiro de referência", placeholder: "Cole o roteiro de referência..." },
  news_link: { label: "Notícia", placeholder: "Cole o texto da notícia ou artigo..." },
  document: { label: "Documento", placeholder: "Cole o conteúdo do documento..." },
  video_link: { label: "Vídeo", placeholder: "Cole a transcrição do vídeo (a automação por link vem em breve)..." },
};

const KIND_ICONS: Record<NewAttachment["kind"], React.ReactNode> = {
  reference_script: (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h6l3 3v9H4V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 8h4M6.5 10.5h4M6.5 5.5h1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  news_link: (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 6h4M4.5 8h7M4.5 10h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  document: (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8v12H4V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 5h4M6 7.5h4M6 10h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  video_link: (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 7.5 14 5.5v5l-3-2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
};

function QuillIcon({ dark }: { dark?: boolean }) {
  const c = dark ? "#161410" : "currentColor";
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M11 2.5 13.5 5M9.5 4 3 10.5 2.5 13.5 5.5 13 12 6.5 9.5 4Z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 9.5l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4.4-1.1Z" fill={c} />
    </svg>
  );
}

export default function HomeForm({ clients }: { clients: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [clientId, setClientId] = useState("");
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [pending, startTransition] = useTransition();

  const addAttachment = (kind: NewAttachment["kind"]) =>
    setAttachments((a) => [...a, { kind, is_modelagem: false, url: "", raw_content: "" }]);

  const update = (i: number, patch: Partial<NewAttachment>) =>
    setAttachments((a) => a.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const submit = () => {
    if (!prompt.trim()) return;
    startTransition(async () => {
      const id = await createSession({
        prompt: prompt.trim(),
        clientId: clientId || null,
        attachments: attachments.filter((a) => a.raw_content.trim() || a.url.trim()),
      });
      router.push(`/sessions/${id}?start=1`);
    });
  };

  return (
    <div className="w-full max-w-2xl mt-9">
      {/* prompt */}
      <div className="rounded-[18px] border border-white/[.12] bg-white/[.03] overflow-hidden focus-within:border-gold/40 transition-colors">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Descreva o vídeo: tema, ângulo, formato…"
          className="w-full bg-transparent resize-none outline-none px-5 pt-5 pb-2 text-[15px] leading-relaxed placeholder:text-white/35"
        />
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-white/[.07] bg-white/[.02] flex-wrap">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-[10px] border border-indigo-500/40 bg-indigo-500/[.07] px-3.5 py-2 text-[12.5px] text-indigo-300 outline-none cursor-pointer"
          >
            <option value="" className="bg-neutral-900 text-white">
              Sem cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                {c.nome}
              </option>
            ))}
          </select>
          <button
            onClick={submit}
            disabled={pending || !prompt.trim()}
            className="btn-gold ml-auto inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-semibold disabled:opacity-40"
          >
            <QuillIcon dark />
            {pending ? "Conjurando..." : "Conjurar roteiro"}
          </button>
        </div>
      </div>

      {/* materiais de apoio */}
      <div className="mt-6">
        <div className="flex items-baseline gap-2.5">
          <span className="kicker text-white/40">MATERIAIS DE APOIO</span>
          <span className="text-xs text-white/30">opcional</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          {(Object.keys(KIND_LABELS) as NewAttachment["kind"][]).map((kind) => (
            <button
              key={kind}
              onClick={() => addAttachment(kind)}
              className="flex flex-col gap-2 rounded-[14px] border border-white/10 bg-white/[.02] p-4 text-left text-white/60 hover:border-gold/40 hover:text-white/85 transition-colors"
            >
              {KIND_ICONS[kind]}
              <span className="text-[12.5px] text-white/75">{KIND_LABELS[kind].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* anexos adicionados */}
      <div className="space-y-3 mt-3">
        {attachments.map((a, i) => (
          <div
            key={i}
            className={`rounded-[14px] border p-4 space-y-3 ${
              a.is_modelagem ? "border-amber-500/35 bg-amber-500/[.04]" : "border-white/10 bg-white/[.02]"
            }`}
          >
            <div className="flex items-center gap-2.5 text-[13px] flex-wrap">
              <span className={a.is_modelagem ? "text-amber-300" : "text-white/70"}>{KIND_ICONS[a.kind]}</span>
              <span className={a.is_modelagem ? "text-amber-200 font-medium" : "text-white/80"}>
                {KIND_LABELS[a.kind].label}
                {a.is_modelagem && " · Modelagem ativa"}
              </span>
              <label className="ml-auto inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={a.is_modelagem}
                  onChange={(e) => update(i, { is_modelagem: e.target.checked })}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium ${
                    a.is_modelagem
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : "border-white/15 text-white/45 hover:border-amber-500/40 hover:text-amber-300"
                  }`}
                >
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M9 1 3 9.5h4L7 15l6-8.5H9L9 1Z" />
                  </svg>
                  Modelagem
                </span>
              </label>
              <button
                onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}
                className="text-white/40 hover:text-white"
                aria-label="Remover anexo"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {a.is_modelagem && (
              <p className="text-xs text-white/40">
                — a estrutura, emoções e elementos virais deste material serão desconstruídos e replicados no seu tema
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {(a.kind === "news_link" || a.kind === "video_link") && (
                <input
                  value={a.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="Link (opcional)"
                  className="flex-1 rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 font-mono text-[12.5px] outline-none placeholder:text-white/30 focus:border-gold/40"
                />
              )}
              <textarea
                value={a.raw_content}
                onChange={(e) => update(i, { raw_content: e.target.value })}
                rows={a.kind === "news_link" || a.kind === "video_link" ? 1 : 4}
                placeholder={KIND_LABELS[a.kind].placeholder}
                className="flex-1 rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[12.5px] resize-y outline-none placeholder:text-white/35 focus:border-gold/40"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
