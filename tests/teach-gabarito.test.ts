import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

// Plano 024, 3.1. Em 10/10 o destilador transformou em aprendizado "sinalize com 'essa foi a
// primeira peça'" e "nomeie as peças como uma rede": frases que estavam no texto da IA e que o
// humano cortou no mesmo dia. A versão regenerada nunca é gabarito.
describe("lição de correção aprende com o pedido, não com o texto da IA", () => {
  test("o prompt do destilador marca o DEPOIS como tentativa da IA", () => {
    const teach = readFileSync("lib/pipeline/teach.ts", "utf8");
    expect(teach).toMatch(/ROTEIRO DEPOIS \(tentativa da IA; não é gabarito\)/);
    expect(teach).toMatch(/NÃO é gabarito e NÃO é exemplo a seguir/);
  });
});
