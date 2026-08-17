"use client";

// Verificação factual do roteiro (017 §10/§11): `<dialog>` nativo com pseudo-tabela, no
// mesmo padrão do useClassVideosDialog/useTeachDialog — hook devolvendo os nós prontos, sem
// `<table>` (o projeto não tem nenhuma) e sem shadcn/Radix.
//
// A regra que manda aqui é o §11: a tela nunca diz mais do que foi verificado. Roteiro sem
// registro é "não verificado", NUNCA "verificado, 0 problemas"; delta vazio é um resultado
// bom e é dito com essas palavras; excedente do teto aparece como "não verificada nesta
// rodada" em vez de sumir.

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { aplicarCorrecao } from "@/lib/actions";
import type { ItemVerificado, RegistroVerificacao, TipoVeredicto } from "@/lib/pipeline/verificar";

const UI: Record<TipoVeredicto, { emoji: string; label: string; cor: string }> = {
  confirmado: { emoji: "✅", label: "confirmado", cor: "text-emerald-300" },
  impreciso: { emoji: "⚠️", label: "impreciso", cor: "text-amber-300" },
  falso: { emoji: "❌", label: "falso", cor: "text-red-300" },
  nao_verificavel: { emoji: "🔍", label: "não verificável", cor: "text-white/45" },
};

// Pior primeiro: o selo é lido de relance e o ❌ é o que muda a decisão do usuário.
const ORDEM: TipoVeredicto[] = ["falso", "impreciso", "nao_verificavel", "confirmado"];

const contar = (itens: ItemVerificado[]) =>
  ORDEM.map((v) => ({ v, n: itens.filter((i) => i.veredicto === v).length })).filter((c) => c.n > 0);

/** Delta que não sobrou nada: tudo rastreado ao dossiê. Resultado legítimo, e bom (§11). */
const nadaForaDoDossie = (r: RegistroVerificacao) => r.regime === "delta" && r.itens.length === 0;

/**
 * §7.1/§11: a correção só é oferecida quando o trecho existe LITERALMENTE no roteiro aberto.
 * O servidor revalida com o texto do banco imediatamente antes de escrever — as duas
 * validações são necessárias e não se substituem: esta evita oferecer um botão que não
 * funciona, a de lá evita apagar edição feita entre a verificação e o clique.
 */
const podeAplicar = (item: ItemVerificado, roteiro: string) =>
  item.veredicto === "impreciso" &&
  !!item.correcao &&
  !!item.trecho_literal &&
  roteiro.includes(item.trecho_literal);

const secao = "rounded-[10px] border px-3 py-2 text-[12.5px] leading-relaxed";

const ETAPA: Record<string, string> = {
  extraindo: "extraindo as alegações do roteiro",
  buscando: "buscando fonte para cada alegação",
  classificando: "julgando com as fontes em mãos",
};

export function useVerificacaoDialog(args: {
  scriptId: string;
  /** o que veio do banco (`vm_generated_scripts.verificacao`) — `null` = nunca verificado */
  registro: RegistroVerificacao | null;
  /** roteiro aberto: é contra ele que o `includes` da correção roda */
  roteiro: string;
  /** sessão encerrada → só leitura, sem varredura e sem aplicar */
  disabled?: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Resultado da rodada disparada aqui: aparece na hora, sem esperar o round-trip do refresh.
  // Carrega o scriptId junto porque o hook é UM só para todas as versões — trocar de v2 para
  // v1 no seletor não pode arrastar o registro da v2 para a tela da v1.
  const [rodada, setRodada] = useState<{ scriptId: string; registro: RegistroVerificacao } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [rodando, setRodando] = useState(false);
  const [progresso, setProgresso] = useState<{ etapa?: string; feito?: number; total?: number } | null>(null);
  const reg = (rodada?.scriptId === args.scriptId ? rodada.registro : null) ?? args.registro;

  const abrir = () => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  };

  /**
   * `/api/verificar` (SSE), não a server action `verificarScript`: a varredura completa é a
   * operação cara da peça e o progresso É o heartbeat — N buscas em silêncio estouram o
   * idle-timeout do proxy da Hostinger. Molde do `generate()` do session-view.
   */
  const verificarTudo = async () => {
    setErro(null);
    setProgresso(null);
    setRodando(true);
    abrir();
    try {
      const res = await fetch("/api/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: args.scriptId, regime: "completa" }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `falha na verificação (${res.status})`);
      if (!res.body) throw new Error("sem stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n\n");
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          let e;
          try {
            e = JSON.parse(linha.slice(6));
          } catch {
            continue; // evento truncado não aborta o stream
          }
          if (e.type === "phase") setProgresso(e);
          // §11: erro NÃO grava registro — a tela segue dizendo "não verificado", com o motivo.
          if (e.type === "error") setErro(e.message);
          if (e.type === "done") {
            setRodada({ scriptId: args.scriptId, registro: e.registro as RegistroVerificacao });
            router.refresh();
          }
        }
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setRodando(false);
      setProgresso(null);
    }
  };

  const botaoVarredura = (rotulo: string) =>
    args.disabled ? null : (
      <button
        type="button"
        onClick={verificarTudo}
        disabled={rodando}
        className="inline-flex items-center gap-2 rounded-[10px] border border-white/20 px-4 py-2 text-[13px] text-white/80 hover:border-gold/50 hover:text-cream transition-colors disabled:opacity-40"
      >
        {rodando ? "Verificando…" : rotulo}
      </button>
    );

  // Erro da rodada: fica visível nos dois estados (com e sem registro). Verificação que
  // falhou não grava nada (`verificarScriptSalvo` lança), então o roteiro segue "não
  // verificado" — e o motivo tem que estar na tela, não só no log do servidor.
  const avisoErro = erro ? (
    <p className={`${secao} border-red-500/30 bg-red-500/[.06] text-red-300`}>{erro}</p>
  ) : null;

  const andamento = rodando ? (
    <p className="text-[13px] text-white/40 animate-pulse">
      {ETAPA[progresso?.etapa ?? ""] ?? "Verificando as alegações do roteiro"}
      {progresso?.total ? ` · ${progresso.feito ?? 0}/${progresso.total}` : ""}…
    </p>
  ) : null;

  const corpo = () => {
    if (rodando && !reg) return andamento;

    if (!reg)
      return (
        <div className="space-y-3">
          {/* §11: sem registro é "não verificado". Nunca "verificado, 0 problemas". */}
          <p className="text-[13px] text-white/60">
            Este roteiro <strong className="text-white/85">não foi verificado</strong>. Nenhuma alegação foi
            checada. O silêncio aqui não é aprovação.
          </p>
          {avisoErro}
          {botaoVarredura("Verificar tudo")}
        </div>
      );

    return (
      <div className="space-y-3">
        {andamento}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-white/40">
          <span>{reg.regime === "delta" ? "rodada automática · só o que não veio do dossiê" : "varredura completa"}</span>
          <span className="ml-auto">{new Date(reg.at).toLocaleString("pt-BR")}</span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-white/50">
          <span>{reg.total_alegacoes} alegações no roteiro</span>
          <span>· {reg.rastreadas} rastreadas ao dossiê</span>
          <span>· {reg.verificadas} verificadas nesta rodada</span>
          {reg.excedentes > 0 && <span className="text-amber-300/80">· {reg.excedentes} fora do teto</span>}
        </div>

        {!reg.dossie_presente && (
          <p className={`${secao} border-amber-500/25 bg-amber-500/[.06] text-amber-200/90`}>
            Esta sessão não tem dossiê de pesquisa, então a rodada foi <strong>integral</strong>: toda alegação
            precisou ser checada, nada pôde ser rastreado.
          </p>
        )}

        {reg.excedentes > 0 && (
          <p className={`${secao} border-amber-500/25 bg-amber-500/[.06] text-amber-200/90`}>
            {reg.excedentes} alegaç{reg.excedentes === 1 ? "ão ficou" : "ões ficaram"} fora do teto desta
            rodada. Estão listadas abaixo como <em>não verificada nesta rodada</em>. A varredura completa
            drena o resto.
          </p>
        )}

        {avisoErro}

        {nadaForaDoDossie(reg) ? (
          <div className="space-y-3">
            <p className={`${secao} border-emerald-500/25 bg-emerald-500/[.06] text-emerald-200/90`}>
              <strong>Nada fora do dossiê.</strong> As {reg.total_alegacoes} alegações do roteiro estão
              rastreadas à pesquisa desta sessão, então nenhuma precisou de busca externa. O dossiê em si não
              foi auditado. É para isso que serve a varredura completa.
            </p>
            {botaoVarredura("Verificar tudo mesmo assim")}
          </div>
        ) : reg.itens.length === 0 ? (
          <p className="text-[13px] text-white/50">
            Nenhuma alegação factual verificável foi encontrada neste roteiro.
          </p>
        ) : (
          <div className="space-y-1">
            {reg.itens.map((item, i) => (
              <Linha
                key={i}
                item={item}
                roteiro={args.roteiro}
                scriptId={args.scriptId}
                disabled={!!args.disabled}
              />
            ))}
          </div>
        )}

        {!nadaForaDoDossie(reg) && reg.regime === "delta" && (
          <div className="pt-1">{botaoVarredura("Verificar tudo")}</div>
        )}
      </div>
    );
  };

  const dialog = (
    /* <dialog> nativo (padrão do class-videos-dialog): Esc e backdrop fecham de graça */
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="backdrop:bg-black/70 backdrop:backdrop-blur-sm m-auto w-[min(720px,95vw)] max-h-[85dvh] open:flex flex-col rounded-[20px] border border-gold/30 bg-[#141416] text-[#ededf0] p-0"
    >
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/[.08] bg-gradient-to-b from-gold/[.06] to-transparent">
        <div className="min-w-0">
          <div className="kicker text-gold text-[10px]">VERIFICAÇÃO FACTUAL</div>
          <div className="text-[15px] font-medium truncate">{resumoSelo(reg)}</div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="ml-auto shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[.06]"
          aria-label="Fechar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">{corpo()}</div>
    </dialog>
  );

  /** Selo do card: contagem por veredicto, ou o estado honesto quando não há o que contar. */
  const selo = (
    <button
      type="button"
      onClick={abrir}
      title="Verificação factual"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] transition-colors ${
        reg ? "border-white/15 text-white/70 hover:border-gold/50" : "border-white/10 text-white/40 hover:border-white/30"
      }`}
    >
      {reg && !nadaForaDoDossie(reg) && contar(reg.itens).length ? (
        contar(reg.itens).map(({ v, n }) => (
          <span key={v} className={UI[v].cor}>
            {UI[v].emoji} {n}
          </span>
        ))
      ) : (
        // "não verificado" · "nada fora do dossiê" · "nenhuma alegação verificável" — os três
        // estados em que não há contagem para mostrar, e nenhum deles vira "0 problemas".
        <span>{resumoSelo(reg)}</span>
      )}
    </button>
  );

  const botaoVerificarTudo: ReactNode = args.disabled ? null : (
    <div className="flex items-center gap-2.5 flex-wrap">
      {botaoVarredura("Verificar tudo")}
      <span className="text-[12px] text-white/55">
        varredura completa · checa toda alegação, inclusive as que vieram do dossiê. Mais lenta e mais cara
        que a verificação automática, que só olha o que está fora dele
      </span>
    </div>
  );

  return { abrir, dialog, selo, botaoVerificarTudo };
}

/** Texto do estado, em uma linha — a mesma frase no header do dialog e no title do selo. */
function resumoSelo(reg: RegistroVerificacao | null) {
  if (!reg) return "não verificado";
  if (nadaForaDoDossie(reg)) return "nada fora do dossiê";
  const c = contar(reg.itens);
  return c.length ? c.map(({ v, n }) => `${n} ${UI[v].label}`).join(" · ") : "nenhuma alegação verificável";
}

// ── Linha da pseudo-tabela ───────────────────────────────────────────────────
function Linha({
  item,
  roteiro,
  scriptId,
  disabled,
}: {
  item: ItemVerificado;
  roteiro: string;
  scriptId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [res, setRes] = useState<{ aplicada: boolean; motivo?: string } | null>(null);
  const [pending, startAplicar] = useTransition();
  const { emoji, label, cor } = UI[item.veredicto] ?? UI.nao_verificavel;
  const aplicavel = podeAplicar(item, roteiro);
  // `aplicarCorrecao` marca `aplicada` no próprio registro depois de reescrever o roteiro, então
  // o estado sobrevive ao refresh sem heurística de texto: a linha sabe que foi ela que corrigiu,
  // em vez de olhar o roteiro já corrigido e concluir que o trecho "sumiu".
  const aplicada = res?.aplicada || item.aplicada === true;

  const aplicar = () =>
    startAplicar(async () => {
      const r = await aplicarCorrecao(scriptId, item.trecho_literal, item.correcao ?? "");
      setRes(r);
      if (r.aplicada) router.refresh();
    });

  return (
    <div className="rounded-md px-2 py-2 -mx-2 hover:bg-white/[.04]">
      <div className="flex items-baseline gap-2.5 text-[13px]">
        <span className={`shrink-0 ${cor}`} title={label}>
          {emoji}
        </span>
        <span className="min-w-0 flex-1 truncate text-white/85" title={item.alegacao}>
          {item.alegacao}
        </span>
        {item.fonte ? (
          <a
            href={item.fonte.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 max-w-[38%] truncate text-[11.5px] text-white/50 underline decoration-white/20 underline-offset-2 hover:text-gold"
          >
            {item.fonte.veiculo}
            {item.fonte.ano ? ` (${item.fonte.ano})` : ""}
          </a>
        ) : (
          <span className="ml-auto shrink-0 text-[11px] text-white/25">sem fonte</span>
        )}
      </div>

      {item.explicacao && <p className="mt-1 pl-6 text-[12px] leading-relaxed text-white/50">{item.explicacao}</p>}

      {item.veredicto === "impreciso" && item.correcao && (
        <div className="mt-1.5 pl-6">
          {/* o antes e o depois, sempre visíveis — o usuário decide olhando os dois */}
          <div className="flex flex-wrap items-baseline gap-2 text-[12px]">
            <span className="text-red-300/75 line-through">&ldquo;{item.trecho_literal}&rdquo;</span>
            <span className="text-white/30">→</span>
            <span className="text-emerald-300/90">&ldquo;{item.correcao}&rdquo;</span>
          </div>
          {aplicada ? (
            <p className="mt-1.5 text-[12px] text-emerald-300">Correção aplicada ao roteiro.</p>
          ) : aplicavel && !disabled ? (
            <>
              <button
                type="button"
                onClick={aplicar}
                disabled={pending}
                className="mt-1.5 rounded-[9px] border border-white/15 px-3 py-1 text-[12px] text-white/70 hover:border-gold/50 hover:text-cream disabled:opacity-40"
              >
                {pending ? "Aplicando…" : "Aplicar correção"}
              </button>
              {res && !res.aplicada && <p className="mt-1.5 text-[12px] text-amber-300/90">{res.motivo}</p>}
            </>
          ) : (
            !disabled && (
              // §11: veredicto vale, ação cai — e o motivo fica na tela em vez de virar um
              // botão que falharia no clique.
              <p className="mt-1.5 text-[12px] text-white/45">
                Não dá para aplicar automaticamente: este trecho não está literalmente no roteiro atual. O
                verificador parafraseou em vez de copiar, ou o roteiro mudou depois. O veredicto continua
                valendo; a troca é manual.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
