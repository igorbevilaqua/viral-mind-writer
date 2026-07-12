import { describe, expect, test } from "vitest";
import { platformVideoId } from "@/lib/video-url";

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

  // markPublished valida com platformVideoId: link de perfil (sem id de vídeo) deve falhar.
  test("perfil do Instagram retorna null", () => {
    expect(platformVideoId("https://www.instagram.com/algumperfil/")).toBeNull();
  });

  test("canal do YouTube retorna null", () => {
    expect(platformVideoId("https://www.youtube.com/@algumcanal")).toBeNull();
  });

  test("perfil do TikTok retorna null", () => {
    expect(platformVideoId("https://www.tiktok.com/@algumperfil")).toBeNull();
  });

  test("youtube.com/live/<id> agora é reconhecido (superset do YT_ID do transcribe)", () => {
    expect(platformVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  test("youtube.com/embed/<id> agora é reconhecido (superset do YT_ID do transcribe)", () => {
    expect(platformVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
});
