// Self-check do slop-lint. Rodar: npx tsx scripts/check-slop-lint.ts
import assert from "node:assert";
import { slopLint, blockCount } from "../lib/pipeline/slop-lint";

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

// travessões em excesso bloqueiam
const dashes = slopLint("A taxa — que ninguém viu — subiu de novo.", phrases);
assert.ok(blockCount(dashes) >= 1, "2 travessões deveriam bloquear");

// regex inválida cadastrada não derruba o lint
assert.ok(Array.isArray(slopLint("qualquer texto", phrases)));

console.log("slop-lint ok");
