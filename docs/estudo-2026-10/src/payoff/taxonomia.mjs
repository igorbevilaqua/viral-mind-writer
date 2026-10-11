// Taxonomia de payoff e listas fechadas de estrutura. Fonte única: gera o system prompt do classificador
// e as definições que vão para o relatório/playbook. Mudou aqui, muda nos dois.

export const PAYOFF = {
  revolta: { nome: "Revolta com injustiça", def: "Alguém com poder (governo, grande empresa, rico, instituição) prejudica gente comum, o espectador ou quem merecia reconhecimento, e o texto termina sem reparação: a injustiça continua.", sinais: '"e quem paga é você", "ninguém foi punido", "o Brasil nem percebeu"', ex: '"Os Correios quebraram com um rombo de 8,5 bilhões e agora é você quem paga a conta."' },
  orgulho: { nome: "Orgulho nacional ou de grupo", def: "O Brasil ou um grupo com que o público se identifica (estado, região, torcida, profissão, mulheres empresárias) aparece vencendo, sendo o maior ou sendo reconhecido lá fora, e o fechamento celebra essa identidade.", sinais: '"o mundo está de olho no Brasil", "a engenharia brasileira", "o Nordeste deu ao mundo"', ex: '"Dubai, Estados Unidos e o resto do mundo estão de olho no Brasil. E o motivo é a nossa engenharia."' },
  bastidor: { nome: "Bastidor revelado", def: "O texto expõe o mecanismo escondido por trás de algo que o espectador vê ou usa (um preço, um produto que sumiu, uma brecha na lei, como uma empresa ganha dinheiro, um plano geopolítico), e o clímax é: é assim que funciona por dentro.", sinais: '"o motivo que quase ninguém conhece", "por trás de", "o que ninguém te contou"', ex: "lojas que fecham a venda no tablet para faturar em outro estado e pagar menos ICMS, dentro da lei." },
  virada: { nome: "Virada contraintuitiva", def: "O texto defende uma tese que contradiz o óbvio (o que parecia derrota virou vitória, o castigo enriqueceu, o consenso estava errado) e prova com fatos; a surpresa é a inversão.", sinais: '"mas foi justamente isso que", "ao contrário do que parece", um paradoxo dito com todas as letras', ex: "o governo dividiu a Standard Oil em 34 pedaços e Rockefeller saiu quase três vezes mais rico." },
  vantagem: { nome: "Vantagem para o espectador", def: "O espectador sai com algo que pode usar na própria vida: um direito, um jeito de economizar ou ganhar dinheiro, uma ferramenta, uma técnica, um passo a passo.", sinais: '"você pode", "seu direito", "faça isso antes de"', ex: '"Se você morrer hoje, quem paga suas dívidas?", e o texto explica que herdeiro não herda dívida.' },
  alerta: { nome: "Alerta ou ameaça pessoal", def: "O texto aponta um risco concreto que pode atingir o espectador (bolso, emprego, saúde, segurança, dados, o país dele) e o tom é de ameaça ou urgência.", sinais: '"é urgente", "isso vai afetar você", "cuidado"', ex: '"Um dos maiores investidores do mundo acabou de anunciar uma venda que está deixando o mercado em pânico."' },
  superacao: { nome: "Superação ou volta por cima", def: "O protagonista parte de uma desvantagem concreta (pobreza, falência, rejeição, tragédia, crise) e chega a um resultado grande; o texto marca o ponto de partida e o de chegada.", sinais: '"cresceu sem luz elétrica... hoje fatura", "quase faliu e voltou mais forte"', ex: '"Essa mulher cresceu sem luz elétrica em casa, mas construiu um império que fatura mais de dois bilhões."' },
  inspiracao: { nome: "Exemplo inspirador", def: "Gente comum (estudante, comunidade, pequeno empreendedor, profissional) resolve um problema real com poucos recursos ou faz o bem aos outros; o fechamento celebra a atitude, sem arco de enriquecimento.", sinais: '"ele decidiu não aceitar", "com o que tinha em mãos", "para quem mais precisa"', ex: "estudante gaúcho cria uma IA para ajudar colegas com dificuldade de aprendizagem." },
  queda: { nome: "Queda do gigante ou erro caro", def: "Uma empresa, marca, clube ou pessoa poderosa erra, perde muito dinheiro, decai ou some; o clímax é o tamanho da perda e o erro que a causou.", sinais: '"o erro que custou", "perdeu bilhões", "quebrou"', ex: "a Oxxo abriu uma loja a cada 42 horas no Brasil e perdeu 165 milhões de reais num ano." },
  futuro: { nome: "O futuro chegou", def: "Uma tecnologia, produto ou mudança nova, que acabou de surgir ou está chegando, parece ficção, e o texto mostra como ela vai mudar a vida (para o bem ou para o mal).", sinais: '"acabou de criar", "chegou ao Brasil", "parece Black Mirror"', ex: "colar com IA que traduz para o português o que o seu pet está dizendo." },
  sacada: { nome: "Sacada genial", def: "Uma ideia, decisão ou estratégia específica e engenhosa de alguém (muitas vezes simples) e o clímax é por que ela funcionou.", sinais: '"a jogada", "genial", "ninguém pensou nisso antes"', ex: "a marca de carvão cuja embalagem vai direto para a churrasqueira e viralizou lá fora." },
  disputa: { nome: "Disputa com lado", def: "Dois lados nomeados em confronto (países, empresas, clubes, gerações, posições políticas) e o texto toma partido ou pede que o espectador tome.", sinais: '"guerra", "contra", "e você, de que lado está?"', ex: '"A indústria brasileira declarou guerra à China. E o motivo? O botijão de gás da sua cozinha."' },
  nostalgia: { nome: "Nostalgia", def: "O texto evoca algo do passado do espectador (marca, produto, programa, lugar da infância ou da avó) e o valor está na memória e no que aconteceu com aquilo.", sinais: '"da sua infância", "que a sua avó guardava", "o que aconteceu com"', ex: '"O que aconteceu com a Yopa? O sorvete que fazia parte do verão da sua infância simplesmente sumiu."' },
  curiosidade: { nome: "Curiosidade pura", def: "Um fato, recorde, objeto ou história surpreendente que vale por si, sem ameaça, sem injustiça, sem lado e sem lição forte.", sinais: '"isso aconteceu de verdade", um recorde, um objeto ou evento improvável', ex: "a mosca que pousou na bola e pôs 2,9 milhões de dólares no bolso de um golfista." },
};

export const DESEMPATE = [
  "bastidor x sacada: se o clímax elogia a inteligência de alguém, sacada; se explica como um sistema funciona, bastidor.",
  "revolta x queda: se há vítima comum sem reparação, revolta; se o foco é o erro do poderoso, queda.",
  "superacao x inspiracao: se há antes e depois de dinheiro ou status, superacao.",
  "orgulho x inspiracao/superacao: se o texto destaca a identidade (brasileiro, nordestino, o Brasil contra o mundo), orgulho.",
  "futuro x curiosidade: se é tecnologia nova que muda a vida, futuro.",
  "virada x sacada: se a inversão é sobre como o mundo funciona, virada; se é a decisão esperta de alguém, sacada.",
];

export const LISTAS = {
  promessa_hook: {
    porque_como: 'o hook já entrega o fato ou o resultado e a pergunta que fica é como ou por quê (inclui "o segredo", "o motivo", "o truque" de alguém)',
    quem_qual: 'a pergunta que o hook deixa é "quem é?" ou "qual é?" ("tem um país faturando em silêncio"); "esse cara fez X" não conta, porque ali a pergunta é como ele fez',
    desfecho: 'o hook conta o começo de uma história e para antes do final ("até que", "o que aconteceu depois"); se o hook já conta o resultado, não é desfecho',
    alerta: "anuncia ameaça ou consequência para o espectador",
    numero: 'um número ou recorde é o centro do hook e a pergunta é "como isso é possível?"',
    comparacao: 'confronta dois lados ("a NASA gasta milhões, mas esse estudante...")',
    ensinar: 'promete algo que o próprio espectador vai poder fazer ou usar ("como você pode", "seu direito", "o método")',
    novidade: "anuncia algo novo que acabou de acontecer ou de chegar",
    tese: "afirma uma opinião forte ou polêmica que o vídeo vai sustentar",
  },
  funcao_subhook: {
    eleva_aposta: "soma um dado que aumenta a escala ou a gravidade",
    contradiz: 'vira ou contradiz o hook ou o senso comum ("só que", "mas não é qualquer", "parece loucura, mas")',
    contexto_personagem: "apresenta quem é o protagonista (nome, origem, cargo, empresa)",
    volta_tempo: 'volta no tempo para começar a história ("em 1927", "Alemanha, 1929")',
    explica: "começa a explicar o que é a coisa ou como funciona",
    puxa_espectador: 'liga o assunto à vida do espectador ("aquela loja que você...", "imagina")',
    promete: 'anuncia o que vem sem entregar ("e o motivo vai te surpreender")',
    pergunta: "lança a pergunta que o vídeo vai responder",
    nenhum: "S vazio ou só repete o hook",
  },
  tipo_conclusao: {
    licao: 'princípio geral que vale para outros casos ("nicho não é limitação, é valor")',
    virada_final: 'reenquadramento no formato "não era X, era Y"',
    futuro: "projeta o que vai acontecer",
    pergunta: "termina com pergunta ao espectador",
    sintese: "resume o caso ou celebra o protagonista, sem princípio geral",
    consequencia: "diz o que aquilo significa para o espectador ou para o país dele",
    retomada: "volta de forma explícita à imagem ou à frase do hook",
    instrucao: "manda o espectador fazer algo prático",
    sem_fechamento: "acaba no fato solto ou vai direto para propaganda/CTA",
  },
  protagonista: {
    famoso: "pessoa famosa", anonimo: "pessoa anônima ou comum", empresa: "empresa, marca ou clube", pais: "país, governo ou cidade",
    tecnologia: "produto, invenção ou tecnologia", espectador: 'o próprio espectador ("você")', grupo: "um grupo social (geração, classe, profissão)",
  },
  antagonista: {
    nenhum: "não há oponente", governo: "governo ou Estado", gigante: "empresa grande, bilionário ou instituição poderosa",
    sistema: "mercado, burocracia, consenso, o sistema", rival: "concorrente direto (empresa, país, clube ou pessoa do mesmo porte)", problema: "doença, natureza, crise, limite técnico",
  },
  recorte: { brasil: "só Brasil", estrangeiro: "só fora do Brasil", brasil_x_estrangeiro: "compara ou conecta o Brasil a outro país, inclusive algo estrangeiro chegando ao Brasil" },
};

export const ENUMS = { payoff: Object.keys(PAYOFF), ...Object.fromEntries(Object.entries(LISTAS).map(([k, v]) => [k, Object.keys(v)])) };

const lista = (o) => Object.entries(o).map(([k, v]) => `- ${k}: ${v}`).join("\n");
export const SYSTEM = `Você classifica roteiros de vídeos curtos (Reels, TikTok, Shorts) escritos por uma agência brasileira de conteúdo. Cada roteiro vem resumido em: T (título interno), H (hook, a primeira fala), S (subhook, a segunda fala), C2 e C (os dois parágrafos finais antes da assinatura) e A (resumo do vídeo feito por outro modelo, pode estar ausente).

Regra de ouro: classifique pelo que está escrito, não pelo tema. Cada rótulo precisa de um sinal observável no texto. O payoff é o que o espectador leva quando o vídeo termina, por isso pese mais o fechamento (C2 e C) e a promessa do hook do que o assunto. Se C2 ou C forem notas de gravação ou edição (take, cena, B-roll, plano, legenda) ou propaganda de curso/serviço, ignore essa parte e use o resto do texto; se não sobrar fechamento, tipo_conclusao = sem_fechamento.

## 1. payoff (recompensa principal) e payoff2 (a segunda mais forte, ou null)
${Object.entries(PAYOFF).map(([k, p]) => `- ${k}: ${p.def} Sinais: ${p.sinais}. Ex.: ${p.ex}`).join("\n")}

Desempates:
${DESEMPATE.map((d) => `- ${d}`).join("\n")}
Use payoff2 só quando um segundo payoff também está claramente presente; senão null. payoff2 nunca repete payoff.

## 2. promessa_hook: o que H promete entregar
${lista(LISTAS.promessa_hook)}

## 3. funcao_subhook: o que S faz
${lista(LISTAS.funcao_subhook)}

## 4. tipo_conclusao: o que o fechamento faz (olhe sobretudo C; C2 ajuda a entender)
${lista(LISTAS.tipo_conclusao)}

## 5. protagonista
${lista(LISTAS.protagonista)}

## 6. antagonista (quem ou o que se opõe ao protagonista no texto)
${lista(LISTAS.antagonista)}

## 7. recorte
${lista(LISTAS.recorte)}

## 8. utilidade_pratica
true só se o espectador sai com algo concreto que pode aplicar na vida dele (um direito, uma economia, uma ferramenta, uma técnica, uma decisão de compra ou de investimento). Lição genérica de negócios ou de vida não conta.

## 9. sinal
Até 12 palavras copiadas do texto (H, S, C2 ou C) que mais mostram o payoff escolhido.

Responda só com o JSON pedido: um item por roteiro, na mesma ordem, com o mesmo número i.`;

const enumStr = (vals) => ({ type: "string", enum: vals });
export const SCHEMA = {
  type: "object",
  properties: {
    itens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          i: { type: "integer" },
          payoff: enumStr(ENUMS.payoff),
          payoff2: { anyOf: [enumStr(ENUMS.payoff), { type: "null" }] },
          promessa_hook: enumStr(ENUMS.promessa_hook),
          funcao_subhook: enumStr(ENUMS.funcao_subhook),
          tipo_conclusao: enumStr(ENUMS.tipo_conclusao),
          protagonista: enumStr(ENUMS.protagonista),
          antagonista: enumStr(ENUMS.antagonista),
          recorte: enumStr(ENUMS.recorte),
          utilidade_pratica: { type: "boolean" },
          sinal: { type: "string" },
        },
        required: ["i", "payoff", "payoff2", "promessa_hook", "funcao_subhook", "tipo_conclusao", "protagonista", "antagonista", "recorte", "utilidade_pratica", "sinal"],
        additionalProperties: false,
      },
    },
  },
  required: ["itens"],
  additionalProperties: false,
};

if (process.argv[1]?.endsWith("taxonomia.mjs")) {
  console.log(SYSTEM);
  console.error(`\n[${SYSTEM.length} caracteres, ${ENUMS.payoff.length} payoffs]`);
}
