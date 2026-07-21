"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSession, type NewAttachment } from "@/lib/actions";
import type { ThemeSuggestion } from "@/lib/pipeline/suggest";

const KIND_LABELS: Record<NewAttachment["kind"], { label: string; placeholder: string }> = {
  reference_script: { label: "Roteiro de referência", placeholder: "Cole o roteiro de referência..." },
  news_link: {
    label: "Notícia",
    placeholder: "Comentários sobre a notícia: ângulo desejado, o que destacar, o que evitar... (considerados na produção do roteiro)",
  },
  document: { label: "Documento", placeholder: "O texto extraído do arquivo aparece aqui para revisão, ou cole o conteúdo direto..." },
  video_link: { label: "Vídeo", placeholder: "Opcional: cole a transcrição do vídeo aqui. Se deixar em branco, buscamos ao conjurar." },
};

// Frases que rotacionam durante a espera de cada fase — a pesquisa é a longa, então tem mais.
const SUGGEST_MESSAGES: Record<string, string[]> = {
  dados: [
    "Lendo dados, preferências e hits de clientes afins...",
    "Cruzando padrões validados por performance e recência...",
  ],
  pesquisa: [
    "Caçador de pautas varrendo a web e o X em tempo real...",
    "Rastreando o que está bombando agora no nicho...",
    "Separando o que tem tração de verdade do ruído...",
    "Conferindo datas, números e fontes das oportunidades...",
  ],
  sintese: [
    "Diretor de pauta cruzando dados validados com a pesquisa...",
    "Rankeando da aposta mais forte à mais fraca...",
    "Escrevendo ângulo, abordagem e gancho de cada tema...",
  ],
};

// Modelagem (desconstruir e replicar a arquitetura) só faz sentido para material com estrutura de vídeo.
const CAN_MODELAGEM: NewAttachment["kind"][] = ["reference_script", "video_link"];
const DOC_ACCEPT = ".pdf,.doc,.docx,.txt,.html,.htm,.md,.csv,.xls,.xlsx,.ppt,.pptx,.rtf";

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
  const [extracting, setExtracting] = useState<number | null>(null);
  const [extractError, setExtractError] = useState<Record<number, string>>({});
  const [suggestPhase, setSuggestPhase] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<ThemeSuggestion[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Rotaciona as frases de status enquanto a fase está ativa (reseta a cada troca de fase).
  useEffect(() => {
    if (!suggestPhase) return;
    setMsgIdx(0);
    const id = setInterval(() => setMsgIdx((i) => i + 1), 2600);
    return () => clearInterval(id);
  }, [suggestPhase]);

  // Textarea que cresce com o conteúdo (sugestão aceita pode ser longa) até um teto, aí rola.
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 340)}px`;
  }, [prompt]);

  const addAttachment = (kind: NewAttachment["kind"]) =>
    setAttachments((a) => [...a, { kind, is_modelagem: false, url: "", raw_content: "" }]);

  const update = (i: number, patch: Partial<NewAttachment>) =>
    setAttachments((a) => a.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const extractFile = async (i: number, file?: File | null) => {
    if (!file) return;
    setExtracting(i);
    setExtractError((e) => ({ ...e, [i]: "" }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-file", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "falha na extração");
      update(i, { raw_content: data.text, url: data.filename });
    } catch (e) {
      setExtractError((x) => ({ ...x, [i]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setExtracting(null);
    }
  };

  // Ideador: pesquisa + dados do cliente → sugestões de tema com alto potencial
  const suggest = async () => {
    if (!clientId || suggestPhase) return;
    setSuggestPhase("dados");
    setSuggestError(null);
    setSugestoes([]);
    try {
      const res = await fetch("/api/suggest-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
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
          if (e.type === "phase") setSuggestPhase(e.phase);
          if (e.type === "done") setSugestoes(e.sugestoes);
          if (e.type === "error") setSuggestError(e.message);
        }
      }
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : String(e));
    } finally {
      setSuggestPhase(null);
    }
  };

  const applyTheme = (s: ThemeSuggestion) => {
    setPrompt(
      `${s.tema}\n\nÂNGULO NARRATIVO: ${s.angulo_narrativo}\nABORDAGEM: ${s.forma_abordagem}${
        s.estrutura_sugerida ? `\nESTRUTURA SUGERIDA: ${s.estrutura_sugerida}` : ""
      }${s.gancho_potencial ? `\nDIREÇÃO DE GANCHO: ${s.gancho_potencial}` : ""}\n\nINFORMAÇÕES DE APOIO:\n${s.informacoes_de_apoio
        .map((f) => `- ${f}`)
        .join("\n")}`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Um anexo sozinho já basta pra conjurar (sem tema): notícia com link, documento/roteiro
  // com conteúdo, vídeo com link. Mesmo critério do filtro do submit — fonte única.
  const isUsable = (a: NewAttachment) => (a.kind === "news_link" ? a.url.trim() : a.raw_content.trim() || a.url.trim());
  const canSubmit = !!prompt.trim() || attachments.some(isUsable);

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const id = await createSession({
        prompt: prompt.trim(),
        clientId: clientId || null,
        attachments: attachments.filter(isUsable),
      });
      router.push(`/sessions/${id}?start=1`);
    });
  };

  return (
    <div className="w-full max-w-2xl mt-9">
      {/* prompt */}
      <div className="rounded-[18px] border border-white/[.12] bg-white/[.03] overflow-hidden focus-within:border-gold/40 transition-colors">
        <textarea
          ref={promptRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Descreva o vídeo: tema, ângulo, formato…"
          className="w-full bg-transparent resize-none outline-none px-5 pt-5 pb-2 text-[15px] leading-relaxed placeholder:text-white/35 overflow-y-auto"
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
            onClick={suggest}
            disabled={!clientId || !!suggestPhase}
            title={clientId ? "Sugerir temas com alto potencial para este cliente" : "Selecione um cliente para sugerir temas"}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-gold/35 bg-gold/[.06] px-3.5 py-2 text-[12.5px] text-gold disabled:opacity-35 disabled:cursor-not-allowed hover:bg-gold/[.12] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5l1.4 3.6 3.6 1.4-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5ZM13 10l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7L13 10Z" />
            </svg>
            {suggestPhase ? "Sugerindo..." : "Sugerir tema"}
          </button>
          <button
            onClick={submit}
            disabled={pending || !canSubmit}
            className="btn-gold ml-auto inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-semibold disabled:opacity-40"
          >
            <QuillIcon dark />
            {pending ? "Conjurando..." : "Conjurar roteiro"}
          </button>
        </div>
      </div>

      {/* sugestões de tema (ideador) */}
      {suggestPhase && (
        <div className="mt-4 rounded-[14px] border border-gold/25 bg-gold/[.04] px-4 py-3.5 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gold vm-pulse shrink-0" />
          {(() => {
            const msgs = SUGGEST_MESSAGES[suggestPhase] ?? SUGGEST_MESSAGES.dados;
            const msg = msgs[msgIdx % msgs.length];
            return (
              <p key={msg} className="text-[13px] text-white/70 vm-fade-in">
                {msg}
              </p>
            );
          })()}
        </div>
      )}
      {suggestError && (
        <div className="mt-4 rounded-[14px] border border-red-500/30 bg-red-500/[.05] px-4 py-3 text-[13px] text-red-300">
          Erro ao sugerir temas: {suggestError}
        </div>
      )}
      {sugestoes.length > 0 && (
        <div className="mt-5">
          <div className="flex items-baseline gap-2.5">
            <span className="kicker text-gold">TEMAS SUGERIDOS</span>
            <span className="text-xs text-white/30">dados validados × pesquisa de agora · da aposta mais forte à mais fraca</span>
          </div>
          <div className="space-y-3 mt-3">
            {sugestoes.map((s, i) => (
              <div key={i} className="rounded-[14px] border border-white/10 bg-white/[.02] p-4 hover:border-gold/30 transition-colors">
                <div className="flex items-start gap-2.5 flex-wrap">
                  <span className="font-display text-gold/70 text-lg leading-none mt-0.5">{i + 1}.</span>
                  <p className="flex-1 min-w-0 text-[14.5px] font-medium text-cream leading-snug">{s.tema}</p>
                  <button
                    onClick={() => applyTheme(s)}
                    className="btn-gold shrink-0 rounded-[9px] px-3.5 py-1.5 text-[12px] font-semibold"
                  >
                    Usar este tema
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {s.estrutura_sugerida && (
                    <span className="rounded-full border border-gold/35 bg-gold/[.06] px-2.5 py-0.5 text-[10.5px] text-gold">
                      {s.estrutura_sugerida}
                    </span>
                  )}
                  {s.reaproveitado_de && (
                    <span
                      className="rounded-full border border-emerald-500/35 bg-emerald-500/[.07] px-2.5 py-0.5 text-[10.5px] text-emerald-300"
                      title={`"${s.reaproveitado_de.titulo}"`}
                    >
                      ♻ reaproveitado de {s.reaproveitado_de.cliente_origem} ·{" "}
                      {s.reaproveitado_de.views >= 1_000_000
                        ? `${Math.round(s.reaproveitado_de.views / 1_000_000)}M`
                        : `${Math.round(s.reaproveitado_de.views / 1000)}k`}{" "}
                      views
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] leading-relaxed text-white/65 mt-2.5">
                  <span className="text-white/40">Ângulo:</span> {s.angulo_narrativo}
                </p>
                <p className="text-[12.5px] leading-relaxed text-white/65 mt-1">
                  <span className="text-white/40">Abordagem:</span> {s.forma_abordagem}
                </p>
                <p className="text-[12px] leading-relaxed text-gold/70 italic mt-2">{s.por_que_para_este_cliente}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11.5px] text-white/40 select-none hover:text-white/60">
                    informações de apoio ({s.informacoes_de_apoio.length})
                  </summary>
                  <ul className="mt-1.5 space-y-1 text-[12px] text-white/55 list-disc list-inside">
                    {s.informacoes_de_apoio.map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {CAN_MODELAGEM.includes(a.kind) && (
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
              )}
              <button
                onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}
                className={`text-white/40 hover:text-white ${CAN_MODELAGEM.includes(a.kind) ? "" : "ml-auto"}`}
                aria-label="Remover anexo"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {a.is_modelagem && (
              <p className="text-xs text-white/40">
                A estrutura, emoções e elementos virais deste material serão desconstruídos e replicados no seu tema
              </p>
            )}
            <div className="flex flex-col gap-2.5">
              {(a.kind === "news_link" || a.kind === "video_link") && (
                <input
                  value={a.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder={
                    a.kind === "news_link" ? "Link da notícia (obrigatório)" : "Link do vídeo (YouTube/Shorts, Reels, TikTok)"
                  }
                  className={`rounded-[10px] border bg-transparent px-3.5 py-2.5 font-mono text-[12.5px] outline-none placeholder:text-white/30 focus:border-gold/40 ${
                    a.kind === "news_link" && !a.url.trim() ? "border-amber-500/40" : "border-white/[.12]"
                  }`}
                />
              )}
              {a.kind === "document" && (
                <label className="inline-flex items-center gap-2 self-start cursor-pointer rounded-[10px] border border-white/[.14] px-3.5 py-2.5 text-[12.5px] text-white/70 hover:border-gold/40 hover:text-white/90 transition-colors">
                  <input
                    type="file"
                    accept={DOC_ACCEPT}
                    className="hidden"
                    onChange={(e) => extractFile(i, e.target.files?.[0])}
                  />
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 10V2M8 2 5 5M8 2l3 3M3 11v2.5h10V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {extracting === i
                    ? "Extraindo texto..."
                    : a.url
                      ? `${a.url} · trocar arquivo`
                      : "Enviar arquivo (.pdf, .docx, .txt, .html, .xlsx, .pptx)"}
                </label>
              )}
              {a.kind === "document" && extractError[i] && (
                <p className="text-xs text-red-300">{extractError[i]}</p>
              )}
              <textarea
                value={a.raw_content}
                onChange={(e) => update(i, { raw_content: e.target.value })}
                rows={a.kind === "news_link" ? 2 : a.kind === "video_link" ? 1 : 4}
                placeholder={KIND_LABELS[a.kind].placeholder}
                className="rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[12.5px] resize-y outline-none placeholder:text-white/35 focus:border-gold/40"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
