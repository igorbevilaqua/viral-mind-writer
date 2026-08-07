import type { UsageLog } from "../anthropic";

export type PipelineEvent =
  | {
      type: "phase";
      phase:
        | "premissa"
        | "pesquisa"
        | "modelagem"
        | "narrativas"
        | "roteiro"
        | "hook_comando"
        | "revisao"
        | "humanizacao"
        | "salvando";
    }
  | { type: "narrativas"; candidatas: NarrativaCandidata[]; ranking: RankingItem[]; escolhida: number }
  // Modo modelagem: a autópsia extraiu a tese do original e o pipeline PAROU aqui. O usuário
  // confirma/edita e o run 2 segue reusando os artifacts. Ver runPipeline.
  | { type: "premissa_pendente"; sugerida: string }
  | { type: "token"; text: string }
  | { type: "done"; scriptId: string }
  | { type: "error"; message: string };

export interface NarrativaCandidata {
  titulo: string;
  estrutura: string; // código + nome no playbook, ex: "A1. Jornada do Herói"
  // Por que esta arquitetura sustenta a premissa. Todas as candidatas defendem a MESMA tese —
  // o que varia é o caminho. Opcional: sessões geradas antes da Etapa B não têm.
  como_serve_a_premissa?: string;
  personagem: string;
  conflito: string;
  mecanismo_emocional: string;
  beats: string[];
  gancho_potencial: string;
  porque_funciona: string;
}

export interface RankingItem {
  indice: number; // posição na lista de candidatas
  score: number; // 0-100 — potencial viral (views)
  // 0-100 — quão bem a arquitetura sustenta a premissa. Eixo separado do viral, e usado como
  // RESTRIÇÃO na escolha da vencedora, não como desempate. Opcional: rankings pré-Etapa C não têm.
  servico_a_premissa?: number;
  justificativa: string;
  // WP-F.1: até 3 dados concretos que pesaram no score (opcional — sessões antigas não têm)
  evidencia?: string[];
}

// Cacheado em vm_sessions.artifacts: trocar narrativa / regenerar não re-paga pesquisa+storytelling.
export interface SessionArtifacts {
  dossie: string;
  candidatas: NarrativaCandidata[];
  ranking: RankingItem[];
  escolhida: number; // índice em candidatas
  orientacao_roteiro: string;
  orientacao_hook: string;
  // Tese extraída da modelagem aguardando confirmação do usuário (run 1 do modo modelagem).
  // Confirmada, vira vm_sessions.premissa e este campo deixa de importar.
  premissa_sugerida?: string;
  // O que a premissa precisa provar → pauta de busca do pesquisador (derivePremissa).
  premissa_provas?: string[];
  premissa_contraintuitivo?: string | null;
}

// Saída da autópsia do vídeo (vm_modelagem_analyses.analysis), em duas metades com
// destinos DIFERENTES:
//
// `compreensao` = do que o vídeo trata e por que a audiência foi recompensada. Carrega
//   conteúdo, então alimenta só a SALA (pesquisa dirigida e proposta de ângulos) — nunca
//   o roteirista, que é por onde a cópia voltava. Exceção: `recompensa` e os dois motores
//   de engajamento viajam no brief, como ALVO a bater (são tipo de prêmio, não conteúdo).
//
// `esqueleto` = a mecânica transferível, por contrato livre de conteúdo. Vai ao roteirista.
export interface ModelagemCompreensao {
  tema: string;
  argumento_central: string;
  promessa_da_abertura: string;
  recompensa: string;
  motor_comentario: string;
  motor_compartilhamento: string;
  alegacoes?: string[];
}

export interface ModelagemAnalysis {
  compreensao?: ModelagemCompreensao;
  diagnostico?: {
    gargalo?: string;
    onde_superamos?: string;
    por_camada?: { camada: string; evidencia: string; leitura: string }[];
  };
  esqueleto?: {
    estrutura_narrativa?: string;
    hook?: { tipo?: string; fator_de_curiosidade?: string; mecanismo?: string; funcao?: string };
    beats?: { ordem: number; funcao: string; mecanismo_de_atencao: string; emocao: string; seg?: number }[];
    loops_abertos?: { o_que_fica_pendente: string; fecha_em_qual_beat: number }[];
    escalada?: string;
    comando?: { tipo?: string; gatilho?: string; posicao?: string };
  };
  nao_transferivel?: string[];
  timing?: { classe?: string; contribuicao_pct?: number };
}

export interface Attachment {
  id: string;
  kind: "reference_script" | "news_link" | "document" | "video_link";
  is_modelagem: boolean;
  url: string | null;
  raw_content: string | null;
}

export interface ClientPrefs {
  nome: string;
  proibicoes: string[];
  tom_de_voz: string | null;
  temas_preferidos: string[];
  vocabulario_evitar: string[];
  vocabulario_usar: string[];
  notas_entrevista: string | null;
}

export interface BannedPhrase {
  pattern: string;
  label: string | null;
  severity: "block" | "warn";
  // Por que a regra existe (migration 0023). Vai ao prompt junto da regra: sem o motivo o
  // modelo não estende a proibição para variantes não cadastradas — foi assim que
  // "não são X. Aquilo é Y" escapou de uma banlist que já tinha "não é X, é Y".
  motivo?: string | null;
}

// Payload dos insights por cliente materializados pelo ETL (insight_type client_*)
export interface ClientInsightPayload {
  titulo: string;
  descricao: string;
  score: number;
  tipo?: string;
  performance_ratio?: number;
  media_views?: number | null;
  media_seguidores?: number | null;
  amostra?: number;
  recencia_dias?: number | null;
  ultimo_uso?: string | null;
  destaque?: boolean;
}

export interface GenerationContext {
  sessionId: string;
  userId: string | null; // vm_sessions.user_id — dono da sessão (telemetria do hub)
  prompt: string;
  // A tese que o vídeo defende. Resolvida no topo do pipeline e congelada: todo agente recebe
  // esta MESMA string via premissaBlock(). Vazia só antes da resolução.
  premissa: string;
  premissaOrigem: "digitada" | "modelagem" | "derivada" | null;
  // Só existem quando a premissa foi DERIVADA (o nó devolve os dois junto com a tese):
  // as provas viram a pauta de busca do pesquisador, o contraintuitivo alimenta o hook.
  premissaProvas?: string[];
  premissaContraintuitivo?: string | null;
  clientId: string | null;
  clientPrefs: ClientPrefs | null;
  playbooks: Record<string, string>; // slug -> markdown
  bannedPhrases: BannedPhrase[];
  insights: { insight_type: string; scope: string; payload: unknown }[];
  fewShot: { roteiro: string; origem: string }[];
  attachments: Attachment[];
  modelagemBriefs: string[];
  // O brief só chega ao designHook no modo adaptação (sem narrativa vencedora). O fator de
  // curiosidade do vídeo modelado tem que chegar SEMPRE — é a matéria-prima do hook.
  modelagemHooks: NonNullable<ModelagemAnalysis["esqueleto"]>["hook"][];
  artifacts: SessionArtifacts | null;
  // telemetria de custo por fase — preenchida pelos agentes, persistida em pipeline_trace.usage
  usageLog?: UsageLog;
  // WP-E.1: fingerprint do conhecimento usado na geração (persistido em pipeline_trace.fingerprint)
  lessonIds?: string[]; // vm_lesson_learnings.id das lições taught presentes no contexto
  playbookVersions?: { slug: string; version: number }[];
  insightRunId?: string | null; // último vm_insight_runs vigente na geração
}

export interface ScriptSections {
  headline: string | null;
  hook: string | null;
  hookVariants: string[];
  roteiro: string;
  comando: string | null;
  fontes: string | null;
}
