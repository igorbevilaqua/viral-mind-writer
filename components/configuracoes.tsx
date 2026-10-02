"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { configLLMAtual, trocarModeloLLM } from "@/lib/actions";
import { FUNCOES_LLM, custoDaFuncao, custoDoRoteiro, emDolar, nomeDoModelo, opcoesDe } from "@/lib/llm-catalogo";
import { KASPAROV_EM_MANUTENCAO } from "@/lib/generation";
import { BUILD_TAG } from "@/lib/version";

// A janela de configuração: engrenagem no topo, painel flutuante sobre a página.
//
// Flutuante e não rota de propósito: configuração se abre NO MEIO do que se está fazendo
// ("qual modelo está escrevendo isto aqui?"), e uma rota obrigaria a sair da sessão e voltar.
// O popover fecha com Esc, com clique fora, e não guarda estado entre aberturas — o estado
// mora no servidor.
//
// Só o adm vê a engrenagem. A guarda que vale, porém, é a da server action: esconder o botão
// é cortesia, não autorização.

type Aba = "llm" | "clientes" | "sistema";

const ABAS: { id: Aba; nome: string; resumo: string }[] = [
  { id: "llm", nome: "LLM", resumo: "quem pensa cada parte" },
  { id: "clientes", nome: "Clientes", resumo: "carteira e preferências" },
  { id: "sistema", nome: "Sistema", resumo: "versão e estado" },
];

export default function Configuracoes() {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<Aba>("llm");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const porEsc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    const porFora = (e: MouseEvent) =>
      box.current && !box.current.contains(e.target as Node) && setAberto(false);
    document.addEventListener("keydown", porEsc);
    // `capture`: o clique no próprio botão da engrenagem não deve fechar e reabrir no mesmo gesto.
    document.addEventListener("mousedown", porFora);
    return () => {
      document.removeEventListener("keydown", porEsc);
      document.removeEventListener("mousedown", porFora);
    };
  }, [aberto]);

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label="Configurações"
        aria-expanded={aberto}
        className={`p-1 -m-1 transition-colors ${aberto ? "text-gold" : "text-white/45 hover:text-white"}`}
      >
        {/* Engrenagem com dentes, não círculo com raios: o desenho anterior lia como sol. */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Configurações"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(94vw,680px)] overflow-hidden rounded-[14px] border border-white/[.14] bg-[#101016] shadow-[0_18px_60px_rgba(0,0,0,.62)]"
        >
          <div className="flex flex-col sm:flex-row">
            {/* submenus */}
            <div className="flex shrink-0 gap-1 border-b border-white/[.08] p-2 sm:w-[168px] sm:flex-col sm:border-b-0 sm:border-r">
              {ABAS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  className={`flex-1 rounded-[9px] px-3 py-2 text-left transition-colors ${
                    aba === a.id ? "bg-white/[.07] text-ivory" : "text-white/55 hover:text-white"
                  }`}
                >
                  <span className="block text-[13px] font-medium">{a.nome}</span>
                  <span className="hidden text-[11px] text-white/30 sm:block">{a.resumo}</span>
                </button>
              ))}
            </div>

            <div className="min-w-0 flex-1 max-h-[min(70vh,540px)] overflow-y-auto p-4 sm:p-5">
              {aba === "llm" && <AbaLLM />}
              {aba === "clientes" && <AbaClientes onIr={() => setAberto(false)} />}
              {aba === "sistema" && <AbaSistema />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LLM ─────────────────────────────────────────────────────────────────────

function AbaLLM() {
  const [mapa, setMapa] = useState<Record<string, string> | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    configLLMAtual()
      .then(setMapa)
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, []);

  const trocar = async (slug: string, id: string) => {
    const antes = mapa?.[slug];
    setMapa((m) => (m ? { ...m, [slug]: id } : m)); // otimista: o select não pode "pular de volta"
    setSalvando(slug);
    setErro(null);
    try {
      await trocarModeloLLM(slug, id);
    } catch (e) {
      setMapa((m) => (m && antes ? { ...m, [slug]: antes } : m));
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-[15px] font-semibold text-ivory">Quem pensa cada parte</h2>
      <p className="text-[12.5px] leading-relaxed text-white/40">
        Cada linha é uma coisa que o Codex faz com uma LLM. Trocar vale para todo mundo, a partir
        da próxima geração.
      </p>

      {erro && (
        <p className="mt-3 rounded-[9px] border border-red-500/30 bg-red-500/[.08] px-3 py-2 text-[12px] text-red-300">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-col">
        {FUNCOES_LLM.map((f) => {
          const atual = mapa?.[f.slug];
          const fixo = "fixo" in f;
          const opcoes = opcoesDe(f.slug);
          // Zero em duas situações diferentes: função que não entra num roteiro (Kasparov,
          // carrossel, aprendizado) e a pesquisa, que roda no Grok e não devolve contagem de
          // tokens. Nos dois casos a coluna fica vazia em vez de mostrar "US$ 0,00".
          const custo = atual ? custoDaFuncao(f.slug, atual) : 0;
          return (
            <div
              key={f.slug}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[.06] py-3 first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-white/90">{f.nome}</span>
                <span className="block text-[11.5px] leading-snug text-white/35">{f.resumo}</span>
              </div>
              <span
                title={custo > 0 ? "quanto esta função custa em um roteiro, com o modelo escolhido" : undefined}
                className="shrink-0 w-[58px] text-right font-mono text-[11.5px] text-white/35 tabular-nums"
              >
                {custo > 0 ? emDolar(custo) : ""}
              </span>
              {!mapa ? (
                <span className="text-[12px] text-white/25">carregando…</span>
              ) : fixo ? (
                <span
                  title="Só o Grok tem busca na web ao vivo: trocar o provedor desta função não é mudar um id."
                  className="shrink-0 rounded-[8px] border border-white/[.1] px-2.5 py-1.5 text-[12px] text-white/40"
                >
                  {nomeDoModelo(atual ?? f.padrao)} · fixo
                </span>
              ) : (
                <select
                  value={atual ?? f.padrao}
                  disabled={salvando === f.slug}
                  onChange={(e) => trocar(f.slug, e.target.value)}
                  className="shrink-0 rounded-[8px] border border-white/[.14] bg-white/[.03] px-2.5 py-1.5 text-[12.5px] text-white/80 outline-none cursor-pointer hover:border-gold/40 disabled:opacity-40"
                >
                  {opcoes.map((m) => (
                    <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                      {m.nome} — {m.nota}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {mapa && (
        <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-white/[.14] pt-3">
          <span className="text-[13px] font-medium text-ivory">Um roteiro, com esta escolha</span>
          <span className="font-mono text-[15px] font-semibold text-gold tabular-nums">
            {emDolar(custoDoRoteiro(mapa))}
          </span>
        </div>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-white/25">
        A conta é a mediana do que 165 roteiros gastaram de verdade em cada etapa, pelo preço de
        tabela da Anthropic. Vale para um roteiro completo: um que já venha com a tese digitada,
        ou que replique um vídeo, gasta menos. A pesquisa fica fora porque roda no Grok, que não
        devolve a contagem de tokens.
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-white/25">
        A lista de cada função só oferece modelos que aguentam o que ela faz: as que arrancam
        dados estruturados não aceitam a geração 5.5, que recusa resposta obrigatória por
        ferramenta.
      </p>
    </div>
  );
}

// ─── Clientes e Sistema ──────────────────────────────────────────────────────

function AbaClientes({ onIr }: { onIr: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold text-ivory">Clientes</h2>
      <p className="text-[12.5px] leading-relaxed text-white/40">
        Carteira, preferências de voz e padrões proibidos de cada cliente ficam na própria tela,
        que é grande demais para caber aqui dentro.
      </p>
      <Link
        href="/settings/clientes"
        onClick={onIr}
        className="self-start rounded-[9px] border border-gold/35 bg-gold/[.06] px-3.5 py-2 text-[12.5px] text-gold hover:bg-gold/[.12] transition-colors"
      >
        Abrir clientes
      </Link>
    </div>
  );
}

function AbaSistema() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold text-ivory">Sistema</h2>
      <dl className="flex flex-col gap-2.5 text-[12.5px]">
        <div className="flex items-baseline justify-between gap-4 border-b border-white/[.06] pb-2.5">
          <dt className="text-white/40">Versão</dt>
          <dd className="font-mono text-[11.5px] text-white/70">{BUILD_TAG}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-white/40">Kasparov</dt>
          <dd className={KASPAROV_EM_MANUTENCAO ? "text-amber-300/90" : "text-white/70"}>
            {KASPAROV_EM_MANUTENCAO ? "em manutenção" : "no ar"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
