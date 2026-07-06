"use client";

import { useState, useTransition } from "react";
import { savePreferences } from "@/lib/actions";

interface Prefs {
  proibicoes: string[];
  tom_de_voz: string | null;
  temas_preferidos: string[];
  vocabulario_evitar: string[];
  vocabulario_usar: string[];
  notas_entrevista: string | null;
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

export default function ClientPrefsEditor({
  client,
  prefs,
}: {
  client: { id: string; nome: string };
  prefs: Prefs | null;
}) {
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

  const hasPrefs = prefs && (prefs.proibicoes.length || prefs.notas_entrevista || prefs.tom_de_voz);
  const av = avatarColor(client.nome);

  return (
    <details className="group rounded-[18px] border border-white/[.08] bg-white/[.02] open:border-gold/30 overflow-hidden">
      <summary
        className="cursor-pointer flex items-center gap-3 px-5 py-4 select-none group-open:bg-gradient-to-b group-open:from-gold/[.06] group-open:to-transparent"
      >
        <span
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-display text-base shrink-0"
          style={{ background: av.bg, border: `1px solid ${av.border}`, color: av.text }}
        >
          {client.nome.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="text-[14.5px] font-medium text-[#ededf0]/90">{client.nome}</div>
          {!hasPrefs && <div className="text-xs text-white/40">sem preferências registradas</div>}
        </div>
        <svg
          className="ml-auto shrink-0 transition-transform group-open:rotate-180"
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-5 pb-5 pt-1 grid gap-x-7 gap-y-5 sm:grid-cols-2 text-sm">
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
        <Field label="TEMAS">
          <textarea value={form.temas_preferidos} onChange={set("temas_preferidos")} rows={2} className={inputCls} placeholder="ex: mitos de dermato" />
        </Field>
        <Field label="NOTAS DE ENTREVISTA">
          <textarea value={form.notas_entrevista} onChange={set("notas_entrevista")} rows={2} className={inputCls} placeholder="ex: prefere gravar de manhã" />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            onClick={() =>
              startTransition(async () => {
                await savePreferences(client.id, form);
                setSaved(true);
              })
            }
            disabled={pending}
            className="btn-gold rounded-[10px] px-5 py-2 text-[13px] font-semibold disabled:opacity-40"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
          {saved && <span className="text-emerald-300 text-xs">Salvo ✓</span>}
        </div>
      </div>
    </details>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/30 focus:border-gold/40 resize-y";

function Field({ label, labelCls, children }: { label: string; labelCls?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className={`kicker ${labelCls ?? "text-white/45"}`}>{label}</span>
      {children}
    </label>
  );
}
