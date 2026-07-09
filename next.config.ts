import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

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
