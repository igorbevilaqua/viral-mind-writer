// Versão do app + git sha, injetados no build por next.config.ts (env).
// Aparecem no <title>, no nav e na caixa de erro — pra todo print de bug se auto-identificar.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
export const BUILD_TAG = `v${APP_VERSION}·${GIT_SHA}`;
