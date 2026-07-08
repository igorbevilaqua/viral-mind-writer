import OpenAI from "openai";

// xAI expõe API compatível com OpenAI — reusa o SDK já instalado (embeddings).
// Instanciado sob demanda (não no import) para o build não exigir a chave.
export function grokClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.GROK_API_KEY,
  });
}

export const RESEARCH_MODEL = process.env.VM_RESEARCH_MODEL ?? "grok-4.3";
