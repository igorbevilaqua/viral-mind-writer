// Self-check do slop-lint. Rodar: npx tsx scripts/check-slop-lint.ts
import assert from "node:assert";
import { slopLint, blockCount, dedash } from "../lib/pipeline/slop-lint";

const phrases = [
  { pattern: "não é [^.,;!?]{1,50}, é ", label: "não é X, é Y", severity: "block" as const },
  { pattern: "é brutal", label: "isso é brutal", severity: "block" as const },
  { pattern: "simplesmente", label: "simplesmente", severity: "warn" as const },
  { pattern: "(regex[inválida", label: "quebrada", severity: "block" as const },
];

// detecta clichês
const bad = slopLint("Não é sobre dinheiro, é sobre liberdade. O resultado é brutal.", phrases);
assert.equal(blockCount(bad), 2, `esperava 2 blocks, veio ${blockCount(bad)}`);

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

console.log("slop-lint ok");
