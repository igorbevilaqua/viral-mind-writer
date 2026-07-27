"use client";

import { useState, useTransition } from "react";
import { promoteHookPlaybook, dismissHookPlaybook } from "@/lib/actions";

export interface Proposta {
  version: number;
  content: string;
  created_at: string;
}

// Portão humano da Fase 4: revisar e promover (ou descartar) uma versão de playbook
// que o curador propôs a partir dos resultados reais dos mecanismos na sala.
export default function PlaybookProposals({ propostas }: { propostas: Proposta[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const [pending, start] = useTransition();
  if (!propostas.length) return null;

  return (
    <section className="mt-8">
      <div className="kicker text-gold tracking-[.22em]">PROPOSTAS DE PLAYBOOK (HOOK)</div>
      <p className="mt-1.5 text-[13px] text-white/50">
        O curador propôs uma nova versão do playbook de hooks a partir dos resultados reais dos mecanismos. Revise antes
        de ativar. Nada entra na sala sem você.
      </p>
      <div className="flex flex-col gap-2 mt-3">
        {propostas.map((p) => (
          <div key={p.version} className="rounded-[14px] border border-gold/25 bg-gold/[.03] px-4 sm:px-5 py-3.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-full border border-gold/35 px-2.5 py-[3px] text-[11px] text-gold/85">v{p.version}</span>
              <span className="text-[13px] text-white/60">{p.content.length.toLocaleString("pt-BR")} caracteres</span>
              <button
                onClick={() => setAberta(aberta === p.version ? null : p.version)}
                className="text-[12.5px] text-white/60 hover:text-white/85 underline underline-offset-2"
              >
                {aberta === p.version ? "ocultar" : "revisar conteúdo"}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await dismissHookPlaybook(p.version); })}
                  className="rounded-[10px] border border-white/12 px-3 py-1.5 text-[12.5px] text-white/55 hover:border-white/25 hover:text-white/80 disabled:opacity-50"
                >
                  Descartar
                </button>
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await promoteHookPlaybook(p.version); })}
                  className="btn-gold rounded-[10px] px-3.5 py-1.5 text-[12.5px] font-semibold disabled:opacity-50"
                >
                  Ativar esta versão
                </button>
              </div>
            </div>
            {aberta === p.version && (
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-[10px] border border-white/10 bg-black/30 p-3 text-[12px] leading-relaxed text-[#ededf0]/80 whitespace-pre-wrap">
                {p.content}
              </pre>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
