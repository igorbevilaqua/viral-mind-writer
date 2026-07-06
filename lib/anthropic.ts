import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

// Rascunho e humanizador = qualidade de escrita; análise e crítica = sonnet.
export const WRITER_MODEL = process.env.VM_WRITER_MODEL ?? "claude-fable-5";
export const ANALYST_MODEL = process.env.VM_ANALYST_MODEL ?? "claude-sonnet-5";
