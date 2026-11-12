import { expect, test } from "vitest";
import { contarNumeros, copiasLiterais, portoes } from "@/lib/modelagem/portoes";

const ORIGINAL =
  "Por que as famílias ricas estão parando de usar Louis Vuitton? Buscas por quiet luxury subiram 300% desde 2022. O luxo gritou por décadas.";

test("conta dígitos e grandezas por extenso, não numerais pequenos", () => {
  expect(contarNumeros("subiu 300% desde 2022, 37 milhões de dólares, em dois anos")).toBe(4);
});

test("cópia literal: acha o trecho inteiro uma vez, ignorando acento e pontuação", () => {
  const novo = "Olha só: as familias ricas estão parando de usar Louis Vuitton, e tem motivo.";
  expect(copiasLiterais(ORIGINAL, novo)).toEqual(["as familias ricas estao parando de usar louis vuitton"]);
  expect(copiasLiterais(ORIGINAL, "Gente rica largou a Louis Vuitton faz tempo.")).toEqual([]);
});

test("portões: versão do mesmo tamanho, sem número novo e sem cópia passa limpa", () => {
  const novo =
    "Gente rica de verdade largou a Louis Vuitton, e tem motivo. A procura por luxo discreto triplicou depois de 2022. Antes disso, logo grande era regra.";
  expect(portoes(ORIGINAL, novo)).toEqual([]);
});

test("portões: versão inchada de dado é barrada por tamanho e por número", () => {
  const novo = `${ORIGINAL.replace(/ricas estão parando/, "com dinheiro largaram")} A Gucci caiu 21% em 2024, a Cucinelli subiu 12%, a Loro Piana foi de 700 milhões para 1,6 bilhão, e a Entrupy achou 37 milhões em bolsa falsa.`;
  const v = portoes(ORIGINAL, novo).join(" | ");
  expect(v).toMatch(/tamanho/);
  expect(v).toMatch(/números demais/);
});
