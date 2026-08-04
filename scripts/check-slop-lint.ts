// Self-check do slop-lint. Rodar: npx tsx scripts/check-slop-lint.ts
import assert from "node:assert";
import { slopLint, blockCount, dedash } from "../lib/pipeline/slop-lint";

const phrases = [
  { pattern: "não é [^.,;!?]{1,50}, é ", label: "não é X, é Y", severity: "block" as const },
  { pattern: "é brutal", label: "isso é brutal", severity: "block" as const },
  { pattern: "simplesmente", label: "simplesmente", severity: "warn" as const },
  { pattern: "(regex[inválida", label: "quebrada", severity: "block" as const },
];

// detecta clichês. 3 blocks: a banlist pega "não é X, é Y" e "é brutal", e o detector de
// FIGURA pega a mesma antítese por forma — redundância proposital, a banlist é por string.
const bad = slopLint("Não é sobre dinheiro, é sobre liberdade. O resultado é brutal.", phrases);
assert.equal(blockCount(bad), 3, `esperava 3 blocks, veio ${blockCount(bad)}`);

// texto limpo passa
const clean = slopLint("O banco cobra 3% ao mês e ninguém percebe. Olha o extrato de março.", phrases);
assert.equal(blockCount(clean), 0);

// warn não bloqueia
const warned = slopLint("Isso é simplesmente comum.", phrases);
assert.equal(blockCount(warned), 0);
assert.equal(warned.length, 1);

// travessão é proibido — tolerância zero (requisito do humanizador)
const dashes = slopLint("A taxa — que ninguém viu — subiu de novo.", phrases);
assert.ok(blockCount(dashes) >= 1, "2 travessões deveriam bloquear");
const oneDash = slopLint("A taxa subiu — e ninguém percebeu.", phrases);
assert.ok(blockCount(oneDash) >= 1, "1 travessão deveria bloquear");
const enDash = slopLint("A taxa subiu – e ninguém percebeu.", phrases);
assert.ok(blockCount(enDash) >= 1, "en dash como travessão deveria bloquear");

// travessão de fala de personagem é permitido (início de linha ou após ':')
assert.equal(blockCount(slopLint("João disse: —Nunca mais volte aqui.", phrases)), 0, "fala após ':' deve passar");
assert.equal(blockCount(slopLint("—Nunca mais volte aqui.", phrases)), 0, "fala no início da linha deve passar");

// dedash: slop vira vírgula, fala preservada, e o resultado passa no lint
assert.equal(dedash("Dread — a antecipação — ansiosa."), "Dread, a antecipação, ansiosa.");
assert.equal(dedash("A taxa – que subiu – de novo."), "A taxa, que subiu, de novo.");
assert.equal(dedash("João disse: —Nunca mais volte."), "João disse: —Nunca mais volte.");
assert.equal(blockCount(slopLint(dedash("A taxa — que ninguém viu — subiu."), phrases)), 0, "pós-dedash sem travessão de slop");

// regex inválida cadastrada não derruba o lint
assert.ok(Array.isArray(slopLint("qualquer texto", phrases)));

// ── Eixo da elipse: as fugas que a banlist por string não pegava ──
// (texto real de vm_generated_scripts entregue com slop_lint_violations = 0)
const fugaPlural = "Os xingamentos não são um ataque de raiva. Aquilo é um plano.";
assert.equal(blockCount(slopLint(fugaPlural, phrases)), 1, "plural + ponto + pronome deve acusar");
const fugaPonto = "E quem paga essa conta não é presidente nenhum. É a gente.";
assert.equal(blockCount(slopLint(fugaPonto, phrases)), 1, "fuga pela pontuação deve acusar");
// negação sem assertiva pareada é legítima
assert.equal(blockCount(slopLint("Essa relação não é explicada na mídia.", phrases)), 0);

assert.equal(blockCount(slopLint("O desfecho disso?", phrases)), 1, "pivô nominal deve acusar");
assert.equal(blockCount(slopLint("Você consegue entender a revolta?", phrases)), 0, "pergunta real passa");

const parataxe = "Esse é o Rio de Janeiro, carros na rua, garotos jogando bola, bandidos circulando.";
assert.equal(blockCount(slopLint(parataxe, phrases)), 1, "parataxe deve acusar");
const subordinado =
  "Esse é o Rio de Janeiro, cidade em que de um lado você vê carros na rua, de outro garoto jogando bola, mas se der bobeira, bandidos estão circulando.";
assert.equal(blockCount(slopLint(subordinado, phrases)), 0, "conectivo salva a mesma ideia");
// lista de nomes próprios é enumeração legítima, não o defeito
assert.equal(blockCount(slopLint("Argentina, El Salvador, Equador, Peru, Chile.", phrases)), 0);

console.log("slop-lint ok");
