---
name: release
description: Faz o release completo do Codex — gate de verificação, commit de tudo, push na main (deploy automático Hostinger) e, com 2+ mudanças de produto, a mensagem de update pros sócios. Use quando o usuário disser "release", "/release", "sobe", "faz o release".
---

# /release

`/release` É a instrução explícita de push exigida pelo AGENTS.md. Sem ela, nunca faça push.

## Fluxo (na ordem, pare no primeiro que falhar)

1. `git status --short`. Nada pra commitar e nada pra pushar → avise e PARE.
2. Gate: `npx tsc --noEmit && npx eslint . && npm run check && npm test`. Falhou → mostre o erro e PARE. Não pule nem force.
3. Liste as mudanças pro usuário em uma linha cada (o que muda pro usuário do produto, não o arquivo).
4. Commit: escreva a mensagem num arquivo do scratchpad e use `git add -A && git commit -F <arquivo>`. NUNCA `-m` (crase em `-m` vira comando no zsh e apaga trecho em silêncio). Sem travessão. Formato: `tipo(escopo): resumo` + corpo curto em PT-BR.
5. `git push origin main`. Deploy dispara sozinho (~5s). Confirme com `git log origin/main -1 --oneline`.
6. Registre cada mudança visível ao usuário: `node codex-updates/cli.mjs add --type <feature|fix|improvement> --summary "<s>" --detail "<d>"`. Pule chores.
7. Se registrou 2 ou mais → invoque a skill `codex-update` para compor a mensagem do WhatsApp. Com 1, só avise que ficou na fila.

## Saída

Três linhas: hash pushado, o que foi, e se a mensagem de update foi gerada ou ficou na fila.
