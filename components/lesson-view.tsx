"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLearning, setLearningActive, updateLearning } from "@/lib/actions";
import type { Dimensao } from "@/lib/pipeline/teach";
import { DIMENSAO_ORDER, DIMENSAO_LABEL, DIMENSAO_CLS } from "./dimensoes";

interface Learning {
  id: string;
  dimensao: Dimensao;
  titulo: string;
  descricao: string;
  evidencia: string | null;
  origem: "extraido" | "manual" | "edicao" | "curador";
  active: boolean;
  needs_review?: boolean; // WP-E.5: flopou em ≥2 roteiros publicados — revisão humana
}

function LearningRow({ l }: { l: Learning }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(l.titulo);
  const [descricao, setDescricao] = useState(l.descricao);

  const saveEdit = () =>
    startTransition(async () => {
      await updateLearning(l.id, { titulo, descricao });
      setEditing(false);
      router.refresh();
    });

  return (
    <div
      className={`rounded-[14px] border p-4 space-y-2 transition-colors ${
        l.active ? "border-white/10 bg-white/[.02]" : "border-white/[.06] bg-white/[.01] opacity-55"
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${DIMENSAO_CLS[l.dimensao]}`}>
          {DIMENSAO_LABEL[l.dimensao]}
        </span>
        {l.origem === "manual" && <span className="text-[10.5px] text-white/35">manual</span>}
        {l.needs_review && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/[.08] px-2.5 py-0.5 text-[10.5px] text-amber-300">
            ⚠ revisar: flopou em roteiros publicados (≥2×)
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11.5px] text-white/45 hover:text-white/80"
            >
              editar
            </button>
          )}
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setLearningActive(l.id, !l.active);
                router.refresh();
              })
            }
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${
              l.active
                ? "border-emerald-500/40 bg-emerald-500/[.08] text-emerald-300 hover:border-emerald-500/70"
                : "border-white/20 text-white/50 hover:border-white/40"
            }`}
          >
            {l.active ? "Ativo" : "Inativo"}
          </button>
        </span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-[10px] border border-white/[.14] bg-transparent px-3 py-2 text-[13.5px] font-medium text-cream outline-none focus:border-gold/40"
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="w-full rounded-[10px] border border-white/[.14] bg-transparent px-3 py-2 text-[12.5px] text-white/75 resize-y outline-none focus:border-gold/40"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={pending || !titulo.trim() || !descricao.trim()}
              className="btn-gold rounded-[9px] px-3.5 py-1.5 text-[12px] font-semibold disabled:opacity-40"
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setTitulo(l.titulo);
                setDescricao(l.descricao);
              }}
              className="rounded-[9px] border border-white/15 px-3.5 py-1.5 text-[12px] text-white/60 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={`text-[13.5px] font-medium leading-snug ${l.active ? "text-cream" : "text-white/60 line-through"}`}>
            {l.titulo}
          </p>
          <p className="text-[12.5px] leading-relaxed text-white/65">{l.descricao}</p>
          {l.evidencia && (
            <details>
              <summary className="cursor-pointer text-[11px] text-white/40 select-none hover:text-white/60">
                evidência na transcrição
              </summary>
              <p className="mt-1.5 text-[12px] italic text-white/50 leading-relaxed">“{l.evidencia}”</p>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function AddLearningBox({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dimensao, setDimensao] = useState<Dimensao>("geral");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[10px] border border-white/15 px-4 py-2 text-[12.5px] text-white/70 hover:border-gold/50 hover:text-cream transition-colors"
      >
        + Adicionar aprendizado
      </button>
    );

  return (
    <div className="rounded-[14px] border border-gold/25 bg-gold/[.03] p-4 space-y-2.5">
      <select
        value={dimensao}
        onChange={(e) => setDimensao(e.target.value as Dimensao)}
        className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium outline-none cursor-pointer ${DIMENSAO_CLS[dimensao]}`}
      >
        {DIMENSAO_ORDER.map((d) => (
          <option key={d} value={d} className="bg-neutral-900 text-white">
            {DIMENSAO_LABEL[d]}
          </option>
        ))}
      </select>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título do aprendizado (curto, imperativo)"
        className="w-full rounded-[10px] border border-white/[.14] bg-transparent px-3 py-2 text-[13.5px] font-medium text-cream outline-none placeholder:text-white/35 focus:border-gold/40"
      />
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        placeholder="Por que funciona (o mecanismo)"
        className="w-full rounded-[10px] border border-white/[.14] bg-transparent px-3 py-2 text-[12.5px] text-white/75 resize-y outline-none placeholder:text-white/35 focus:border-gold/40"
      />
      <div className="flex gap-2">
        <button
          onClick={() =>
            startTransition(async () => {
              await addLearning(lessonId, { dimensao, titulo: titulo.trim(), descricao: descricao.trim() });
              setOpen(false);
              setTitulo("");
              setDescricao("");
              router.refresh();
            })
          }
          disabled={pending || !titulo.trim() || !descricao.trim()}
          className="btn-gold rounded-[9px] px-3.5 py-1.5 text-[12px] font-semibold disabled:opacity-40"
        >
          {pending ? "Adicionando..." : "Adicionar"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-[9px] border border-white/15 px-3.5 py-1.5 text-[12px] text-white/60 hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function LessonView({
  lesson,
  learnings,
}: {
  lesson: {
    id: string;
    sourceUrl: string | null;
    sourceTitle: string | null;
    transcript: string;
    contextNote: string | null;
    createdAt: string;
    clientNome: string | null;
  };
  learnings: Learning[];
}) {
  const router = useRouter();
  const ativos = learnings.filter((l) => l.active).length;
  const ordered = DIMENSAO_ORDER.flatMap((d) => learnings.filter((l) => l.dimensao === d));

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <button onClick={() => router.push("/ensinar")} className="hover:text-white/70">
            Ensinar
          </button>
          <span className="text-white/25">/</span>
          <span className="font-mono text-white/60">#{lesson.id.slice(0, 6)}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium leading-[1.25] text-ivory mt-3.5">
          {lesson.sourceTitle || "Lição de viral"}
        </h1>
        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
          <span
            className={`rounded-full border px-3 py-1 text-xs ${
              lesson.clientNome
                ? "border-indigo-500/40 bg-indigo-500/[.08] text-indigo-300"
                : "border-gold/35 bg-gold/[.06] text-gold/90"
            }`}
          >
            {lesson.clientNome ? `Cliente · ${lesson.clientNome}` : "Global · vale para todos"}
          </span>
          <span className="rounded-full border border-emerald-500/35 bg-emerald-500/[.06] px-3 py-1 text-xs text-emerald-300">
            {ativos} de {learnings.length} influenciando a sala
          </span>
          {lesson.sourceUrl && (
            <a
              href={lesson.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-300/80 underline decoration-sky-300/40 hover:text-sky-200"
            >
              ver vídeo original
            </a>
          )}
          <span className="font-mono text-[11.5px] text-white/35 ml-auto">
            {new Date(lesson.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
        {lesson.contextNote && (
          <p className="text-[12.5px] text-white/55 italic mt-3">Contexto: {lesson.contextNote}</p>
        )}
      </div>

      <div className="space-y-3">
        {ordered.map((l) => (
          <LearningRow key={l.id} l={l} />
        ))}
        {!learnings.length && <p className="text-white/40 text-sm">Nenhum aprendizado nesta lição.</p>}
        <AddLearningBox lessonId={lesson.id} />
      </div>

      <details className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-3">
        <summary className="cursor-pointer text-[12px] text-white/40 select-none">transcrição completa</summary>
        <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-white/55 max-h-80 overflow-y-auto">
          {lesson.transcript}
        </p>
      </details>
    </div>
  );
}
