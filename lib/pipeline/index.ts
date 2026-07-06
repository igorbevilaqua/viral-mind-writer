import { appDb } from "../db";
import { loadContext } from "./context";
import { analyzeModelagem } from "./modelagem";
import { generateDraft, parseSections } from "./draft";
import { critiqueAndRewrite } from "./critique";
import { humanize } from "./humanize";
import { blockCount } from "./slop-lint";
import type { PipelineEvent } from "./types";

export async function runPipeline(sessionId: string, emit: (e: PipelineEvent) => void): Promise<void> {
  try {
    await appDb.from("vm_sessions").update({ status: "generating" }).eq("id", sessionId);

    // FASE 1 — coleta
    emit({ type: "phase", phase: "coleta" });
    const ctx = await loadContext(sessionId);

    const modelagens = ctx.attachments.filter((a) => a.is_modelagem && a.raw_content);
    if (modelagens.length) {
      emit({ type: "phase", phase: "modelagem" });
      ctx.modelagemBriefs = (
        await Promise.all(modelagens.map((a) => analyzeModelagem(a, ctx.prompt)))
      ).filter(Boolean);
    }

    // FASE 2 — rascunho (streaming)
    emit({ type: "phase", phase: "rascunho" });
    const draft = await generateDraft(ctx, (t) => emit({ type: "token", text: t }));

    // FASE 3 — crítica + humanização
    emit({ type: "phase", phase: "critica" });
    const revised = await critiqueAndRewrite(ctx, draft);

    emit({ type: "phase", phase: "humanizacao" });
    const { text: final, violations } = await humanize(ctx, revised);

    emit({ type: "phase", phase: "salvando" });
    const sections = parseSections(final);

    const { count } = await appDb
      .from("vm_generated_scripts")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    const { data: saved, error } = await appDb
      .from("vm_generated_scripts")
      .insert({
        session_id: sessionId,
        client_id: ctx.clientId,
        version: (count ?? 0) + 1,
        headline: sections.headline,
        hook: sections.hook,
        hook_variants: sections.hookVariants,
        roteiro: sections.roteiro,
        comando: sections.comando,
        fontes: sections.fontes,
        slop_lint_violations: blockCount(violations),
        pipeline_trace: {
          draft,
          revised,
          final,
          violations,
          few_shot_origens: ctx.fewShot.map((f) => f.origem),
          modelagem_briefs: ctx.modelagemBriefs,
        },
      })
      .select("id")
      .single();
    if (error) throw new Error(`falha ao salvar roteiro: ${error.message}`);

    await appDb.from("vm_sessions").update({ status: "done" }).eq("id", sessionId);
    emit({ type: "done", scriptId: saved.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await appDb.from("vm_sessions").update({ status: "error", error_message: message }).eq("id", sessionId);
    emit({ type: "error", message });
  }
}
