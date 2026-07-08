import { parseOffice } from "officeparser";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Extrai texto de arquivos anexados como Documento (.pdf, .docx, .txt, .html, .xlsx, .pptx...).
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "arquivo obrigatório" }, { status: 400 });

  const name = file.name;
  const lower = name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    if (/\.(txt|md|csv)$/.test(lower)) {
      text = buf.toString("utf8");
    } else if (/\.(html?|xhtml)$/.test(lower)) {
      // formatos textuais não têm magic bytes — extração manual
      text = buf
        .toString("utf8")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/[ \t]+/g, " ");
    } else {
      // binários (pdf, docx, xlsx, pptx, rtf, odt...) — officeparser detecta pelos magic bytes
      const ast = await parseOffice(buf);
      text = (await ast.to("text")).value;
    }
  } catch (e) {
    console.error("extração falhou", name, e);
    const legacy = /\.(doc|ppt|xls)$/.test(lower);
    return Response.json(
      {
        error: legacy
          ? `Formato antigo ${lower.slice(lower.lastIndexOf("."))} não suportado — salve como ${lower.endsWith(".doc") ? ".docx" : lower.endsWith(".ppt") ? ".pptx" : ".xlsx"} e envie de novo.`
          : "Não consegui extrair texto deste arquivo. Cole o conteúdo manualmente.",
      },
      { status: 422 }
    );
  }

  text = text.replace(/\s+\n/g, "\n").trim();
  if (!text) return Response.json({ error: "arquivo sem texto extraível" }, { status: 422 });

  return Response.json({ text: text.slice(0, 100_000), filename: name });
}
