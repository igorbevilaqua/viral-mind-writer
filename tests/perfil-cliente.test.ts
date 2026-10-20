// tests/perfil-cliente.test.ts
import { expect, test } from "vitest";
import { leituraDoModo, lerEstudoCortes, linhasDeHook, montarPerfil, slugCliente } from "@/lib/perfil-cliente";

test("slug igual ao nome dos arquivos do estudo de outubro", () => {
  expect(slugCliente("Thainá Iansen")).toBe("thaina-iansen");
  expect(slugCliente("Café com Ferri")).toBe("cafe-com-ferri");
});

test("leitura do lift dentro do cliente", () => {
  expect(leituraDoModo({ fatia: 0.036, videos: 15, lift: 2.04, lb: 1.15, ub: 2.88 })).toContain("vale escrever mais");
  expect(leituraDoModo({ fatia: 0.5, videos: 80, lift: 0.6, lb: 0.4, ub: 0.9 })).toContain("evite como padrão");
  expect(leituraDoModo({ fatia: 0.3, videos: 60, lift: 1.1, lb: 0.8, ub: 1.4 })).toContain("sem diferença clara");
  expect(leituraDoModo({ fatia: 0.02, videos: 4, lift: null, lb: null, ub: null })).toContain("poucos vídeos");
});

test("o perfil tem as partes e pula o que não existe", () => {
  const p = montarPerfil({
    nome: "Rodrigo Waughan",
    roteiros: 139,
    modos: { historia: { fatia: 0.6, videos: 242, lift: 0.95, lb: 0.76, ub: 1.17 }, demonstracao: { fatia: 0.036, videos: 15, lift: 2.04, lb: 1.15, ub: 2.88 } },
    hook: { roteiros: 137, linhas: ["- Funciona para ele: x"] },
    sintese: "- **Funciona para ele:** marca conhecida; contada inteira — sem pressa.",
    licoes: [{ titulo: "CTA para o empresário", descricao: "fala com quem decide" }],
  });
  expect(p).toContain("## Modos");
  expect(p).toContain("demonstração: 4% dos roteiros");
  expect(p).toContain("## Hook");
  expect(p).toContain("## O que funciona no canal");
  expect(p).toContain("## O que o time corrigiu");
  // perfil é prompt: sem ponto e vírgula nem travessão, nem os que vêm copiados do estudo
  expect(p).not.toMatch(/[;—–]/);
  expect(montarPerfil({ nome: "X", roteiros: 0, modos: {}, sintese: "", licoes: [] })).toBe("");
});

// Só roteiro da casa: o que o estudo com cortes dizia e o roteiro não repete vira sinal fraco.
test("hook do cliente: confirma, rebaixa a sinal fraco e lê o nicho", () => {
  const v = (cliente: string, h: string, acerto: boolean) => ({ cliente_nome: cliente, plataforma: "Instagram", h, classificacao: acerto ? "acerto" : "normal" });
  const videos = [
    // Ana: "acabou de" acerta 6 de 10, o resto 2 de 20; primeira pessoa só 3 vídeos
    ...Array.from({ length: 10 }, (_, i) => v("Ana", "A Apple acabou de lançar", i < 6)),
    ...Array.from({ length: 20 }, (_, i) => v("Ana", i < 3 ? "Eu vi isso hoje" : "Um fato estranho aconteceu", i < 2)),
    // Bia, mesmo nicho: "Você" falha
    ...Array.from({ length: 15 }, () => v("Bia", "Você sabia disso", false)),
    ...Array.from({ length: 15 }, (_, i) => v("Bia", "Um fato estranho", i < 8)),
  ];
  const linhas = linhasDeHook(videos, "Ana", { Ana: "N1", Bia: "N1" }, { melhor: "primeira_pessoa" });
  expect(linhas.join("\n")).toContain('Funciona no canal: abrir com notícia de agora ("acabou de"): acerta 60% contra 10%');
  // primeira pessoa era o melhor nos cortes, mas quase não aparece no roteiro: fica de fora
  expect(linhas.join("\n")).not.toContain("primeira pessoa");
  expect(linhas.join("\n")).toContain('No nicho N1, evite: abrir com "Você"');
  // Carla: "Esse/Essa" era o melhor nos cortes e no roteiro da casa empata
  const carla = [...Array.from({ length: 10 }, (_, i) => v("Carla", "Esse carro anda sozinho", i < 3)), ...Array.from({ length: 10 }, (_, i) => v("Carla", "Um fato", i < 3))];
  expect(linhasDeHook(carla, "Carla", {}, { melhor: "abre_esse" })).toEqual([
    '- Sinal fraco: abrir com "Esse/Essa + objeto" era o melhor tipo do canal no estudo que misturava cortes de podcast, e no roteiro da casa acerta 30% contra 30% no resto do canal (10 roteiros)',
  ]);
  expect(linhasDeHook(videos, "Zé", {}, undefined)).toEqual([]);
});

test("lê melhor e pior tipo por cliente da tabela do hooks_5 §2", () => {
  const md = `## 2. Tipo de hook × cliente
| cliente (taxa base) | melhor tipo (n, taxa, lift) | exemplo vencedor | pior tipo (n, taxa, lift) | exemplo perdedor |
|---|---|---|---|---|
| **Rodrigo Waughan** (6%) | primeira_pessoa (52, 10%, 1,97) | "eu" | jornada (13, 0%). abre_nome 0/34 | "A Havan" |
| **Café com Ferri** (25%) | pergunta (70, 24%, 0,95). Nenhum tipo passou de 1 | "a" | abre_nome (10, 10%, 0,39) | "O" |

### Assinaturas`;
  expect(lerEstudoCortes(md)).toEqual({
    "Rodrigo Waughan": { melhor: "primeira_pessoa", pior: "imperio" },
    "Café com Ferri": { pior: "abre_nome" },
  });
});
