import Link from "next/link";
import { appDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export default async function EnsinarPage() {
  const [{ data: allLessons }, { data: learnings }] = await Promise.all([
    appDb
      .from("vm_lessons")
      .select("id, source_kind, source_title, source_url, transcript, created_at, clientes(nome)")
      .order("created_at", { ascending: false })
      .limit(100),
    appDb.from("vm_lesson_learnings").select("lesson_id, active"),
  ]);

  const counts = new Map<string, { total: number; ativos: number }>();
  for (const l of learnings ?? []) {
    const c = counts.get(l.lesson_id) ?? { total: 0, ativos: 0 };
    c.total += 1;
    if (l.active) c.ativos += 1;
    counts.set(l.lesson_id, c);
  }

  // WP-G: lições que a sala derivou sozinha do ciclo (edições do usuário e resultados publicados)
  const derived = (allLessons ?? []).filter((l) => l.source_kind === "edicao" || l.source_kind === "curador");
  const lessons = (allLessons ?? []).filter((l) => l.source_kind !== "edicao" && l.source_kind !== "curador");
  const pendentes = derived.reduce((n, l) => {
    const c = counts.get(l.id);
    return n + (c ? c.total - c.ativos : 0);
  }, 0);

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Ensinar</h1>
        <span className="text-[13px] text-white/40">
          aprendizados de virais analisados — os ativos influenciam a sala de agentes
        </span>
        <Link
          href="/ensinar/nova"
          className="btn-gold ml-auto inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="#161410" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Ensinar novo viral
        </Link>
      </div>

      {derived.length > 0 && (
        <section className="mt-8">
          <div className="kicker text-gold tracking-[.22em]">O QUE A SALA APRENDEU COM VOCÊ</div>
          <p className="mt-1.5 text-[13px] text-white/50">
            {pendentes > 0
              ? `A sala propôs ${pendentes} aprendizado${pendentes > 1 ? "s" : ""} a partir das suas edições e dos resultados publicados — revise e ative.`
              : "Aprendizados derivados das suas edições e dos resultados publicados — todos revisados."}
          </p>
          <div className="flex flex-col gap-2 mt-3">
            {derived.map((l) => {
              const client = Array.isArray(l.clientes) ? l.clientes[0] : l.clientes;
              const c = counts.get(l.id) ?? { total: 0, ativos: 0 };
              const pend = c.total - c.ativos;
              const titulo = l.source_title || l.transcript.slice(0, 90);
              return (
                <Link
                  key={l.id}
                  href={`/ensinar/${l.id}`}
                  className="flex items-center gap-3 sm:gap-4 rounded-[14px] border border-gold/25 bg-gold/[.03] px-4 sm:px-5 py-3.5 hover:border-gold/50 transition-colors"
                >
                  <span className="shrink-0 rounded-full border border-gold/35 px-2.5 py-[3px] text-[10.5px] text-gold/85">
                    {l.source_kind === "edicao" ? "das suas edições" : "curador"}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[13.5px] text-[#ededf0]/85">{titulo}</span>
                  {pend > 0 && (
                    <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/[.08] px-2.5 py-[3px] text-[11px] text-amber-300">
                      {pend} pendente{pend > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-[3px] text-[11px] text-white/55">
                    {c.ativos}/{c.total} ativos
                  </span>
                  <span
                    className={`hidden sm:inline-block shrink-0 rounded-full border px-2.5 py-[3px] text-[11.5px] ${
                      client ? "border-indigo-500/35 text-indigo-300" : "border-gold/30 text-gold/80"
                    }`}
                  >
                    {client?.nome ?? "Global"}
                  </span>
                  <span className="hidden sm:block w-[60px] shrink-0 text-right font-mono text-[11.5px] text-white/35">
                    {fmtWhen(l.created_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2 mt-6">
        {lessons.map((l) => {
          const client = Array.isArray(l.clientes) ? l.clientes[0] : l.clientes;
          const c = counts.get(l.id) ?? { total: 0, ativos: 0 };
          const titulo = l.source_title || l.transcript.slice(0, 90);
          return (
            <Link
              key={l.id}
              href={`/ensinar/${l.id}`}
              className="flex items-center gap-3 sm:gap-4 rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 sm:px-5 py-3.5 hover:border-gold/40 transition-colors"
            >
              <span className="shrink-0 text-gold/70">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2 1.5 5 8 8l6.5-3L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M4 6.5V11c0 .8 1.8 2 4 2s4-1.2 4-2V6.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
              <span className="flex-1 min-w-0 truncate text-[13.5px] text-[#ededf0]/85">{titulo}</span>
              <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-[3px] text-[11px] text-white/55">
                {c.ativos}/{c.total} ativos
              </span>
              <span
                className={`hidden sm:inline-block shrink-0 rounded-full border px-2.5 py-[3px] text-[11.5px] ${
                  client
                    ? "border-indigo-500/35 text-indigo-300"
                    : "border-gold/30 text-gold/80"
                }`}
              >
                {client?.nome ?? "Global"}
              </span>
              <span className="hidden sm:block w-[60px] shrink-0 text-right font-mono text-[11.5px] text-white/35">
                {fmtWhen(l.created_at)}
              </span>
            </Link>
          );
        })}
        {!lessons.length && (
          <p className="text-white/40 text-sm">
            Nenhuma lição ainda. Ensine o sistema com um vídeo viral ou roteiro campeão — os aprendizados aprovados
            passam a orientar os agentes nas próximas gerações.
          </p>
        )}
      </div>
    </div>
  );
}
