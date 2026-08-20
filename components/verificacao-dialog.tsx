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
import { instrucaoReescritaFalso, podeReescrever } from "@/lib/learning-loop";
import type { ItemVerificado, RegistroVerificacao, TipoVeredicto } from "@/lib/pipeline/verificar";

// `confirmado` se divide em dois no selo: um confirmado sustentado por domínio fora da
// hierarquia não pode contar como um de tier 1 — e também não é ❌, porque a confirmação
// existe. É uma terceira coisa, e o selo diz isso em vez de escolher uma das duas mentiras.
type Bucket = TipoVeredicto | "confirmado_fraco";

const UI: Record<Bucket, { emoji: string; label: string; cor: string }> = {
  confirmado: { emoji: "✅", label: "confirmado", cor: "text-emerald-300" },
  confirmado_fraco: { emoji: "✅", label: "confirmado por fonte fraca", cor: "text-amber-200/75" },
  impreciso: { emoji: "⚠️", label: "impreciso", cor: "text-amber-300" },
  falso: { emoji: "❌", label: "falso", cor: "text-red-300" },
  nao_verificavel: { emoji: "🔍", label: "não verificável", cor: "text-white/45" },
};

// Pior primeiro: o selo é lido de relance e o ❌ é o que muda a decisão do usuário.
// `confirmado_fraco` fica entre os dois extremos: tem fonte (mais que `nao_verificavel`), mas
// ninguém auditou o domínio (menos que `confirmado`).
const ORDEM: Bucket[] = ["falso", "impreciso", "nao_verificavel", "confirmado_fraco", "confirmado"];

/** Registro antigo (sem `fonte_fraca`) cai no bucket de sempre — nada quebra ao ler a v3. */
const bucketDe = (i: ItemVerificado): Bucket =>
  i.veredicto === "confirmado" && i.fonte_fraca ? "confirmado_fraco" : i.veredicto;

const contar = (itens: ItemVerificado[]) =>
  ORDEM.map((v) => ({ v, n: itens.filter((i) => bucketDe(i) === v).length })).filter((c) => c.n > 0);

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

/** Fases do Bob (`/api/bob`), no mesmo molde do ETAPA acima. */
const FASE_BOB: Record<string, string> = {
  pensando: "lendo o roteiro",
  pesquisando: "pesquisando o dado certo",
  escrevendo: "escrevendo o trecho novo",
};

type EventoSSE = { type?: string; [k: string]: unknown };

/**
 * Laço de leitura de um stream `data: {...}`. Local ao arquivo porque as DUAS chamadas daqui
 * (varredura completa e Bob) precisam exatamente dele — e evento truncado não pode abortar
 * o stream. ponytail: a casa tem 5 cópias deste laço em 5 componentes; unificar as outras é
 * refactor de outro dia, não deste diff.
 */
async function lerSSE(res: Response, onEvento: (e: EventoSSE) => void) {
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
      try {
        onEvento(JSON.parse(linha.slice(6)) as EventoSSE);
      } catch {
        continue; // evento truncado não aborta o stream
      }
    }
  }
}

export function useVerificacaoDialog(args: {
  scriptId: string;
  /** sessão do roteiro — o Bob carrega o contexto da sala por ela (`/api/bob`) */
  sessionId: string;
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
      await lerSSE(res, (e) => {
        if (e.type === "phase") setProgresso(e as { etapa?: string; feito?: number; total?: number });
        // §11: erro NÃO grava registro — a tela segue dizendo "não verificado", com o motivo.
        if (e.type === "error") setErro(String(e.message));
        if (e.type === "done") {
          setRodada({ scriptId: args.scriptId, registro: e.registro as RegistroVerificacao });
          router.refresh();
        }
      });
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

        {/* Infra de busca caída ≠ veredicto. Sem este bloco, 14 itens 🔍 leem como "checei 14
            e não confirmei", quando na verdade nenhuma foi checada. */}
        {reg.busca_indisponivel && (
          <p className={`${secao} border-red-500/30 bg-red-500/[.06] text-red-200/90`}>
            <strong>A verificação não rodou:</strong> {reg.busca_indisponivel}. As alegações abaixo aparecem
            como não verificáveis porque <strong>a busca não aconteceu</strong> — não porque a fonte não
            existe e não porque o dado esteja certo. Trate este roteiro como{" "}
            <strong>não verificado</strong> e rode de novo depois de recarregar o crédito.
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
                sessionId={args.sessionId}
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
        reg?.busca_indisponivel
          ? "border-red-500/40 bg-red-500/[.08] text-red-200 hover:border-red-400"
          : reg
            ? "border-white/15 text-white/70 hover:border-gold/50"
            : "border-white/10 text-white/40 hover:border-white/30"
      }`}
    >
      {reg && !reg.busca_indisponivel && !nadaForaDoDossie(reg) && contar(reg.itens).length ? (
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
  // Vence a contagem: a busca caiu, então não há veredicto nenhum para resumir.
  if (reg.busca_indisponivel) return "⚠️ não deu para verificar";
  if (nadaForaDoDossie(reg)) return "nada fora do dossiê";
  const c = contar(reg.itens);
  return c.length ? c.map(({ v, n }) => `${n} ${UI[v].label}`).join(" · ") : "nenhuma alegação verificável";
}

// ── Linha da pseudo-tabela ───────────────────────────────────────────────────
function Linha({
  item,
  roteiro,
  scriptId,
  sessionId,
  disabled,
}: {
  item: ItemVerificado;
  roteiro: string;
  scriptId: string;
  sessionId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [res, setRes] = useState<{ aplicada: boolean; motivo?: string } | null>(null);
  const [pending, startAplicar] = useTransition();
  const { emoji, label, cor } = UI[bucketDe(item)] ?? UI.nao_verificavel;
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

      {/* A confirmação vale, a procedência não foi auditada — e é o usuário que decide olhando. */}
      {item.veredicto === "confirmado" && item.fonte_fraca && (
        <p className="mt-1 pl-6 text-[12px] leading-relaxed text-amber-200/75">
          Confirmado, mas <strong>{item.fonte_fraca}</strong> está fora da hierarquia de fontes da casa —
          ninguém auditou esse domínio. Abra a fonte e julgue antes de tratar como fato firme.
        </p>
      )}

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

      {/* `falso` não tem `correcao` para trocar — o caminho dele é o Bob reescrever. */}
      {item.veredicto === "falso" && (
        <ReescritaBob item={item} roteiro={roteiro} scriptId={scriptId} sessionId={sessionId} disabled={disabled} />
      )}
    </div>
  );
}

// ── `falso` → o Bob reescreve o trecho ───────────────────────────────────────
// Reusa a rota `/api/bob` (a MESMA da edição manual, modo `reescrever`, com pesquisa web
// quando o pedido exige) e o `aplicarCorrecao` (a MESMA troca literal do `impreciso`). O que
// é novo aqui é só a fiação e o estado honesto do §11: nada é aplicado sozinho, e o que
// entra sai marcado "reescrito, não reverificado" — nunca "confirmado".
function ReescritaBob({
  item,
  roteiro,
  scriptId,
  sessionId,
  disabled,
}: {
  item: ItemVerificado;
  roteiro: string;
  scriptId: string;
  sessionId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [proposta, setProposta] = useState<string | null>(null);
  const [fontesBob, setFontesBob] = useState<string[]>([]);
  const [fase, setFase] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [chamando, setChamando] = useState(false);
  const [res, setRes] = useState<{ aplicada: boolean; motivo?: string } | null>(null);
  const [aplicando, startAplicar] = useTransition();

  const reescrito = res?.aplicada || item.reescrito === true;
  const pode = podeReescrever(item, roteiro);

  const chamarBob = async () => {
    setErro(null);
    setProposta(null);
    setChamando(true);
    setFase("pensando");
    try {
      // `antes`/`depois` são o roteiro em volta do trecho: o Bob usa `antes` para saber se a
      // edição é na abertura (onde vive o hook) e mudar de orientação. Mandar "" mentiria.
      const i = roteiro.indexOf(item.trecho_literal);
      const res = await fetch("/api/bob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          modo: "reescrever",
          roteiro,
          trecho: item.trecho_literal,
          antes: i < 0 ? "" : roteiro.slice(0, i),
          depois: i < 0 ? "" : roteiro.slice(i + item.trecho_literal.length),
          instrucao: instrucaoReescritaFalso(item),
          // segunda tentativa: a proposta recusada vira "gere uma DIFERENTE"
          evitar: proposta ?? undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `o Bob falhou (${res.status})`);
      await lerSSE(res, (e) => {
        if (e.type === "phase") setFase(String(e.phase ?? ""));
        if (e.type === "error") setErro(String(e.message));
        if (e.type === "done") {
          setProposta(String(e.texto ?? "").trim());
          setFontesBob(
            String(e.fonte ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setChamando(false);
      setFase(null);
    }
  };

  const aplicar = () =>
    startAplicar(async () => {
      // 4º argumento "reescrita": marca `reescrito` no registro em vez de `aplicada`.
      const r = await aplicarCorrecao(scriptId, item.trecho_literal, proposta ?? "", "reescrita");
      setRes(r);
      if (r.aplicada) router.refresh();
    });

  if (reescrito)
    return (
      <div className="mt-1.5 pl-6">
        {/* §11 outra vez: texto novo que ninguém checou não pode sair de trás como resolvido. */}
        <p className="text-[12px] text-amber-300/90">
          Trecho <strong>reescrito pelo Bob</strong> e aplicado ao roteiro.{" "}
          <strong>Não foi reverificado</strong> — o veredicto ❌ acima fala do texto antigo, e ninguém
          checou o novo. Rode a verificação de novo para saber se o que entrou se sustenta.
        </p>
      </div>
    );

  return (
    <div className="mt-1.5 pl-6">
      {!pode ? (
        // Sem o trecho literal no roteiro atual não há o que substituir depois — o mesmo
        // motivo do `impreciso`, dito com as mesmas palavras.
        !disabled && (
          <p className="text-[12px] text-white/45">
            Não dá para reescrever automaticamente: este trecho não está literalmente no roteiro atual. O
            veredicto continua valendo; a reescrita é manual.
          </p>
        )
      ) : (
        <>
          {proposta ? (
            <div className="flex flex-wrap items-baseline gap-2 text-[12px]">
              <span className="text-red-300/75 line-through">&ldquo;{item.trecho_literal}&rdquo;</span>
              <span className="text-white/30">→</span>
              <span className="text-emerald-300/90">&ldquo;{proposta}&rdquo;</span>
            </div>
          ) : null}

          {fontesBob.length > 0 && (
            // As fontes que o Bob usou, só para leitura. NÃO entram na seção FONTES do roteiro:
            // o formato dela é de 3 linhas com `Sustenta:` (draft.ts) e inventar essa frase aqui
            // seria afirmar o que a fonte sustenta sem ninguém ter lido. Quem quiser, cola à mão.
            <p className="mt-1 text-[11.5px] text-white/40">
              o Bob pesquisou:{" "}
              {fontesBob.map((u, i) => (
                <span key={u}>
                  {i > 0 && " · "}
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-white/20 underline-offset-2 hover:text-gold"
                  >
                    {u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                  </a>
                </span>
              ))}
            </p>
          )}

          {chamando && (
            <p className="mt-1.5 text-[12px] text-white/40 animate-pulse">
              Bob {FASE_BOB[fase ?? ""] ?? "trabalhando"}…
            </p>
          )}

          {erro && <p className="mt-1.5 text-[12px] text-red-300">{erro}</p>}
          {res && !res.aplicada && <p className="mt-1.5 text-[12px] text-amber-300/90">{res.motivo}</p>}

          {!disabled && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={chamarBob}
                disabled={chamando || aplicando}
                className="rounded-[9px] border border-white/15 px-3 py-1 text-[12px] text-white/70 hover:border-gold/50 hover:text-cream disabled:opacity-40"
              >
                {chamando ? "Chamando o Bob…" : proposta ? "Tentar outra" : "Reescrever com o Bob"}
              </button>
              {proposta && (
                <button
                  type="button"
                  onClick={aplicar}
                  disabled={aplicando || chamando}
                  className="rounded-[9px] border border-white/15 px-3 py-1 text-[12px] text-white/70 hover:border-gold/50 hover:text-cream disabled:opacity-40"
                >
                  {aplicando ? "Aplicando…" : "Aplicar reescrita"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
