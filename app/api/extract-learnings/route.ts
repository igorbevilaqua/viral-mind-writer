import { NextResponse } from "next/server";
import { extractLearnings } from "@/lib/pipeline/teach";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { transcript, sourceUrl, contextNote, clientNome } = await req.json();
    if (!transcript?.trim()) {
      return NextResponse.json({ error: "transcrição vazia" }, { status: 422 });
    }
    const learnings = await extractLearnings({ transcript, sourceUrl, contextNote, clientNome });
    return NextResponse.json({ learnings });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }
}
