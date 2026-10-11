// Troca seções inteiras de um .md de cliente pelas do patch (mesmo cabeçalho "## ..."). Uso: node aplica.mjs alvo.md patch.md
import { readFileSync, writeFileSync } from "node:fs";
const [alvo, patch] = process.argv.slice(2);
const secoes = (t) => t.split(/\n(?=## )/); // [preâmbulo, "## A\n...", "## B\n..."]
const doc = secoes(readFileSync(alvo, "utf8").trimEnd());
for (const s of secoes(readFileSync(patch, "utf8").trim())) {
  if (!s.startsWith("## ")) throw new Error("patch fora de seção: " + s.slice(0, 40));
  const cab = s.split("\n")[0], i = doc.findIndex((d) => d.split("\n")[0] === cab);
  if (i < 0) throw new Error("seção não existe no alvo: " + cab);
  doc[i] = s.trimEnd() + "\n";
}
const out = doc.join("\n").replace(/^(## .*)\n\n/gm, "$1\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
if (/[—–]/.test(out)) throw new Error("travessão no texto");
writeFileSync(alvo, out);
console.log("ok", alvo.split("/").pop(), out.split("\n").length, "linhas");
