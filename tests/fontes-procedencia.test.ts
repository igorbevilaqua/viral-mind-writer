import { describe, expect, test, vi } from "vitest";

// A tela pública de compartilhamento só recebe o roteiro salvo, sem os anexos da sessão: se o
// link do vídeo modelado não estiver no campo FONTES, ele não existe para quem abre o link.
vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

import { fontesComProcedencia } from "@/lib/pipeline/modelagem";
import type { Attachment } from "@/lib/pipeline/types";

const anexo = (over: Partial<Attachment>) =>
  ({ id: "a1", kind: "video_link", url: null, raw_content: null, is_modelagem: true, ...over }) as Attachment;

const REEL = "https://www.instagram.com/reels/Db3w0wNhjab/";

describe("fontesComProcedencia", () => {
  test("link do vídeo modelado entra antes das fontes da pesquisa", () => {
    expect(fontesComProcedencia("https://exemplo.com/estudo", [anexo({ url: REEL })])).toBe(
      `Modelado de: ${REEL}\n\nhttps://exemplo.com/estudo`
    );
  });

  test("roteiro sem pesquisa fica só com a procedência (em vez de FONTES vazio)", () => {
    expect(fontesComProcedencia(null, [anexo({ url: REEL })])).toBe(`Modelado de: ${REEL}`);
  });

  test("URL que a pesquisa já citou não é repetida", () => {
    expect(fontesComProcedencia(`fonte: ${REEL}`, [anexo({ url: REEL })])).toBe(`fonte: ${REEL}`);
  });

  test("modelagem de texto colado não tem link para citar", () => {
    expect(fontesComProcedencia(null, [anexo({ kind: "reference_script", raw_content: "colado" })])).toBeNull();
  });

  // 0034: a procedência diz qual foi o USO do material — replicar não é modelar.
  test("modo replicar assina a procedência com o verbo certo", () => {
    expect(fontesComProcedencia(null, [anexo({ url: REEL, modo: "replicar" })])).toBe(`Replicado de: ${REEL}`);
    expect(fontesComProcedencia(null, [anexo({ url: REEL, modo: null })])).toBe(`Modelado de: ${REEL}`);
  });

  test("sem modelagem, as fontes passam intactas", () => {
    expect(fontesComProcedencia("https://exemplo.com/a", [])).toBe("https://exemplo.com/a");
  });
});
