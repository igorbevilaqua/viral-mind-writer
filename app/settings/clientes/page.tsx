import Link from "next/link";
import { appDb } from "@/lib/db";

export const dynamic = "force-dynamic";

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

export default async function ClientesPage() {
  const [{ data: clients }, { data: prefs }, { data: insights }] = await Promise.all([
    appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
    appDb.from("vm_client_preferences").select("client_id"),
    appDb.from("vm_viral_insights").select("scope").like("scope", "client:%").like("insight_type", "client_%"),
  ]);

  const hasPrefs = new Set((prefs ?? []).map((p) => p.client_id));
  const insightCount = new Map<string, number>();
  for (const i of insights ?? []) {
    const id = i.scope.slice("client:".length);
    insightCount.set(id, (insightCount.get(id) ?? 0) + 1);
  }

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Clientes</h1>
        <span className="text-[13px] text-white/40">preferências, dados e insights de cada um</span>
      </div>
      <div className="space-y-2.5 mt-6">
        {(clients ?? []).map((c) => {
          const av = avatarColor(c.nome);
          const nIns = insightCount.get(c.id) ?? 0;
          return (
            <Link
              key={c.id}
              href={`/settings/clientes/${c.id}`}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-[16px] border border-white/[.08] bg-white/[.02] hover:border-gold/30 transition-colors"
            >
              <span
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-display text-base shrink-0"
                style={{ background: av.bg, border: `1px solid ${av.border}`, color: av.text }}
              >
                {c.nome.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-[14.5px] font-medium text-[#ededf0]/90">{c.nome}</div>
                <div className="text-xs text-white/40">
                  {hasPrefs.has(c.id) ? "preferências registradas" : "sem preferências"}
                  {nIns > 0 && <span className="text-gold/80"> · {nIns} insights</span>}
                </div>
              </div>
              <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          );
        })}
        {!clients?.length && <p className="text-white/40 text-sm">Nenhum cliente cadastrado.</p>}
      </div>
    </div>
  );
}
