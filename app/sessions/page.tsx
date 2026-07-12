import Link from "next/link";
import { appDb } from "@/lib/db";
import { isStaleGeneration } from "@/lib/generation";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string; rowCls: string }> = {
  generating: {
    label: "Gerando",
    cls: "text-gold",
    rowCls: "border-gold/30 bg-gold/[.04]",
  },
  done: {
    label: "Concluída",
    cls: "text-emerald-300",
    rowCls: "border-white/[.08] bg-white/[.02]",
  },
  draft: {
    label: "Rascunho",
    cls: "text-white/45",
    rowCls: "border-white/[.08] bg-white/[.02]",
  },
  error: {
    label: "Erro",
    cls: "text-red-300",
    rowCls: "border-red-500/25 bg-red-500/[.03]",
  },
  // generating stale (>10min): geração morreu no meio — sem pulse infinito
  stalled: {
    label: "Interrompida",
    cls: "text-amber-300",
    rowCls: "border-amber-500/25 bg-amber-500/[.03]",
  },
  closed: {
    label: "Encerrada",
    cls: "text-white/55",
    rowCls: "border-white/[.08] bg-white/[.015]",
  },
};

function StatusIcon({ status }: { status: string }) {
  if (status === "generating") return <span className="w-1.5 h-1.5 rounded-full bg-gold vm-pulse" />;
  if (status === "done")
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (status === "error" || status === "stalled")
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3.5M8 11v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  if (status === "closed")
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h6l3 3v9H4V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    const mins = (now.getTime() - d.getTime()) / 60000;
    if (mins < 5) return "agora";
    return `hoje ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export default async function SessionsPage() {
  const { data: sessions } = await appDb
    .from("vm_sessions")
    .select("id, prompt, status, generation_started_at, created_at, clientes(nome)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Sessões</h1>
        <span className="text-[13px] text-white/40">últimas 100</span>
        <Link
          href="/"
          className="btn-gold ml-auto inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="#161410" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Nova sessão
        </Link>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        {(sessions ?? []).map((s) => {
          const client = Array.isArray(s.clientes) ? s.clientes[0] : s.clientes;
          const status = isStaleGeneration(s.status, s.generation_started_at) ? "stalled" : s.status;
          const st = STATUS[status] ?? STATUS.draft;
          return (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className={`flex items-center gap-3 sm:gap-4 rounded-[14px] border px-4 sm:px-5 py-3.5 hover:border-gold/40 transition-colors ${st.rowCls}`}
            >
              <span className={`inline-flex items-center gap-1.5 w-[92px] sm:w-[110px] shrink-0 text-xs ${st.cls}`}>
                <StatusIcon status={status} />
                {st.label}
              </span>
              <span className="flex-1 min-w-0 truncate text-[13.5px] text-[#ededf0]/85">{s.prompt}</span>
              {client && (
                <span className="hidden sm:inline-block shrink-0 rounded-full border border-indigo-500/35 px-2.5 py-[3px] text-[11.5px] text-indigo-300">
                  {client.nome}
                </span>
              )}
              <span className="hidden sm:block w-[88px] shrink-0 text-right font-mono text-[11.5px] text-white/35">
                {fmtWhen(s.created_at)}
              </span>
            </Link>
          );
        })}
        {!sessions?.length && <p className="text-white/40 text-sm">Nenhuma sessão ainda.</p>}
      </div>
    </div>
  );
}
