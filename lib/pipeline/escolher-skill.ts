import { trackedCreate } from "../anthropic";
import { modeloDe } from "../llm-config";
import { ehSkill, SKILLS, type Skill } from "../skills-catalogo";
import { agentPrompt, premissaBlock, toolInput } from "./agents";
import { formatarMix, mixDoCliente } from "./modo-roteiro";
import { quandoDasSkills } from "./skills";
import type { GenerationContext } from "./types";

const SKILL_TOOL = {
  name: "registrar_skill",
  description: "Registra a skill de modo em que o roteiro vai ser escrito.",
  input_schema: {
    type: "object" as const,
    properties: {
      skill: { type: "string", enum: [...SKILLS], description: "o modo que prova a premissa" },
      motivo: { type: "string", description: "1 frase para a tela: o que vai provar a premissa" },
      alternativa: { type: ["string", "null"], enum: [...SKILLS, null], description: "o segundo modo que também serviria, ou null" },
    },
    required: ["skill", "motivo", "alternativa"],
  },
};

export interface EscolhaSkill {
  skill: Skill;
  motivo: string;
  alternativa: Skill | null;
}

export function lerEscolha(input: Record<string, unknown>): EscolhaSkill | null {
  if (!ehSkill(input.skill)) return null;
  return {
    skill: input.skill,
    motivo: String(input.motivo ?? "").trim(),
    alternativa: ehSkill(input.alternativa) ? input.alternativa : null,
  };
}

// Roda depois da premissa e antes da pesquisa: é a skill que diz ao pesquisador o que buscar.
// null = caminho único (o pipeline segue como antes do 025), nunca um palpite.
export async function escolherSkill(ctx: GenerationContext, compreensao?: string): Promise<EscolhaSkill | null> {
  const mix = ctx.clientId ? formatarMix(await mixDoCliente(ctx.clientId)) : "";
  const res = await trackedCreate(ctx.usageLog, "skill", {
    model: await modeloDe("premissa"),
    max_tokens: 4000,
    tools: [SKILL_TOOL],
    tool_choice: { type: "tool", name: "registrar_skill" },
    system: `${agentPrompt("escolha-skill")}\n\n# QUANDO USAR CADA SKILL\n${quandoDasSkills()}`,
    messages: [
      {
        role: "user",
        content: `${premissaBlock(ctx)}\n\nTEMA: ${ctx.prompt.trim() || "(sem tema digitado)"}${
          compreensao ? `\n\nMATERIAL MODELADO (autópsia do original):\n${compreensao}` : ""
        }${mix ? `\n\nMIX DO CLIENTE (só desempata): a casa escreve para ${ctx.clientPrefs?.nome ?? "este cliente"} ${mix}.` : ""}\n\nEscolha a skill.`,
      },
    ],
  });
  const tool = res.content.find((b) => b.type === "tool_use");
  return tool?.type === "tool_use" ? lerEscolha(toolInput(tool)) : null;
}
