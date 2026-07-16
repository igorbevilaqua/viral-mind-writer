import { fetchTranscript } from "@/lib/transcribe";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Transcrição automática de links de vídeo (usada pelo fluxo Ensinar).
// A lógica vive em lib/transcribe.ts — compartilhada com a modelagem do pipeline.
export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim())
    return Response.json({ error: "url obrigatória" }, { status: 400 });

  try {
    const { title, text } = await fetchTranscript(url);
    return Response.json({ title, text });
  } catch (e) {
    console.error("transcrição falhou", url, e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }
}
