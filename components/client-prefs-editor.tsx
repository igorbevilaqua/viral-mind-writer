"use client";

import { useRef, useState, useTransition } from "react";
import { savePreferences } from "@/lib/actions";

interface Prefs {
  proibicoes: string[];
  tom_de_voz: string | null;
  temas_preferidos: string[];
  vocabulario_evitar: string[];
  vocabulario_usar: string[];
  notas_entrevista: string | null;
  updated_at?: string | null;
}

const AVATAR_COLORS = [
  { bg: "rgba(99,102,241,.15)", border: "rgba(99,102,241,.4)", text: "#a5b4fc" },
  { bg: "rgba(16,185,129,.12)", border: "rgba(16,185,129,.35)", text: "#6ee7b7" },
  { bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.35)", text: "#fbbf24" },
  { bg: "rgba(201,163,92,.14)", border: "rgba(201,163,92,.45)", text: "#c9a35c" },
];

function avatarColor(nome: string) {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// rounded to days → stable between SSR and client render (no hydration mismatch)
function relTime(iso?: string | null) {
  if (!iso) return null;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "atualizado hoje";
  if (days < 30) return "atualizado " + rtf.format(-days, "day");
  if (days < 365) return "atualizado " + rtf.format(-Math.round(days / 30), "month");
  return "atualizado " + rtf.format(-Math.round(days / 365), "year");
}

export default function ClientPrefsEditor({
  client,
  prefs,
}: {
  client: { id: string; nome: string };
  prefs: Prefs | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    proibicoes: (prefs?.proibicoes ?? []).join("\n"),
    tom_de_voz: prefs?.tom_de_voz ?? "",
    temas_preferidos: (prefs?.temas_preferidos ?? []).join("\n"),
    vocabulario_evitar: (prefs?.vocabulario_evitar ?? []).join("\n"),
    vocabulario_usar: (prefs?.vocabulario_usar ?? []).join("\n"),
    notas_entrevista: prefs?.notas_entrevista ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  const proibicoes = prefs?.proibicoes ?? [];
  const evitar = prefs?.vocabulario_evitar ?? [];
  const usar = prefs?.vocabulario_usar ?? [];
  const temas = prefs?.temas_preferidos ?? [];
  const hasPrefs = !!(
    proibicoes.length ||
    evitar.length ||
    usar.length ||
    temas.length ||
    prefs?.tom_de_voz ||
    prefs?.notas_entrevista
  );
  const av = avatarColor(client.nome);
  const subtitle = hasPrefs ? relTime(prefs?.updated_at) ?? "preferências registradas" : "sem preferências registradas";

  const close = () => {
    dialogRef.current?.close();
    setEditing(false);
    setSaved(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="w-full text-left cursor-pointer flex items-center gap-3 px-5 py-4 rounded-[16px] border border-white/[.08] bg-white/[.02] hover:border-gold/30 transition-colors"
      >
        <Avatar av={av} nome={client.nome} />
        <div className="min-w-0">
          <div className="text-[14.5px] font-medium text-[#ededf0]/90">{client.nome}</div>
          <div className="text-xs text-white/40">{subtitle}</div>
        </div>
        <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setEditing(false);
          setSaved(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="backdrop:bg-black/70 backdrop:backdrop-blur-sm m-auto w-[min(1080px,95vw)] max-h-[92vh] open:flex flex-col rounded-[20px] border border-gold/30 bg-[#141416] text-[#ededf0] p-0"
      >
        <div className="flex items-center gap-3 px-7 py-5 border-b border-white/[.08] bg-gradient-to-b from-gold/[.06] to-transparent">
          <Avatar av={av} nome={client.nome} />
          <div className="min-w-0">
            <div className="text-[15px] font-medium">{client.nome}</div>
            <div className="text-xs text-white/40">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={close}
            className="ml-auto shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[.06]"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {editing ? (
          <div className="flex-1 overflow-y-auto px-7 py-6 grid gap-x-7 gap-y-5 sm:grid-cols-2 text-sm content-start">
            <Field label="PROIBIÇÕES" labelCls="text-red-300">
              <textarea value={form.proibicoes} onChange={set("proibicoes")} rows={3} className={inputCls} placeholder="ex: prometer resultado" />
            </Field>
            <Field label="TOM DE VOZ">
              <textarea value={form.tom_de_voz} onChange={set("tom_de_voz")} rows={3} className={inputCls} placeholder="ex: autoridade acolhedora, técnica mas nunca fria" />
            </Field>
            <Field label="VOCABULÁRIO — EVITAR">
              <textarea value={form.vocabulario_evitar} onChange={set("vocabulario_evitar")} rows={3} className={inputCls} placeholder={'ex: "milagre"'} />
            </Field>
            <Field label="VOCABULÁRIO — PREFERIR" labelCls="text-gold">
              <textarea value={form.vocabulario_usar} onChange={set("vocabulario_usar")} rows={3} className={inputCls} placeholder={'ex: "evidência"'} />
            </Field>
            <Field label="TEMAS" span2>
              <textarea value={form.temas_preferidos} onChange={set("temas_preferidos")} rows={4} className={inputCls} placeholder="ex: mitos de dermato" />
            </Field>
            <Field label="NOTAS DE ENTREVISTA" span2>
              <textarea value={form.notas_entrevista} onChange={set("notas_entrevista")} rows={4} className={inputCls} placeholder="ex: prefere gravar de manhã" />
            </Field>
            <p className="sm:col-span-2 text-xs text-white/35 -mt-1">Uma linha por item nas listas. Tudo aqui entra como restrição inviolável nos roteiros.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-7 py-6 grid gap-x-9 gap-y-7 sm:grid-cols-2 content-start">
            {!hasPrefs && <p className="text-white/40 text-sm sm:col-span-2">Nenhuma preferência registrada ainda.</p>}
            <Section label="PROIBIÇÕES" labelCls="text-red-300" show={proibicoes.length > 0}>
              <Chips items={proibicoes} variant="danger" />
            </Section>
            <Section label="TOM DE VOZ" show={!!prefs?.tom_de_voz}>
              <Prose>{prefs?.tom_de_voz}</Prose>
            </Section>
            <Section label="VOCABULÁRIO — EVITAR" show={evitar.length > 0}>
              <Chips items={evitar} variant="strike" />
            </Section>
            <Section label="VOCABULÁRIO — PREFERIR" labelCls="text-gold" show={usar.length > 0}>
              <Chips items={usar} variant="gold" />
            </Section>
            <Section label="TEMAS" show={temas.length > 0}>
              <Chips items={temas} variant="neutral" />
            </Section>
            <Section label="NOTAS DE ENTREVISTA" show={!!prefs?.notas_entrevista}>
              <Prose muted>{prefs?.notas_entrevista}</Prose>
            </Section>
          </div>
        )}

        <div className="flex items-center gap-3 px-7 py-4 border-t border-white/[.08]">
          {editing ? (
            <>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await savePreferences(client.id, form);
                    setSaved(true);
                    setEditing(false);
                  })
                }
                disabled={pending}
                className="btn-gold rounded-[10px] px-5 py-2 text-[13px] font-semibold disabled:opacity-40"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={pending}
                className="rounded-[10px] px-4 py-2 text-[13px] text-white/60 hover:text-white hover:bg-white/[.06] disabled:opacity-40"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-[10px] border border-white/[.14] px-5 py-2 text-[13px] font-medium text-white/80 hover:border-gold/40 hover:text-white"
              >
                Editar
              </button>
              {saved && <span className="text-emerald-300 text-xs">Salvo ✓</span>}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

function Avatar({ av, nome }: { av: (typeof AVATAR_COLORS)[number]; nome: string }) {
  return (
    <span
      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-display text-base shrink-0"
      style={{ background: av.bg, border: `1px solid ${av.border}`, color: av.text }}
    >
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}

function Section({ label, labelCls, show, children }: { label: string; labelCls?: string; show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div>
      <div className={`kicker mb-2.5 ${labelCls ?? "text-white/45"}`}>{label}</div>
      {children}
    </div>
  );
}

const chipVariants = {
  danger: "border-red-500/35 text-red-300 bg-red-500/[.05]",
  gold: "border-gold/40 text-[#e8dcc3] bg-gold/[.06]",
  neutral: "border-white/[.14] text-white/65",
  strike: "border-white/[.14] text-white/55 line-through",
};

function Chips({ items, variant }: { items: string[]; variant: keyof typeof chipVariants }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <span key={i} className={`px-3 py-1.5 rounded-full border text-[12.5px] ${chipVariants[variant]}`}>
          {it}
        </span>
      ))}
    </div>
  );
}

function Prose({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <p className={`text-[13.5px] leading-relaxed ${muted ? "text-[#ededf0]/60" : "text-[#ededf0]/75"}`}>{children}</p>;
}

const inputCls =
  "w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-white/30 focus:border-gold/40 resize-y [field-sizing:content]";

function Field({ label, labelCls, span2, children }: { label: string; labelCls?: string; span2?: boolean; children: React.ReactNode }) {
  return (
    <label className={`grid gap-2 ${span2 ? "sm:col-span-2" : ""}`}>
      <span className={`kicker ${labelCls ?? "text-white/45"}`}>{label}</span>
      {children}
    </label>
  );
}
