import Link from "next/link";
import { appDb } from "@/lib/db";
import { fmtNum } from "@/lib/format";
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

// filtro ?status= → status efetivo da linha; "publicada" é derivado do script, não da sessão
const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "gerando", label: "Gerando" },
  { key: "pronta", label: "Pronta" },
  { key: "publicada", label: "Publicada" },
  { key: "encerrada", label: "Encerrada" },
  { key: "interrompida", label: "Interrompida" },
];

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

function chipHref(cliente: string | undefined, status: string | undefined): string {
  const sp = new URLSearchParams();
  if (cliente) sp.set("cliente", cliente);
  if (status) sp.set("status", status);
  const qs = sp.toString();
  return qs ? `/sessions?${qs}` : "/sessions";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-[5px] text-[11.5px] transition-colors ${
        active
          ? "border-gold/60 bg-gold/[.08] text-gold"
          : "border-white/15 text-white/55 hover:border-white/35 hover:text-white/80"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; status?: string }>;
}) {
  const { cliente, status: statusParam } = await searchParams;

  let sessionsQuery = appDb
    .from("vm_sessions")
    .select("id, prompt, status, generation_started_at, created_at, client_id, clientes(nome)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (cliente) sessionsQuery = sessionsQuery.eq("client_id", cliente);

  const [{ data: sessions }, { data: clients }] = await Promise.all([
    sessionsQuery,
    appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  // scripts publicados + views das até 100 sessões em 2 queries (sem N+1)
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: pubScripts } = sessionIds.length
    ? await appDb
        .from("vm_generated_scripts")
        .select("id, session_id")
        .eq("status", "published")
        .in("session_id", sessionIds)
    : { data: [] as { id: string; session_id: string }[] };
  const scriptIds = (pubScripts ?? []).map((p) => p.id);
  const { data: perf } = scriptIds.length
    ? await appDb.from("vm_script_performance").select("script_id, views").in("script_id", scriptIds)
    : { data: [] as { script_id: string; views: number | null }[] };

  const viewsByScript = new Map<string, number>();
  for (const p of perf ?? []) {
    if (p.views != null) viewsByScript.set(p.script_id, (viewsByScript.get(p.script_id) ?? 0) + p.views);
  }
  // session_id → views somadas (null = publicado mas ETL ainda não trouxe número)
  const publishedViews = new Map<string, number | null>();
  for (const s of pubScripts ?? []) {
    const v = viewsByScript.get(s.id);
    const prev = publishedViews.get(s.session_id);
    publishedViews.set(s.session_id, v != null ? (prev ?? 0) + v : (prev ?? null));
  }

  const rows = (sessions ?? [])
    .map((s) => ({
      ...s,
      effStatus: isStaleGeneration(s.status, s.generation_started_at) ? "stalled" : s.status,
      published: publishedViews.has(s.id),
      views: publishedViews.get(s.id) ?? null,
    }))
    .filter((s) => {
      if (!statusParam) return true;
      if (statusParam === "publicada") return s.published;
      if (statusParam === "gerando") return s.effStatus === "generating";
      if (statusParam === "pronta") return s.effStatus === "done" && !s.published;
      if (statusParam === "encerrada") return s.effStatus === "closed";
      if (statusParam === "interrompida") return s.effStatus === "stalled";
      return true;
    });

  const hasFilter = Boolean(cliente || statusParam);

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

      <div className="flex items-center gap-1.5 flex-wrap mt-6">
        <Chip href={chipHref(cliente, undefined)} active={!statusParam}>
          Todas
        </Chip>
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.key} href={chipHref(cliente, f.key)} active={statusParam === f.key}>
            {f.label}
          </Chip>
        ))}
      </div>
      {(clients?.length ?? 0) > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <Chip href={chipHref(undefined, statusParam)} active={!cliente}>
            Todos os clientes
          </Chip>
          {(clients ?? []).map((c) => (
            <Chip key={c.id} href={chipHref(c.id, statusParam)} active={cliente === c.id}>
              {c.nome}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-5">
        {rows.map((s) => {
          const client = Array.isArray(s.clientes) ? s.clientes[0] : s.clientes;
          const st = STATUS[s.effStatus] ?? STATUS.draft;
          return (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className={`flex items-center gap-3 sm:gap-4 rounded-[14px] border px-4 sm:px-5 py-3.5 hover:border-gold/40 transition-colors ${
                s.published ? "border-gold/30 bg-gold/[.03]" : st.rowCls
              }`}
            >
              <span className={`inline-flex items-center gap-1.5 w-[92px] sm:w-[110px] shrink-0 text-xs ${st.cls}`}>
                <StatusIcon status={s.effStatus} />
                {st.label}
              </span>
              <span className="flex-1 min-w-0 truncate text-[13.5px] text-[#ededf0]/85">{s.prompt}</span>
              {s.published && (
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/[.08] px-2.5 py-[3px] text-[11px] font-medium text-gold">
                  publicada
                  {s.views != null && <span className="font-mono">{fmtNum(s.views)} views</span>}
                </span>
              )}
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
        {!rows.length && (
          <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-5 py-8 text-center">
            <p className="text-white/45 text-sm">
              {hasFilter
                ? "Nenhuma sessão com esses filtros."
                : "Nenhuma sessão ainda. Comece com um prompt — a sala de agentes pesquisa o corpus e escreve o roteiro."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {hasFilter && (
                <Link href="/sessions" className="text-[12.5px] text-white/50 underline underline-offset-4 hover:text-white/80">
                  limpar filtros
                </Link>
              )}
              <Link
                href="/"
                className="btn-gold inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="#161410" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Nova sessão
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
