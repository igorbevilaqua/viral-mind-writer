import type { UsageLog } from "../anthropic";

export type PipelineEvent =
  | {
      type: "phase";
      phase:
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
  | { type: "token"; text: string }
  | { type: "done"; scriptId: string }
  | { type: "error"; message: string };

export interface NarrativaCandidata {
  titulo: string;
  estrutura: string; // código + nome no playbook, ex: "A1. Jornada do Herói"
  personagem: string;
  conflito: string;
  mecanismo_emocional: string;
  beats: string[];
  gancho_potencial: string;
  porque_funciona: string;
}

export interface RankingItem {
  indice: number; // posição na lista de candidatas
  score: number; // 0-100
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
}

// Saída da modelagem (vm_modelagem_analyses.analysis). O `esqueleto` é a parte
// transferível — por contrato, livre de qualquer conteúdo do vídeo original.
// `angulos` só existe quando não há tema digitado (viram as narrativas candidatas).
export interface ModelagemAngulo {
  conceito: string;
  pergunta_nova: string;
  emocao_dominante: string;
  amplificador_br: string;
  hook_pronto: string;
  arco: string;
  porque_supera: string;
  compativel_com_cliente: string;
}

export interface ModelagemAnalysis {
  diagnostico?: {
    gargalo?: string;
    onde_superamos?: string;
    por_camada?: { camada: string; evidencia: string; leitura: string }[];
  };
  esqueleto?: {
    estrutura_narrativa?: string;
    hook?: { tipo?: string; mecanismo?: string; funcao?: string };
    beats?: { ordem: number; funcao: string; mecanismo_de_atencao: string; emocao: string; seg?: number }[];
    loops_abertos?: { o_que_fica_pendente: string; fecha_em_qual_beat: number }[];
    escalada?: string;
    comando?: { tipo?: string; gatilho?: string; posicao?: string };
  };
  nao_transferivel?: string[];
  timing?: { classe?: string; contribuicao_pct?: number };
  angulos?: ModelagemAngulo[];
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
  clientId: string | null;
  clientPrefs: ClientPrefs | null;
  playbooks: Record<string, string>; // slug -> markdown
  bannedPhrases: BannedPhrase[];
  insights: { insight_type: string; scope: string; payload: unknown }[];
  fewShot: { roteiro: string; origem: string }[];
  attachments: Attachment[];
  modelagemBriefs: string[];
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
