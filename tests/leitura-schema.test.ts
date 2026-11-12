import { expect, test } from "vitest";
import { oQueFaltouNaLeitura, type Leitura } from "@/lib/modelagem/leitura-schema";

const ORIGINAL = "um dois três quatro cinco seis sete oito nove dez";
const boa: Leitura = {
  premissa: "Quem tem dinheiro de verdade parou de usar logo.",
  emocao: { predominante: "inveja", motor: "o código que só os ricos leem" },
  hook: { texto: "um dois", promessa: "entender o código", mecanismo: "Desafio de Crença" },
  beats: [
    { ordem: 1, funcao: "hook", trecho: "um dois três" },
    { ordem: 2, funcao: "prova", trecho: "quatro cinco seis" },
    { ordem: 3, funcao: "fecho", trecho: "sete oito nove dez" },
  ],
  ativos: [],
  palavras_dificeis: [],
  nao_transferivel: [],
};

test("leitura completa: nada faltou", () => {
  expect(oQueFaltouNaLeitura(boa, ORIGINAL)).toBe("");
});

test("leitura vazia ou nula: diz o que faltou em vez de estourar", () => {
  expect(oQueFaltouNaLeitura(null, ORIGINAL)).toMatch(/premissa.*motor.*hook.*beats/);
  expect(oQueFaltouNaLeitura({}, ORIGINAL)).toMatch(/premissa/);
});

test("beats que resumem em vez de dividir: reprova pela cobertura", () => {
  const resumida = { ...boa, beats: boa.beats.map((b) => ({ ...b, trecho: "um" })) };
  expect(oQueFaltouNaLeitura(resumida, ORIGINAL)).toMatch(/menos de 70%/);
});
