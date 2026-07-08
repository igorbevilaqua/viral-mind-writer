import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os prompts dos agentes (agents/*.md) são lidos do filesystem em runtime.
  outputFileTracingIncludes: { "/api/generate": ["./agents/**/*"] },
  serverExternalPackages: ["officeparser"],
};

export default nextConfig;
