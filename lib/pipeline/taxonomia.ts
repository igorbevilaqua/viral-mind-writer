// Tradução da taxonomia do Oráculo (oraculo.playbook_categorias, slugs) para os nomes
// canônicos do Codex. Puro: sem banco, sem LLM — é o que permite testar cada mapa.
//
// Os slugs abaixo são os que existem no banco hoje (18 hook, 13 comando, 19 storytelling);
// os `pergunta_*` e `comentario_por_recompensa` foram promovidos dos dados pelo próprio
// Oráculo (fonte 'auto') e não têm par no playbook do Codex — caem em "Outro"/"Pergunta".
import { HOOK_MECHANISMS, type HookFormat, type HookMechanism } from "./hook-mechanisms";

export type Dimensao = "hook" | "comando" | "storytelling";

// `esse_cara` NÃO está aqui de propósito: no Codex é FORMATO (o sujeito da frase), não
// mecanismo — o mecanismo real vem do 2º slug do Oráculo, ou "Outro".
export const HOOK_SLUG_TO_MEC: Record<string, HookMechanism> = {
  apelo_a_autoridade: "Apelo à Autoridade",
  apelo_a_maioria: "Apelo à Maioria",
  apelo_ao_esforco: "Apelo ao Esforço",
  apelo_historico: "Apelo Histórico",
  conflito_declarado: "Conflito Declarado",
  contraste_extremo: "Contraste Extremo",
  desafio_de_crenca: "Desafio de Crença",
  elemento_controverso: "Elemento Controverso",
  o_proibido: "Viés de Ilegalidade",
  ordem_contra_intuitiva: "Ordem Contra-intuitiva",
  pergunta_direta: "Outro",
  pergunta_reflexiva: "Outro",
  revelacao_secreta: "Revelação Secreta",
  superlativo: "Superlativo",
  ultra_especificidade: "Ultra Especificidade",
  urgencia: "Urgência",
  vies_de_negatividade: "Viés de Negatividade",
};

export const HOOK_SLUG_FORMATO: Record<string, HookFormat> = { esse_cara: "Personagem Central" };

// Código + nome = heading "## <code>. <nome>" de playbooks/storytelling.md; é a chave que
// extractPlaybookSection (draft.ts) já usa para recortar a seção da estrutura vencedora.
export const ESTRUTURAS: { code: string; nome: string; slug: string }[] = [
  { code: "A1", nome: "Jornada do Herói", slug: "jornada_do_heroi" },
  { code: "A2", nome: "Herói Improvável", slug: "heroi_improvavel" },
  { code: "A3", nome: "Herói Esquecido", slug: "heroi_esquecido" },
  { code: "B1", nome: "Davi e Golias", slug: "davi_e_golias" },
  { code: "B2", nome: "Conflito Imprevisível", slug: "conflito_imprevisivel" },
  { code: "B3", nome: "Queda do Gigante", slug: "queda_do_gigante" },
  { code: "C1", nome: "O Iconoclasta", slug: "o_iconoclasta" },
  { code: "C2", nome: "Estratégia Oculta", slug: "estrategia_oculta" },
  { code: "C3", nome: "Investigação & Escândalo", slug: "investigacao_escandalo" },
  { code: "D1", nome: "Urgência & Alerta", slug: "urgencia_alerta" },
  { code: "D2", nome: "Evento Global", slug: "evento_global" },
  { code: "D3", nome: "Efeito Dominó", slug: "efeito_domino" },
  { code: "E1", nome: "Paradoxo Contraintuitivo", slug: "paradoxo_contraintuitivo" },
  { code: "E2", nome: "Inovação & Sacada Genial", slug: "inovacao_sacada_genial" },
  { code: "E3", nome: "Narrativa Filosófica", slug: "narrativa_filosofica" },
  { code: "F1", nome: "Erro Fatal", slug: "erro_fatal" },
  { code: "F2", nome: "Dois Mundos", slug: "dois_mundos" },
  { code: "F3", nome: "O Profeta Ignorado", slug: "o_profeta_ignorado" },
  { code: "F4", nome: "Transformação de Identidade", slug: "transformacao_de_identidade" },
];

export const STORY_SLUG_TO_CODE: Record<string, string> = Object.fromEntries(ESTRUTURAS.map((e) => [e.slug, e.code]));

// Nomes como em playbooks/comando.md (caixa normalizada). As perguntas e o "comente para
// receber" não têm gatilho no playbook: viram "Pergunta", um rótulo só, para não inventar taxonomia.
export const COMANDO_SLUG_TO_NOME: Record<string, string> = {
  gatilho_autoridade: "Gatilho de Autoridade",
  gatilho_beneficio: "Gatilho de Benefício Percebido",
  gatilho_comunicacao: "Gatilho da Comunicação",
  gatilho_exclusividade: "Gatilho de Exclusividade",
  gatilho_expectativa: "Gatilho de Expectativa",
  gatilho_inimigo_comum: "Gatilho do Inimigo em Comum",
  gatilho_proposito: "Gatilho do Propósito/Altruísmo",
  comentario_por_recompensa: "Pergunta",
  pergunta_de_engajamento: "Pergunta",
  pergunta_de_opiniao: "Pergunta",
  pergunta_dicotomica: "Pergunta",
  pergunta_direta: "Pergunta",
  pergunta_reflexiva: "Pergunta",
};

export function slugConhecido(dimensao: Dimensao, slug: string): boolean {
  if (dimensao === "hook") return slug in HOOK_SLUG_TO_MEC || slug in HOOK_SLUG_FORMATO;
  if (dimensao === "comando") return slug in COMANDO_SLUG_TO_NOME;
  return slug in STORY_SLUG_TO_CODE;
}

export interface Rotulos {
  hook_mecanismos?: HookMechanism[];
  hook_formato?: HookFormat;
  estruturas?: string[];
  comandos?: string[];
}

const unico = <T>(xs: T[]): T[] => [...new Set(xs)];

// Slugs do Oráculo (em ordem de dominância) → rótulos do Codex, preservando a ordem.
// Slug desconhecido é ignorado (categoria promovida depois deste mapa; conte com slugConhecido).
export function mapearOraculo(dimensao: Dimensao, slugs: string[]): Rotulos {
  if (dimensao === "storytelling") {
    return { estruturas: unico(slugs.map((s) => STORY_SLUG_TO_CODE[s]).filter(Boolean)) };
  }
  if (dimensao === "comando") {
    return { comandos: unico(slugs.map((s) => COMANDO_SLUG_TO_NOME[s]).filter(Boolean)) };
  }
  const mecs = unico(slugs.map((s) => HOOK_SLUG_TO_MEC[s]).filter(Boolean));
  const formato = slugs.map((s) => HOOK_SLUG_FORMATO[s]).find(Boolean);
  // "Outro" = o Oráculo avaliou e não achou mecanismo (só formato, só pergunta, ou nada).
  const out: Rotulos = { hook_mecanismos: mecs.length ? mecs.slice(0, 2) : ["Outro"] };
  if (formato) out.hook_formato = formato;
  return out;
}

// Guarda de carga: um nome fora de HOOK_MECHANISMS aqui quebraria selectHook em silêncio.
for (const m of Object.values(HOOK_SLUG_TO_MEC)) {
  if (!(HOOK_MECHANISMS as readonly string[]).includes(m)) throw new Error(`taxonomia: mecanismo desconhecido "${m}"`);
}
