// Gera o storytelling v3 a partir da v1 ativa: notas de dado por estrutura, fechos corrigidos,
// PARTE 3 (ranking por pico de views) trocada pelo ranking medido, PARTE 4 nova. Títulos "## X9." intactos.
import { readFileSync, writeFileSync } from "node:fs";
const SRC = "data/playbooks_ativos/storytelling_v1_ATIVO.md";
const OUT = "/Users/igorbevilaqua/Projetos/CODEX - Viral Mind/docs/estudo-2026-10/playbooks/storytelling.md";
let t = readFileSync(SRC, "utf8");
const trocar = (de, para) => { if (!t.includes(de)) throw new Error("não achei: " + de.slice(0, 60)); t = t.replace(de, para); };

// 0. cabeçalho
trocar("# Playbook Storytelling\n", "# Playbook Storytelling (v3, estudo 2026-10)\n\n> v3: o catálogo de estruturas da v1 segue igual. Mudou: uma nota de dado embaixo de cada estrutura medida nos 2.713 roteiros da casa publicados em 2026; os fechos em \"lição\" de A1, A2, B2, E2 e F1 foram trocados (a moral explícita derruba comentário e, com superação, é a combinação mais fraca da casa); a PARTE 3, que ordenava estruturas por pico de views, virou o ranking medido; e entrou a PARTE 4, com o que funciona no corpo do roteiro. Escolha de tema: playbook de pauta. Recompensa do vídeo: playbook de payoff. Fecho: playbook de conclusão.\n");
trocar("3. O que o espectador vai sentir ao final? (o mecanismo emocional que o fará\ncompartilhar)", "3. O que o espectador vai sentir ao final? (o payoff: escolha pela meta do vídeo,\nveja o playbook de payoff)");

// 1. notas de dado por estrutura (logo abaixo do título; vão junto quando o roteirista recebe só a seção)
const NOTAS = {
  "## A1. Jornada do Herói ✅ Validada": "> Dado 2026-10: atrapalha (18% no topo contra 26% de base, OR 0,61, replica). O culpado é a biografia contada em ordem (nasceu, trabalhava, percebeu que, foi aí que): com dois ou mais desses marcadores o roteiro cai (0,63). Abra pelo resultado ou pelo conflito, pule o passado com \"Anos depois,\" e marque a virada com \"Até que\". Se houver um gigante ou rival com nome, use B1.",
  "## A2. Herói Improvável ✅ Validada": "> Dado 2026-10: o payoff de superação pura atrapalha (OR 0,68); superação aberta por \"por quê\" e fechada em lição de moral é a combinação mais fraca da casa (0,57). Funciona quando a adversidade tem um antagonista com nome (\"podia ser destruída por causa da Nestlé\") ou quando a história fica aberta até o fim.",
  "## A3. Herói Esquecido ✅ Validada": "> Dado 2026-10: a revolta (alguém que merecia reconhecimento e não teve) gera comentário (OR 2,70), não compartilhamento nem alcance. Use quando a meta do vídeo for conversa.",
  "## B1. Davi e Golias ✅ Validada": "> Dado 2026-10: confirmada e uma das mais fortes (34% no topo, OR 1,69, replica). O Golias precisa ter nome: herói contra gigante nomeado rende OR 1,89; sem antagonista, empata com a média.",
  "## B2. Conflito Imprevisível ✅ Validada": "> Dado 2026-10: a disputa com lado é o payoff que mais viraliza na casa (OR 2,09, nas três redes e nos três nichos) e é só 3% da produção. Os dois lados entram com nome no hook; o texto toma partido ou pede que o espectador escolha.",
  "## B3. Queda do Gigante 🔶 Sugerida": "> Dado 2026-10: rende em Dinheiro, economia e geopolítica (OR 1,85) e no YouTube (1,50); em Tecnologia atrapalha (0,46). Não serve para engajamento: derruba compartilhamento (0,42) e salvamento (0,14). Feche com frase-síntese do tamanho da perda.",
  "## C1. O Iconoclasta ✅ Validada": "> Dado 2026-10: não confirmou o Tier S antigo. A virada contraintuitiva fica na média do alcance (1,09) e derruba comentário (0,68).",
  "## C2. Estratégia Oculta ✅ Validada": "> Dado 2026-10: o bastidor revelado é neutro no alcance (0,89) e o salvamento não se confirma; quem salva é a vantagem prática. No tributário, o bastidor rende quando o personagem é um famoso (\"o segredo da fortuna de Luciano Huck\"), não uma empresa.",
  "## D1. Urgência & Alerta ✅ Validada": "> Dado 2026-10: alerta como payoff é neutro no geral e rende em Dinheiro (OR 1,40) quando aberto pelo porquê e fechado na consequência para o espectador. Hook que abre como alarme atrapalha (0,74); \"acabou de\" é o que funciona (1,87).",
  "## E1. Paradoxo Contraintuitivo ✅ Validada": "> Dado 2026-10 (hipótese, sem replicação formal): rende em Dinheiro (1,85) e Negócios (1,39), atrapalha em Tecnologia (0,51).",
  "## E2. Inovação & Sacada Genial ✅ Validada": "> Dado 2026-10 (hipótese): rende em Tecnologia (1,14) e atrapalha em Negócios (0,63). A sacada é a lição: explique por que funcionou com o caso, sem moral genérica.",
  "## F1. Erro Fatal ✅ Validada": "> Dado 2026-10: o erro caro do poderoso rende em Dinheiro (OR 1,85), mas a promessa de \"salvamento e compartilhamento como proteção\" foi desmentida (salvamento 0,14, compartilhamento 0,42).",
};
for (const [h, nota] of Object.entries(NOTAS)) trocar(h + "\n", `${h}\n${nota}\n`);

// 2. fechos em "lição"
trocar("5. Lição replicável\n", "5. Fecho no caso: contraste \"Enquanto todo mundo [fazia o óbvio], [personagem] [fez o contrário]\", eco do hook ou o estado atual do personagem. Lição explícita só se for a própria decisão contraintuitiva, em uma frase\n");
trocar("5. Lição universal\n", "5. Fecho no desfecho, nunca na moral: o estado atual do personagem ou o que a vitória custou ao gigante\n");
trocar("5. Lição estratégica\n", "5. Quem está ganhando, numa frase-síntese, ou uma pergunta de lado ao espectador\n");
trocar("4. Lição de negócio replicável\n", "4. Por que funcionou, numa frase concreta sobre o próprio caso (a sacada é a lição)\n");
trocar("5. Lição prática imediata\n", "5. Frase-síntese do caso: o tamanho da perda e o erro que a causou\n");

// 3. PARTE 3 nova no lugar do ranking por pico de views (até "Padrão Transversal")
const ini = t.indexOf("PARTE 3  RANKING DE EFICIÊNCIA POR");
const fim = t.indexOf("Padrão Transversal: O que todas as estruturas");
if (ini < 0 || fim < 0 || fim < ini) throw new Error("PARTE 3 não encontrada");
const PARTE3 = `PARTE 3  O QUE O DADO DIZ DAS ESTRUTURAS (estudo 2026-10)
O ranking antigo ordenava estruturas pelo pico de views de 277 roteiros, o que mede o tamanho do canal e do tema, não a estrutura. Medido nos 2.713 roteiros da casa publicados em 2026, com cada vídeo comparado com os outros do mesmo cliente, na mesma rede e no mesmo trimestre:

- Ajuda, com replicação: B1 Davi e Golias (34% no topo contra 26% de base, OR 1,69). O payoff de disputa com lado, que é o coração de B2 Conflito Imprevisível, é o que mais viraliza na casa (OR 2,09).
- Atrapalha, com replicação: A1 Jornada do Herói (18% no topo, OR 0,61), pela biografia contada em ordem; e o payoff de superação (0,68), que é o de A2.
- O resto não separa sozinho. A estrutura pesa menos que o território do tema (que leva a chance de topo de 11% a 49% dentro do mesmo cliente) e que o payoff.
- Hipóteses por nicho, sem replicação: E1 Paradoxo rende em Dinheiro e Negócios e atrapalha em Tecnologia; E2 Sacada rende em Tecnologia e atrapalha em Negócios; A3 Herói Esquecido rende em Negócios.

Regra prática: escolha o território (playbook de pauta), depois o payoff (playbook de payoff), e só então a estrutura que melhor entrega aquele payoff. Quando houver dois lados com nome, prefira B1 ou B2. Quando a história for de ascensão, não use A1 em ordem cronológica: abra pelo conflito.

`;
t = t.slice(0, ini) + PARTE3 + t.slice(fim);
trocar("Vídeos que tocam os três atingem 10M+ de views.", "Vídeos que tocam os três atingem 10M+ de views.\n(Não testada no estudo 2026-10: quase todo roteiro toca um segundo eixo, então a regra não separa.)");

// 4. PARTE 4 nova: o corpo
t = t.trimEnd() + `

PARTE 4  O CORPO DO ROTEIRO (estudo 2026-10)
O que separa os roteiros que viralizam no desenvolvimento, medido nos 2.713 roteiros da casa. Vale para qualquer estrutura.

Tamanho
- 420 a 500 palavras faladas; alvo 450 a 490. Abaixo de 300 derruba (OR 0,70); acima de 500 o ganho some.
- Por rede: Instagram 450 a 500; YouTube 400 a 500; TikTok basta passar de 300. Por nicho: Tecnologia 420 a 500 (acima de 500 despenca); Dinheiro 450 a 500; Negócios rende igual de 350 a 500.
- Ritmo real de fala: 3 palavras por segundo (450 palavras dão cerca de 150 segundos).

O que funciona no corpo
- "Ou seja," abrindo a frase depois do fato mais forte, para dizer o que ele muda para o bolso, o país ou o mercado (OR 1,30, 17 de 20 clientes). Não use para explicar termo técnico.
- "Pra você ter ideia," + número + comparação que o brasileiro conhece (OR 1,25).
- Nomes próprios: 7 ou mais a cada 100 palavras (OR 1,20; em Negócios e Dinheiro). Troque "uma empresa chinesa" por Geely.
- Exatamente uma data, no ponto de virada (OR 1,18). As outras viram "anos depois", "meses depois".
- Uma pergunta completa, com verbo, que o espectador faria naquele ponto (OR 1,21; comentários sobem).
- Enumeração falada quando há várias causas: "Primeiro: ... Segundo: ... Terceiro: ..." (OR 1,58).
- Para segurar até o fim: "Anos depois," para pular tempo morto (retenção final OR 1,91), "Até que" para abrir a virada (1,76), um "mas" ou "só que" a cada dois parágrafos, parágrafos de até 35 palavras.

O que derruba no corpo
- A história de origem contada em ordem: "nasceu em", "trabalhava como", "no início", "percebeu que", "foi aí que", "foi quando", "tudo começou". Com um marcador, OR 0,80; com dois, 0,63; com três, 0,40.
- "Você" frequente no corpo: derruba a retenção final (0,55). Narre o corpo em terceira pessoa; o "você" entra na conclusão.
- Pergunta elíptica ("O resultado?"): derruba compartilhamento (0,60).

Neutros (não precisam de regra): "Olha isso", "Funciona assim", "Pensa comigo", "Imagina", "E o pior", "E tem mais", "O mais impressionante", densidade de números, aspas.

Exemplo de reescrita: "Tudo começou nos anos 50, quando a maioria das bonecas era bebê. Ruth percebeu que a filha Barbara brincava com bonecas de papel de mulheres adultas." vira "Nos anos 50, toda boneca de loja era bebê. Até que Ruth viu a filha Barbara brincando com bonecas de papel de mulheres adultas."
`;
if (/[—–]/.test(t.slice(0, 2000)) ) console.warn("aviso: travessão no cabeçalho");
writeFileSync(OUT, t);
console.log("storytelling v3:", t.length, "chars; travessões no arquivo:", (t.match(/[—–]/g) ?? []).length, "; seções ##:", (t.match(/^## /gm) ?? []).length);
