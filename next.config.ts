import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// A id de cada Server Action é um sha1 SALGADO com a chave de criptografia do build. Sem uma
// chave fixa o Next sorteia uma nova sempre que `.next/cache/.rscinfo` não sobrevive ao deploy
// (ou passa de 14 dias), e aí TODAS as ids mudam de um build para o outro — medido: 36 de 36.
// A consequência é a aba que ficou aberta durante o deploy chamar ids que não existem mais:
// "Server Action ... was not found on the server". Fixar a chave mantém as ids estáveis, e a
// aba velha continua funcionando.
//
// A env var tem prioridade: é onde a chave deve viver em produção, porque ela também cifra os
// argumentos que uma action fechada por closure leva para o cliente. Hoje não existe nenhuma
// (todas as actions são export de topo em lib/actions.ts e app/login/actions.ts), então o
// fallback derivado daqui não expõe nada — mas quem criar a primeira deve setar a env var.
process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ||= createHash("sha256")
  .update("codex-viral-mind/server-actions")
  .digest("base64");

// Capturados no build e expostos como NEXT_PUBLIC_* (ver lib/version.ts).
// git rev-parse pode não existir no build do Hostinger → cai no env ou "unknown".
const appVersion = JSON.parse(readFileSync("./package.json", "utf8")).version as string;
function gitSha(): string {
  if (process.env.NEXT_PUBLIC_GIT_SHA) return process.env.NEXT_PUBLIC_GIT_SHA;
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: appVersion, NEXT_PUBLIC_GIT_SHA: gitSha() },
  // Os prompts dos agentes (agents/*.md) são lidos do filesystem em runtime.
  outputFileTracingIncludes: { "/api/generate": ["./agents/**/*"] },
  serverExternalPackages: ["officeparser"],
};

export default nextConfig;
