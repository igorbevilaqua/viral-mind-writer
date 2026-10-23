import { DICA_SKILL, NOME_SKILL, SKILLS } from "@/lib/skills-catalogo";

// O "i" ao lado do seletor de skill: as quatro, quando usar e um exemplo. Abre no hover e no foco
// (tab ou toque), só com CSS.
export function SkillInfo() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="O que é cada skill"
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/20 text-[10.5px] font-semibold italic text-white/45 hover:text-white/80 hover:border-white/40 focus:text-white/80 outline-none transition-colors"
      >
        i
      </button>
      <span
        role="tooltip"
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute z-50 top-full left-0 mt-2 w-[min(340px,calc(100vw-32px))] rounded-[12px] border border-white/10 bg-neutral-900 p-3.5 text-left text-[12px] leading-snug text-white/60 shadow-xl"
      >
        <span className="block text-white/85 font-medium mb-1">Skill é o tipo de roteiro.</span>
        <span className="block mb-2.5">
          Cada uma tem a sua regra de hook, corpo e fechamento. Na dúvida, deixe na automática: o Codex lê a
          premissa e escolhe.
        </span>
        {SKILLS.map((s) => (
          <span key={s} className="block mb-2 last:mb-0">
            <b className="text-white/85">{NOME_SKILL[s]}:</b> {DICA_SKILL[s].quando}
            <span className="block text-white/35 italic">Ex.: {DICA_SKILL[s].exemplo}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
