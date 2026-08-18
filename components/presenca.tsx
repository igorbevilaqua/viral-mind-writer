"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase/browser";
import { pessoasPresentes, type Pessoa } from "@/lib/presenca";

// Presença sobre Supabase Realtime (Presence + Broadcast): canal puro, sem publicação de tabela
// e sem RLS. É COSMÉTICA — a identidade chega como prop do server component e nada que entra
// pelo canal decide permissão. O que trafega são pessoas e eventos discretos ("alguém salvou"),
// NUNCA o texto do roteiro: o editor é splice por offset (lib/bob-edit.ts) e espelhar digitação
// entre duas pessoas corromperia o texto.

/** Estado compartilhado por conexão. Cabe numa linha porque é tudo que a UI precisa. */
type Meta = { userId: string; nome: string; editando: boolean };

function usePresenca(canalNome: string, userId: string | null, nome: string, excluirEu: boolean) {
  const router = useRouter();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const canalRef = useRef<RealtimeChannel | null>(null);
  // O estado corrente vive num ref: quem (re)entra no canal precisa anunciar o valor de agora,
  // e o subscribe roda fora do ciclo de render.
  const editandoRef = useRef(false);

  useEffect(() => {
    const sb = browserClient();
    if (!sb || !userId) return;

    const canal = sb.channel(canalNome);
    canalRef.current = canal;
    const meta = (): Meta => ({ userId, nome, editando: editandoRef.current });

    canal
      .on("presence", { event: "sync" }, () =>
        setPessoas(pessoasPresentes(canal.presenceState(), excluirEu ? userId : null))
      )
      // Eventos discretos, não conteúdo: o receptor recarrega do servidor (padrão do repo) e vê
      // o resultado real. `broadcast.self` fica desligado (padrão) — quem envia já deu refresh.
      .on("broadcast", { event: "mudou" }, () => router.refresh())
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") canal.track(meta()).catch(() => {});
        // CHANNEL_ERROR / TIMED_OUT / CLOSED: Realtime desligado, token vencido, rede caída.
        // Degrada em silêncio — some da tela e ninguém vê erro. Sem retry nosso: o socket do
        // supabase-js já reconecta com backoff próprio, e um loop por cima disso seria pior.
        else setPessoas([]);
      });

    return () => {
      canalRef.current = null;
      void sb.removeChannel(canal);
    };
  }, [canalNome, userId, nome, excluirEu, router]);

  const setEditando = useCallback(
    (v: boolean) => {
      editandoRef.current = v;
      if (!userId) return;
      canalRef.current?.track({ userId, nome, editando: v } satisfies Meta).catch(() => {});
    },
    [userId, nome]
  );

  const avisar = useCallback((evento: string) => {
    canalRef.current?.send({ type: "broadcast", event: "mudou", payload: { evento } }).catch(() => {});
  }, []);

  return { pessoas, setEditando, avisar };
}

function Bolinha() {
  return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/85 shrink-0" />;
}

/**
 * Anuncia a aba no canal global sem renderizar nada. Quem está DENTRO de uma sessão é
 * justamente quem está trabalhando — sem isto, ele sumiria da lista de online.
 */
export function useOnline(userId: string | null, nome: string) {
  usePresenca("writer:online", userId, nome, false);
}

/** Quem está com o writer aberto agora (canal global). Ninguém online = nada na tela. */
export function OnlineAgora({ userId, nome }: { userId: string | null; nome: string }) {
  const { pessoas } = usePresenca("writer:online", userId, nome, false);
  if (!pessoas.length) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-4">
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-white/35">
        <Bolinha />
        online agora
      </span>
      {pessoas.map((p) => (
        <span
          key={p.userId}
          className="rounded-full border border-white/[.12] bg-white/[.03] px-2.5 py-[3px] text-[11.5px] text-white/60"
        >
          {p.userId === userId ? "você" : p.nome}
        </span>
      ))}
    </div>
  );
}

/** Quem mais está com ESTA sessão aberta. Sozinho = nada, nem espaço reservado. */
export function Presentes({ pessoas }: { pessoas: Pessoa[] }) {
  if (!pessoas.length) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[.06] px-3 py-1 text-xs text-emerald-200/85">
      <Bolinha />
      {pessoas.map((p) => p.nome).join(", ")} {pessoas.length > 1 ? "estão" : "está"} aqui
    </span>
  );
}

/**
 * A razão de ser desta entrega: hoje, se duas pessoas editam e salvam, `updateScript` sobrescreve
 * em silêncio e quem salvou primeiro perde o trabalho. Avisa, não bloqueia.
 */
export function AvisoDeEdicao({ pessoas }: { pessoas: Pessoa[] }) {
  const editando = pessoas.filter((p) => p.editando);
  if (!editando.length) return null;
  const quem = editando.map((p) => p.nome).join(", ");
  return (
    <div className="flex items-start gap-2 px-5 sm:px-6 py-2.5 border-b border-amber-500/30 bg-amber-500/[.09] text-[12.5px] leading-relaxed text-amber-200/90">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-[3px] shrink-0">
        <path d="M8 2 14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 6.5V9.5M8 11.5V11.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span>
        <strong className="font-medium">
          {quem} {editando.length > 1 ? "estão editando" : "está editando"} este roteiro agora.
        </strong>{" "}
        Quem salvar por último apaga o texto do outro — combinem antes de salvar.
      </span>
    </div>
  );
}

/** Canal da sessão: presença dos outros + eventos discretos. */
export function usePresencaSessao(sessionId: string, userId: string | null, nome: string) {
  const { pessoas, setEditando, avisar } = usePresenca(`sessao:${sessionId}`, userId, nome, true);
  return { outros: pessoas, setEditando, avisar };
}
