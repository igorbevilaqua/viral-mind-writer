import { beforeAll, describe, expect, test } from "vitest";

// platformVideoId vive em lib/etl.ts, que importa lib/db.ts. lib/db.ts chama
// createClient(url, key) do Supabase NO TOPO DO MÓDULO, e o construtor valida a
// URL de forma síncrona — sem as env vars, o import quebra ("supabaseUrl is
// required.") mesmo que este teste nunca toque o client. Como não é permitido
// mockar lib/db, stub-amos env vars com valores fictícios (nunca usados: a função
// testada é pura) e importamos dinamicamente para evitar quebrar no import estático
// no topo do arquivo, antes do stub existir.
let platformVideoId: (url: string) => string | null;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-key";
  process.env.VIRAL_DATA_URL ??= "http://localhost:54321";
  process.env.VIRAL_DATA_SERVICE_ROLE_KEY ??= "test-key";
  ({ platformVideoId } = await import("@/lib/etl"));
});

describe("platformVideoId", () => {
  test("youtube.com/watch?v=<11 chars>", () => {
    expect(platformVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  test("youtu.be/<11 chars>", () => {
    expect(platformVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  test("youtube.com/shorts/<11 chars>", () => {
    expect(platformVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  test("instagram.com/reel/<id>", () => {
    expect(platformVideoId("https://www.instagram.com/reel/CxAbCdEfGhI/")).toBe("CxAbCdEfGhI");
  });

  test("instagram.com/reels/<id>", () => {
    expect(platformVideoId("https://www.instagram.com/reels/CxAbCdEfGhI/")).toBe("CxAbCdEfGhI");
  });

  test("instagram.com/p/<id>", () => {
    expect(platformVideoId("https://www.instagram.com/p/CxAbCdEfGhI/")).toBe("CxAbCdEfGhI");
  });

  test("instagram.com/tv/<id>", () => {
    expect(platformVideoId("https://www.instagram.com/tv/CxAbCdEfGhI/")).toBe("CxAbCdEfGhI");
  });

  test("tiktok.com/@user/video/<digits>", () => {
    expect(platformVideoId("https://www.tiktok.com/@someuser/video/7123456789012345678")).toBe(
      "7123456789012345678"
    );
  });

  test("sem match retorna null", () => {
    expect(platformVideoId("https://example.com/no-match-here")).toBeNull();
  });

  // Comportamento atual documentado: o regex de YouTube só cobre v=/shorts//youtu.be/,
  // então /live/ e /embed/ NÃO casam — isso é o comportamento real, não um requisito.
  test("youtube.com/live/<id> não é reconhecido pelo padrão atual (null)", () => {
    expect(platformVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBeNull();
  });

  test("youtube.com/embed/<id> não é reconhecido pelo padrão atual (null)", () => {
    expect(platformVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBeNull();
  });
});
