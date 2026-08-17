import { afterEach, describe, expect, test, vi } from "vitest";

// Carrossel é a primeira fonte cujo conteúdo está NA IMAGEM: o que estes testes travam é o
// contrato dessa leitura — slides na ordem, rótulo de carrossel no texto (senão a modelagem lê
// "SLIDE 1" e supõe transcrição de vídeo malformatada), vídeo recusado com o motivo certo, e
// nenhuma chamada de visão quando não há imagem para ler.
const { chamadas } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.SCRAPECREATORS_API_KEY ??= "test";
  return { chamadas: { visao: 0 } };
});

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
vi.mock("@/lib/anthropic", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  trackedCreate: async () => {
    chamadas.visao++;
    return { content: [{ type: "text", text: "SLIDE 1: O ERRO DE 90% DOS CRIADORES\nSLIDE 2: e o que fazer" }] };
  },
}));

afterEach(() => {
  chamadas.visao = 0;
  vi.unstubAllGlobals();
});

import { lerCarrossel } from "@/lib/carrossel";

const POST = "https://www.instagram.com/p/DAbCdEfGhIj/";

const slide = (n: number) => ({ node: { display_url: `https://cdn.instagram.com/s${n}.jpg`, is_video: false } });

/** Primeiro fetch = ScrapeCreators (o post); os seguintes = imagens do CDN. */
const respondeCom = (post: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const u = String(input);
      if (u.includes("scrapecreators")) return Response.json(post);
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
    })
  );

const carrossel = (slides: number, extras: Record<string, unknown> = {}) => ({
  data: {
    xdt_shortcode_media: {
      owner: { username: "criador" },
      edge_media_to_caption: { edges: [{ node: { text: "legenda do post" } }] },
      edge_sidecar_to_children: { edges: Array.from({ length: slides }, (_, i) => slide(i + 1)) },
      ...extras,
    },
  },
});

describe("lerCarrossel", () => {
  test("slides viram texto em ordem, com rótulo de carrossel e legenda", async () => {
    respondeCom(carrossel(2));
    const { titulo, text } = await lerCarrossel(POST);

    expect(titulo).toBe("Carrossel de @criador");
    expect(text).toContain("[CARROSSEL DO INSTAGRAM: 2 slides lidos]");
    expect(text).toContain("SLIDE 1: O ERRO DE 90% DOS CRIADORES");
    expect(text).toContain("LEGENDA DO POST:\nlegenda do post");
    expect(chamadas.visao).toBe(1);
  });

  test("post de imagem única (sem sidecar) continua valendo como material", async () => {
    respondeCom({
      data: { xdt_shortcode_media: { display_url: "https://cdn.instagram.com/unica.jpg", is_video: false } },
    });
    expect((await lerCarrossel(POST)).text).toContain("1 slide lido]");
  });

  test("carrossel cheio do Instagram (20) entra inteiro: o teto é o da plataforma", async () => {
    respondeCom(carrossel(20));
    expect((await lerCarrossel(POST)).text).toContain("[CARROSSEL DO INSTAGRAM: 20 slides lidos]");
  });

  // O último slide é onde vive o comando, e o mapa da modelagem manda buscá-lo ali: corte que
  // levasse o fim entregaria um "último slide" que é o do meio, e o campo comando viraria chute.
  test("acima do teto, o corte é no meio e o último slide sobrevive, dito no texto", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const u = String(input);
      if (u.includes("scrapecreators")) return Response.json(carrossel(25));
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { text } = await lerCarrossel(POST);
    expect(text).toContain("20 slides lidos de 25, sem os slides do meio]");
    const pedidas = fetchMock.mock.calls.map(([u]) => String(u)).filter((u) => u.includes("cdn"));
    expect(pedidas).toHaveLength(20);
    expect(pedidas.at(-1)).toContain("s25.jpg"); // o fechamento entrou
    expect(pedidas).not.toContain("https://cdn.instagram.com/s20.jpg"); // o meio caiu
  });

  test("link de vídeo recusa apontando o anexo certo, sem pagar visão", async () => {
    respondeCom({ data: { xdt_shortcode_media: { is_video: true, display_url: "https://cdn/x.jpg" } } });
    await expect(lerCarrossel(POST)).rejects.toThrow(/use o anexo de vídeo/);
    expect(chamadas.visao).toBe(0);
  });

  test("post que não abre (privado/apagado) devolve o motivo do Instagram", async () => {
    respondeCom({ success: true, error: "not_found", message: "Post not found" });
    await expect(lerCarrossel(POST)).rejects.toThrow("Post not found");
  });

  test("link que não é post do Instagram nem chega a gastar crédito", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await expect(lerCarrossel("https://exemplo.com/algo")).rejects.toThrow(/link não reconhecido/);
    expect(f).not.toHaveBeenCalled();
  });
});
