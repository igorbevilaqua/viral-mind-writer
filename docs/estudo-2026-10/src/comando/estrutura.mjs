// Estrutura da promessa (declarativa x condicional), território x assunto, combinações candidatas a fórmula; YouTube só coef.
import { writeFileSync } from "node:fs";
import { OUT, norm, avaliar, tabela } from "../lib.mjs";
import { L } from "./feat.mjs";
import { RC } from "./conexao.mjs";
import { medir, linhaSeg, cabSeg, linhaOutros, cabOutros } from "./medir.mjs";
const t = (r) => norm(r.falado_tx);
const P1 = /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/;
const p1 = (r) => P1.test(t(r)), cond = (r) => r.ft.cond, freq = (r) => r.ft.freq;
const aqui = (r) => /\bsegue aqui\b/.test(t(r));
const tema2 = (r) => r._ovTemaFora >= 2 || r._ovHook >= 1;
const pede = (r) => r.ft.v_comenta || r.ft.v_compart || r.ft.v_salva || r.ft.v_curte;
const C = [
  ["declarativa: \"eu te mostro Y\" sem \"se você\"", (r) => p1(r) && !cond(r)],
  ["condicional: \"se você quer Y\" sem \"eu te mostro\"", (r) => cond(r) && !p1(r)],
  ["as duas (\"se você quer Y... eu te mostro\")", (r) => p1(r) && cond(r)],
  ["nenhuma das duas", (r) => !p1(r) && !cond(r)],
  ["F1: todo dia + eu te mostro, sem pedido extra", (r) => freq(r) && p1(r) && !pede(r)],
  ["F2: promessa do território (sem palavra do assunto do vídeo), sem pedido extra", (r) => !tema2(r) && r.ft.prom && !pede(r)],
  ["F2b: promessa amarrada ao assunto do vídeo", (r) => tema2(r) && r.ft.prom],
  ["F3: padrão da casa: nome + se você quer + segue o meu perfil (sem todo dia)", (r) => r.ft.apres && cond(r) && !freq(r) && /\bsegue (o )?meu perfil\b/.test(t(r))],
  ["F4: termina em \"me segue aqui\"", (r) => aqui(r)],
  ["F5: só nome/credencial + ação, sem promessa", (r) => !r.ft.prom && r.ft.v_segue],
  ["F6: pedido de comentário + seguir", (r) => r.ft.v_comenta && r.ft.v_segue],
];
const os = C.map(([n, p]) => medir(n, (r) => !!r.falado_tx && p(r), { linhas: RC }));
let md = `# Estrutura e fórmulas candidatas (transcrição)\n\n${cabSeg}\n${os.map(linhaSeg).join("\n")}\n\n${cabOutros}\n${os.map(linhaOutros).join("\n")}\n`;
// YouTube: só coef
const YT = [
  ["YT: pede para seguir (\"segue\")", (r) => r.ft.v_segue],
  ["YT: pede inscrição", (r) => r.ft.v_inscreve],
  ["YT: sem pedido de seguir/inscrever", (r) => !!r.falado_tx && !r.ft.v_segue && !r.ft.v_inscreve],
  ["YT: com apresentação", (r) => r.ft.apres],
  ["YT: todo dia", (r) => r.ft.freq],
  ["YT: pede comentário", (r) => r.ft.v_comenta],
  ["YT: bloco 41+ palavras", (r) => r.ft.palavras > 40],
];
md += "\n## YouTube (só coef e comentários)\n\n" + tabela(YT.map(([n, p]) => avaliar(n, p, { desfecho: "coef", plats: ["YouTube"] })), ["YouTube"]) + "\n\n" + tabela(YT.map(([n, p]) => avaliar(n + " -> comentários", p, { desfecho: "comentarios", plats: ["YouTube"] })), ["YouTube"]) + "\n";
md += `\nYouTube sem pedido de seguir/inscrever: ${L.filter((r) => r.plataforma === "YouTube" && r.falado_tx && !r.ft.v_segue && !r.ft.v_inscreve).length} de ${L.filter((r) => r.plataforma === "YouTube").length}; com "inscrev": ${L.filter((r) => r.plataforma === "YouTube" && r.ft.v_inscreve).length}\n`;
writeFileSync(OUT + "comando/estrutura.md", md);
console.log(md);
