export type PipelineEvent =
  | { type: "phase"; phase: "coleta" | "modelagem" | "rascunho" | "critica" | "humanizacao" | "salvando" }
  | { type: "token"; text: string }
  | { type: "done"; scriptId: string }
  | { type: "error"; message: string };

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

export interface GenerationContext {
  sessionId: string;
  prompt: string;
  clientId: string | null;
  clientPrefs: ClientPrefs | null;
  playbooks: Record<string, string>; // slug -> markdown
  bannedPhrases: BannedPhrase[];
  insights: { insight_type: string; scope: string; payload: unknown }[];
  fewShot: { roteiro: string; origem: string }[];
  attachments: Attachment[];
  modelagemBriefs: string[];
}

export interface ScriptSections {
  headline: string | null;
  hook: string | null;
  hookVariants: string[];
  roteiro: string;
  comando: string | null;
  fontes: string | null;
}
