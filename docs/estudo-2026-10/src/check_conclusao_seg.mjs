import { carregar, avaliar, tabela, norm } from "./lib.mjs";
const L = carregar();
const conc = (r) => r.g?.conclusao ?? "";
const fim = (r) => (r.g?.bloco_final ?? "");
const temPerguntaConc = (r) => /\?/.test(conc(r));
const pedeComentFim = (r) => /\b(comenta|comente|me conta|me diz|deixa (aqui )?nos coment)/i.test(norm(fim(r)));
const A = [];
for (const d of ["seguidores", "comentarios", "coef"]) {
  A.push(avaliar(`[${d}] pergunta na conclusão, sem pedir comentário no bloco final`, (r) => temPerguntaConc(r) && !pedeComentFim(r), { desfecho: d, plats: d === "seguidores" ? ["Instagram", "TikTok"] : ["Instagram", "TikTok", "YouTube"] }));
  A.push(avaliar(`[${d}] pedido de comentário no bloco final escrito`, pedeComentFim, { desfecho: d, plats: d === "seguidores" ? ["Instagram", "TikTok"] : ["Instagram", "TikTok", "YouTube"] }));
}
console.log(tabela(A, ["Instagram", "TikTok", "YouTube"]));
