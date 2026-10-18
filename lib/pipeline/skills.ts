import fs from "node:fs";
import path from "node:path";
import { NOME_SKILL, SKILLS, type Skill } from "../skills-catalogo";
import type { GenerationContext } from "./types";

// Cada skill é um arquivo com uma seção "## <secao>" por agente: o agente recebe só a dele.
export const SECOES = ["quando", "pesquisa", "narrativas", "dados", "hook", "roteiro", "revisao", "comando"] as const;
export type SecaoSkill = (typeof SECOES)[number];

const cache = new Map<Skill, string>();
// Lê as quatro na primeira chamada: o deploy da Hostinger apaga a pasta da versão antiga com o
// processo rodando, e a geração no meio morreria no primeiro arquivo ainda não lido (o mesmo
// motivo de agentPrompt, sessão 43495956).
export function textoDaSkill(skill: Skill): string {
  if (!cache.size) for (const s of SKILLS) cache.set(s, fs.readFileSync(path.join(process.cwd(), "skills", `${s}.md`), "utf8"));
  return cache.get(skill) ?? "";
}

const partes = (skill: Skill) => textoDaSkill(skill).split(/\n(?=## )/);

export function secaoDaSkill(skill: Skill, secao: SecaoSkill): string {
  const alvo = partes(skill).find((p) => p.startsWith(`## ${secao}\n`));
  return alvo ? alvo.slice(`## ${secao}\n`.length).trim() : "";
}

// O cabeçalho do arquivo (antes da primeira seção) é o resumo medido: força e fraqueza do modo.
// Vai em todo bloco porque é ele que diz ao agente o que a seção dele precisa compensar.
export function resumoDaSkill(skill: Skill): string {
  return (partes(skill)[0] ?? "").replace(/^# .*\n/, "").trim();
}

export function skillBlock(ctx: Pick<GenerationContext, "skill">, secao: SecaoSkill): string {
  if (!ctx.skill) return "";
  const s = secaoDaSkill(ctx.skill, secao);
  if (!s) return "";
  return `# SKILL DO ROTEIRO: ${NOME_SKILL[ctx.skill].toUpperCase()}\n${resumoDaSkill(ctx.skill)}\n\n## O que esta skill pede de você\n${s}`;
}

// As quatro definições juntas: é a régua do agente que sugere a skill (escolher-skill.ts).
export function quandoDasSkills(): string {
  return SKILLS.map((s) => `## ${NOME_SKILL[s]} (${s})\n${secaoDaSkill(s, "quando")}`).join("\n\n");
}
