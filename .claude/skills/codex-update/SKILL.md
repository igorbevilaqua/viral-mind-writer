---
name: codex-update
description: Compõe a mensagem de WhatsApp "update do Codex" para o usuário encaminhar aos sócios. Use SEMPRE que o usuário pedir a mensagem de update ("manda a mensagem de update", "mensagem pros sócios", "update para os sócios", "/codex-update") E ofereça proativamente após commits/deploys que mudem o produto (peça confirmação antes de gravar/enviar). Também: registre cada mudança de produto como entrada pendente via `cli.mjs add`.
---

# /codex-update — Mensagem de update do Codex para os sócios

O Codex é o produto (https://codex.viralmindlabs.com). Esta skill orquestra o CLI de fila (`codex-updates/cli.mjs`, mantido por outra pessoa — NÃO reimplemente a lógica de fila). Você só lê o estado, compõe a mensagem e, após confirmação do usuário, grava o release. O envio no WhatsApp é MANUAL — não existe integração; você entrega o texto pronto.

## Fluxo (executar na ordem)

1. Rode `node codex-updates/cli.mjs next` e parseie o JSON de saída.
2. Se `empty === true` → avise que ainda não há nada novo para anunciar e PARE.
3. Se `repeat === true` → apresente `message` VERBATIM (não recomponha, não reescreva). Explique que é idêntica à última porque nada novo entrou desde então. Ainda assim pergunte se quer enviar. NÃO chame `commit-release` neste caso.
4. Caso contrário (há mudanças pendentes, `repeat === false` e `empty === false`) → COMPONHA a mensagem a partir de `entries`, `version`, `git` e `codexUrl` usando o FORMATO + TOM abaixo. Apresente ao usuário e PEÇA confirmação.
5. Ao confirmar: escreva o texto EXATO da mensagem composta num arquivo temporário (use o scratchpad da sessão ou `/tmp`), e rode:
   `node codex-updates/cli.mjs commit-release --version <version> --git <git> --product-summary "<o resumo de produto que você escreveu>" --message-file <caminho do arquivo>`
   Depois confirme ao usuário que está gravado e pronto para encaminhar no WhatsApp. Só chame `commit-release` quando `repeat === false` e `empty === false`, e só APÓS o "ok" do usuário.

## Formato da mensagem (WhatsApp, texto puro — use *negrito* markdown do WhatsApp e emojis; conciso, é mensagem de celular)

Cabeçalho (formato exato, preencha version + git):
```
🪄 *Codex — Nova Versão Disponível (v<version>)*
🔖 Git: <git>
```
Linha em branco, depois um RESUMO de produto curto (2-3 linhas no máximo, linguagem simples que um sócio não-técnico entende de primeira — "o que há de novo no produto" numa frase). Registro do resumo (ilustrativo, NÃO copie): "Agora o Codex é capaz de produzir roteiros em lote, além de ter resolvido o problema dos travessões."

Depois a seção de tópicos:
```
📋 *O que mudou:*
```
Um bullet por entrada de `entries`, com emoji conforme `type`:
- `feature` → ✨ ou 🚀
- `fix` → 🐛 ou 🔧
- `improvement` → ⚡ ou 💅

Cada bullet: mais liberdade técnica (pode citar termos técnicos), MAS sempre contextualize o benefício para quem não é técnico; uma a duas linhas curtas. O tom deve AGREGAR VALOR — quase vendendo, sem perder o lado técnico: sinalize discretamente o esforço por trás, cite uma possibilidade concreta de uso e/ou contraste com a dor de NÃO ter aquilo. Sem verborragia; é WhatsApp.

Rodapé (SEMPRE termine exatamente assim, com o link em linha própria):
```
✨ Para abrir o mundo mágico do storytelling, acesse o CODEX:
👉 <codexUrl>
```

## Registrando mudanças

Quando forem feitos commits que mudam o produto, registre cada mudança relevante voltada ao usuário como entrada pendente, para o próximo update pegá-la automaticamente:
`node codex-updates/cli.mjs add --type <feature|fix|improvement> --summary "<s>" [--detail "<d>"]`
(o CLI captura o git short hash atual sozinho.) Um `add` por mudança significativa visível ao usuário; pule chores puros (refactor interno, bump de dependência, ajuste de CI).

## Gatilhos

- Após commits/deploys que mudem o produto: OFEREÇA proativamente gerar esta mensagem (nada é "enviado"/gravado sem o usuário confirmar).
- Quando o usuário pedir explicitamente: "manda a mensagem de update", "mensagem pros sócios", "update para os sócios", "/codex-update", etc.
