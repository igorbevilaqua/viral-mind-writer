import Link from "next/link";
import { appDb } from "@/lib/db";
import { writerScope } from "@/lib/hub";
import { fmtNum, fmtWhen } from "@/lib/format";
import { isStaleGeneration } from "@/lib/generation";
import { clientesDoFiltro, entraNoPainel, mesclarPainel } from "@/lib/painel-sessoes";

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
  // Modelagem: tese extraída do original, esperando confirmação humana antes de escrever.
  // É ação pendente do usuário, então destaca como a geração destaca.
  aguardando_premissa: {
    label: "Confirmar premissa",
    cls: "text-gold",
    rowCls: "border-gold/30 bg-gold/[.04]",
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
  // Modo modelagem: a tese do original foi extraída e o pipeline espera confirmação humana.
  // Sem ícone próprio a sessão parecia rascunho abandonado na lista.
  if (status === "aguardando_premissa")
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5.5v3M8 10.8v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
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

const TIPO_FILTERS: { key: string; label: string }[] = [
  { key: "roteiros", label: "Roteiros" },
  { key: "kasparov", label: "Kasparov" },
];

function chipHref(clientes: string[], status?: string, tipo?: string): string {
  const sp = new URLSearchParams();
  for (const c of clientes) sp.append("cliente", c);
  if (status) sp.set("status", status);
  if (tipo) sp.set("tipo", tipo);
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

// Debate do Kasparov na mesma lista do roteiro, com a mesma anatomia de linha (rótulo à
// esquerda, título, cliente, data) para a lista continuar sendo varrida de uma vez. O link vai
// para /kasparov/<id>, que é a mesma URL que a lição de debate já grava como procedência.
function LinhaDeDebate({
  id,
  assunto,
  cliente,
  turnos,
  quando,
}: {
  id: string;
  assunto: string | null;
  cliente: string | null;
  turnos: number;
  quando: string;
}) {
  return (
    <Link
      href={`/kasparov/${id}`}
      className="flex items-center gap-3 sm:gap-4 rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 sm:px-5 py-3.5 hover:border-gold/40 transition-colors"
    >
      <span className="inline-flex items-center gap-1.5 sm:w-[110px] shrink-0 text-xs text-violet-300/85">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M2.5 4.5A2 2 0 0 1 4.5 2.5h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7l-3.5 3v-3h-1v-6Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden sm:inline">Kasparov</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[13.5px] text-[#ededf0]/85">
          {assunto?.trim() || <span className="text-white/40 italic">Debate sem assunto registrado</span>}
        </span>
        <span className="sm:hidden flex items-center gap-2 mt-1 text-[11px] text-white/35">
          <span className="text-violet-300/85">Kasparov</span>
          {cliente && <span className="truncate text-indigo-300/80">· {cliente}</span>}
          <span className="ml-auto shrink-0 font-mono">{fmtWhen(quando)}</span>
        </span>
      </span>
      <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-[3px] font-mono text-[11px] text-white/45">
        {turnos} msg
      </span>
      {cliente && (
        <span className="hidden sm:inline-block shrink-0 rounded-full border border-indigo-500/35 px-2.5 py-[3px] text-[11.5px] text-indigo-300">
          {cliente}
        </span>
      )}
      <span className="hidden sm:block w-[88px] shrink-0 text-right font-mono text-[11.5px] text-white/35">
        {fmtWhen(quando)}
      </span>
    </Link>
  );
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string | string[]; status?: string; tipo?: string }>;
}) {
  const { cliente, status: statusParam, tipo: tipoParam } = await searchParams;
  const clientes = clientesDoFiltro(cliente);
  const { isAdmin, userId } = await writerScope();

  const querSessoes = entraNoPainel("roteiro", tipoParam, statusParam);
  const querThreads = entraNoPainel("kasparov", tipoParam, statusParam);

  let sessionsQuery = appDb
    .from("vm_sessions")
    .select("id, prompt, status, generation_started_at, created_at, client_id, clientes(nome)")
    .order("created_at", { ascending: false })
    .limit(100);
  // Usuário comum só vê as próprias sessões; adm vê todas. (middleware garante userId != null)
  if (!isAdmin) sessionsQuery = sessionsQuery.eq("user_id", userId ?? "");
  if (clientes.length) sessionsQuery = sessionsQuery.in("client_id", clientes);

  // Debate do Kasparov. `vm_kasparov_messages(count)` é o que separa conversa de thread órfã:
  // a thread nasce na primeira mensagem e sobrevive ao turno que falhou, então sem a contagem a
  // lista encheria de conversa vazia. Ordena por updated_at: é a data do último turno.
  // Sem embed de `clientes` porque vm_kasparov_threads.client_id não tem FK (migration 0030) —
  // o nome sai do mapa de clientes que a página já carrega.
  let threadsQuery = appDb
    .from("vm_kasparov_threads")
    .select("id, assunto, client_id, created_at, updated_at, vm_kasparov_messages(count)")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!isAdmin) threadsQuery = threadsQuery.eq("user_id", userId ?? "");
  if (clientes.length) threadsQuery = threadsQuery.in("client_id", clientes);

  const [{ data: sessions }, { data: threads }, { data: clients }] = await Promise.all([
    querSessoes ? sessionsQuery : { data: [] as never[] },
    querThreads ? threadsQuery : { data: [] as never[] },
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

  // Sessão conjurada só de material tem prompt vazio → título na lista viria em branco.
  // Fallback: headline do roteiro gerado (versão mais recente por sessão).
  const semPromptIds = (sessions ?? []).filter((s) => !s.prompt?.trim()).map((s) => s.id);
  const { data: heads } = semPromptIds.length
    ? await appDb
        .from("vm_generated_scripts")
        .select("session_id, headline, version")
        .in("session_id", semPromptIds)
        .order("version", { ascending: false })
    : { data: [] as { session_id: string; headline: string | null; version: number }[] };
  const headlineBySession = new Map<string, string>();
  for (const h of heads ?? []) {
    if (h.headline?.trim() && !headlineBySession.has(h.session_id)) headlineBySession.set(h.session_id, h.headline.trim());
  }
  // Sessão com material de referência → prefixo "Modelar:" ou "Replicar:" no título (0034).
  const { data: modAtts } = semPromptIds.length
    ? await appDb.from("vm_attachments").select("session_id, modo").eq("is_modelagem", true).in("session_id", semPromptIds)
    : { data: [] as { session_id: string; modo: string | null }[] };
  const modoPorSessao = new Map((modAtts ?? []).map((a) => [a.session_id, a.modo === "replicar" ? "Replicar" : "Modelar"]));

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

  const nomePorCliente = new Map((clients ?? []).map((c) => [c.id, c.nome]));

  const linhasDeRoteiro = (sessions ?? [])
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
    })
    .map((s) => ({ tipo: "roteiro" as const, quando: s.created_at as string, s }));

  const linhasDeDebate = (threads ?? [])
    .map((t) => ({
      t,
      turnos: Number((t.vm_kasparov_messages as { count: number }[] | null)?.[0]?.count ?? 0),
    }))
    .filter((l) => l.turnos > 0)
    .map((l) => ({
      tipo: "kasparov" as const,
      quando: (l.t.updated_at ?? l.t.created_at) as string,
      turnos: l.turnos,
      t: l.t,
    }));

  // a união explícita: sem ela o genérico se fixa no primeiro array e o debate não entra
  type Linha = (typeof linhasDeRoteiro)[number] | (typeof linhasDeDebate)[number];
  const linhas = mesclarPainel<Linha>([linhasDeRoteiro, linhasDeDebate]);
  const hasFilter = Boolean(clientes.length || statusParam || tipoParam);

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

      {/* Status é conceito de roteiro: com tipo=kasparov os chips saem da tela em vez de
          ficarem ali sugerindo uma combinação que não filtra nada (lib/painel-sessoes.ts). */}
      {tipoParam !== "kasparov" && (
        <div className="flex items-center gap-1.5 flex-wrap mt-6">
          <Chip href={chipHref(clientes, undefined, tipoParam)} active={!statusParam}>
            Todas
          </Chip>
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.key} href={chipHref(clientes, f.key, tipoParam)} active={statusParam === f.key}>
              {f.label}
            </Chip>
          ))}
        </div>
      )}

      <div className={`flex items-center gap-1.5 flex-wrap ${tipoParam === "kasparov" ? "mt-6" : "mt-2"}`}>
        <Chip href={chipHref(clientes, statusParam, undefined)} active={!tipoParam}>
          Tudo
        </Chip>
        {TIPO_FILTERS.map((f) => (
          <Chip
            key={f.key}
            // trocar para kasparov leva o status embora: debate não tem status para filtrar
            href={chipHref(clientes, f.key === "kasparov" ? undefined : statusParam, f.key)}
            active={tipoParam === f.key}
          >
            {f.label}
          </Chip>
        ))}

        {/* Janela de clientes: marca e desmarca vários, e nome de cliente só aparece para quem
            abre. `details` + form GET nativos — a URL é o estado do filtro, sem client component
            e sem JS. ponytail: um clique em "Aplicar" no lugar de auto-submit, que fecharia a
            janela a cada marcação e obrigaria a reabrir para escolher o segundo cliente. */}
        {(clients?.length ?? 0) > 0 && (
          <details className="relative ml-auto">
            <summary
              className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-full border px-3 py-[5px] text-[11.5px] transition-colors ${
                clientes.length
                  ? "border-gold/60 bg-gold/[.08] text-gold"
                  : "border-white/15 text-white/55 hover:border-white/35 hover:text-white/80"
              }`}
            >
              {clientes.length ? `${clientes.length} cliente${clientes.length > 1 ? "s" : ""}` : "Clientes"} ▾
            </summary>
            <form
              method="GET"
              action="/sessions"
              className="absolute right-0 z-30 mt-2 w-[250px] rounded-[12px] border border-white/15 bg-[#0b0b0f] p-3 shadow-2xl"
            >
              {statusParam && <input type="hidden" name="status" value={statusParam} />}
              {tipoParam && <input type="hidden" name="tipo" value={tipoParam} />}
              <div className="max-h-[280px] overflow-y-auto pr-1">
                {(clients ?? []).map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 py-[3px] text-[12.5px] text-white/70 hover:text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="cliente"
                      value={c.id}
                      defaultChecked={clientes.includes(c.id)}
                      className="accent-gold"
                    />
                    <span className="truncate">{c.nome}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2.5 mt-1.5 border-t border-white/[.08]">
                <button type="submit" className="btn-gold rounded-[8px] px-3 py-1.5 text-[12px] font-semibold">
                  Aplicar
                </button>
                <Link
                  href={chipHref([], statusParam, tipoParam)}
                  className="text-[12px] text-white/45 underline underline-offset-4 hover:text-white/75"
                >
                  limpar
                </Link>
              </div>
            </form>
          </details>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-5">
        {linhas.map((linha) => {
          if (linha.tipo === "kasparov")
            return (
              <LinhaDeDebate
                key={linha.t.id}
                id={linha.t.id}
                assunto={linha.t.assunto}
                cliente={linha.t.client_id ? (nomePorCliente.get(linha.t.client_id) ?? null) : null}
                turnos={linha.turnos}
                quando={linha.quando}
              />
            );
          const s = linha.s;
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
              <span className={`inline-flex items-center gap-1.5 sm:w-[110px] shrink-0 text-xs ${st.cls}`}>
                <StatusIcon status={s.effStatus} />
                <span className="hidden sm:inline">{st.label}</span>
              </span>
              {/* celular: título em cima, meta (status · cliente · data) embaixo — o
                  rótulo de status em coluna fixa comia metade da largura útil */}
              <span className="flex-1 min-w-0">
                <span className="block truncate text-[13.5px] text-[#ededf0]/85">
                  {s.prompt?.trim() ||
                    (() => {
                      const head = headlineBySession.get(s.id);
                      const mod = modoPorSessao.get(s.id);
                      if (head) return mod ? `${mod}: ${head}` : head;
                      return <span className="text-white/40 italic">{mod ?? "Roteiro a partir de material"}</span>;
                    })()}
                </span>
                <span className="sm:hidden flex items-center gap-2 mt-1 text-[11px] text-white/35">
                  <span className={st.cls}>{st.label}</span>
                  {client && <span className="truncate text-indigo-300/80">· {client.nome}</span>}
                  <span className="ml-auto shrink-0 font-mono">{fmtWhen(s.created_at)}</span>
                </span>
              </span>
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
        {!linhas.length && (
          <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-5 py-8 text-center">
            <p className="text-white/45 text-sm">
              {hasFilter
                ? "Nada com esses filtros."
                : "Nenhuma sessão ainda. Comece com um prompt: a sala de agentes pesquisa o corpus e escreve o roteiro."}
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
