import { describe, expect, it } from "vitest";
import { origemDaPremissa, teseAceitavel } from "@/lib/pipeline/premissa";
import { anexoModelagem } from "@/lib/pipeline/replicar";
import { direcaoBlock, montarEntradaPesquisa } from "@/lib/pipeline/agents";
import type { Attachment, GenerationContext } from "@/lib/pipeline/types";

// "Modelagem manda na premissa": a lógica PURA das quatro regras. O que se testa aqui é a
// decisão, não a chamada de modelo — o resto do pipeline é I/O e vive na mão do operador.

// A sessão real 84c425ad gravou `<UNKNOWN>` em vm_sessions.premissa e escreveu o roteiro
// inteiro servindo a ela, sob o cabeçalho "PREMISSA (o fio condutor — INEGOCIÁVEL)".
describe("guarda de sanidade da premissa", () => {
  it("rejeita vazio e só-espaço", () => {
    expect(teseAceitavel("")).toBe(false);
    expect(teseAceitavel("   \n ")).toBe(false);
    expect(teseAceitavel(null)).toBe(false);
    expect(teseAceitavel(undefined)).toBe(false);
  });

  it("rejeita o placeholder que já chegou ao banco em produção", () => {
    expect(teseAceitavel("<UNKNOWN>")).toBe(false);
    expect(teseAceitavel("  <PREMISSA NAO IDENTIFICADA>  ")).toBe(false);
    expect(teseAceitavel("n/a")).toBe(false);
    expect(teseAceitavel("N.A.")).toBe(false);
    expect(teseAceitavel("desconhecida")).toBe(false);
    expect(teseAceitavel("não se aplica")).toBe(false);
    expect(teseAceitavel("null")).toBe(false);
    expect(teseAceitavel("—")).toBe(false);
  });

  // Sessão d5ebc218 em produção: a tese saiu boa e o modelo continuou escrevendo a serialização
  // crua da tool. É longa e cheia de palavras, então passava em tudo o que o PLACEHOLDER testa.
  it("rejeita vazamento de tool no meio de uma tese que parece boa", () => {
    expect(
      teseAceitavel(
        'A onda de recuperações judiciais não é caso isolado de má gestão, é o mesmo modelo de ' +
          'varejo que parou de funcionar no Brasil atual.</premissa>\n' +
          '<parameter name="angulo_contraintuitivo">O senso comum acha que empresa grande quebra ' +
          "por erro pontual."
      )
    ).toBe(false);
    expect(teseAceitavel("Tese boa e completa aqui </premissa>")).toBe(false);
    // E não pega quem só usa "menor que" no meio de uma tese legítima.
    expect(teseAceitavel("O salário real de quem ganha < 2 mil caiu mais que a média nacional.")).toBe(true);
  });

  it("rejeita o que é curto demais para ser tese", () => {
    expect(teseAceitavel("Milei")).toBe(false);
    expect(teseAceitavel("reforma tributária")).toBe(false); // 2 palavras: é tema, não tese
    expect(teseAceitavel("o Pix e o PIB")).toBe(false); // 15 chars? não: 13, e é enumeração
  });

  // ponytail: o teto conhecido da guarda — ela separa placeholder de texto, não tema de tese.
  // "a reforma tributária" passa. Distinguir descrição de afirmação contestável é julgamento, e
  // esse julgamento é do agente da premissa (e do humano na caixa de confirmação), não de um
  // regex. Se um dia entrar tema curto demais como premissa, o passo seguinte é medir — não
  // apertar o número aqui, que só produziria falso positivo em tese legítima e curta.
  it("não tenta distinguir tema de tese: isso é julgamento, não regex", () => {
    expect(teseAceitavel("a reforma tributária")).toBe(true);
  });

  it("aceita uma tese legítima", () => {
    expect(
      teseAceitavel(
        "cada ataque público do Milei é uma peça de uma negociação comercial que já estava em curso"
      )
    ).toBe(true);
    // curta, mas é afirmação completa e contestável
    expect(teseAceitavel("o Pix quebrou o duopólio dos cartões no Brasil")).toBe(true);
  });
});

describe("de onde a premissa vem", () => {
  const tese = "o Pix quebrou o duopólio dos cartões no Brasil";

  it("sem modelagem e sem nada digitado, deriva do tema", () => {
    expect(origemDaPremissa({ temModelagem: false })).toBe("derivada");
  });

  it("sem modelagem, a digitada vence", () => {
    expect(origemDaPremissa({ digitada: tese, temModelagem: false })).toBe("digitada");
  });

  // O run 2: `confirmarPremissa` gravou a tese na coluna e disparou a geração de novo. Se a
  // premissa já resolvida não vencesse aqui, a sessão voltaria a extrair, voltaria a pausar, e
  // ficaria em laço eterno de confirmação — nenhum roteiro sairia nunca.
  it("com modelagem JÁ CONFIRMADA, a premissa da coluna vence e não há nova pausa", () => {
    expect(origemDaPremissa({ digitada: tese, temModelagem: false, teseExtraida: "outra tese" })).toBe("digitada");
  });

  it("com modelagem e tese extraída, pausa para confirmação", () => {
    expect(origemDaPremissa({ temModelagem: true, teseExtraida: tese })).toBe("modelagem");
  });

  // A regra 1 inteira: era aqui que o `if` sem `else` escorregava para a derivação sem tema e
  // sem material, e o modelo — forçado por tool_choice — inventava um placeholder.
  it("com modelagem e SEM tese utilizável, é falha declarada, nunca derivação", () => {
    expect(origemDaPremissa({ temModelagem: true, teseExtraida: "" })).toBe("sem_tese");
    expect(origemDaPremissa({ temModelagem: true, teseExtraida: "<UNKNOWN>" })).toBe("sem_tese");
    expect(origemDaPremissa({ temModelagem: true })).toBe("sem_tese");
  });
});

describe("qual anexo é a modelagem quando há vários", () => {
  const anexo = (over: Partial<Attachment>): Attachment =>
    ({ id: "a", kind: "video_link", is_modelagem: false, modo: null, url: null, raw_content: null, ...over }) as Attachment;

  it("sem nenhum marcado, não há modelagem", () => {
    expect(anexoModelagem([anexo({ id: "1" }), anexo({ id: "2" })])).toBeNull();
  });

  it("com vários em Modelar, fica o primeiro", () => {
    const as = [anexo({ id: "1", is_modelagem: true }), anexo({ id: "2", is_modelagem: true })];
    expect(anexoModelagem(as)?.id).toBe("1");
  });

  it("Replicar vence Modelar mesmo vindo depois — é o modo mais restritivo", () => {
    const as = [
      anexo({ id: "1", is_modelagem: true, modo: "modelar" }),
      anexo({ id: "2", is_modelagem: true, modo: "replicar" }),
    ];
    expect(anexoModelagem(as)?.id).toBe("2");
  });

  it("modo nulo (sessão pré-0034) conta como Modelar", () => {
    expect(anexoModelagem([anexo({ id: "1", is_modelagem: true, modo: null })])?.id).toBe("1");
  });
});

describe("o texto digitado como direção", () => {
  const ctx = (over: Partial<GenerationContext> = {}) =>
    ({ prompt: "cite o caso da Argentina", attachments: [], insights: [], ...over }) as unknown as GenerationContext;
  const modelagem = [{ id: "1", kind: "video_link", is_modelagem: true, modo: "modelar" }] as Attachment[];

  it("sem modelagem não existe direção: o texto continua sendo tema", () => {
    expect(direcaoBlock(ctx(), "sugestão de hook")).toBe("");
    expect(montarEntradaPesquisa(ctx())).toContain("TEMA DO VÍDEO: cite o caso da Argentina");
  });

  it("com modelagem, vira direção com as travas — e nunca tema", () => {
    const b = direcaoBlock(ctx({ attachments: modelagem }), "sugestão de hook");
    expect(b).toContain("cite o caso da Argentina");
    expect(b).toContain("não é tema novo e não autoriza trocar de assunto");
    expect(b).toContain("SUGESTÃO, não ordem");
    expect(b).toContain("sugestão de hook");
  });

  it("campo vazio não inventa bloco de direção", () => {
    expect(direcaoBlock(ctx({ prompt: "  ", attachments: modelagem }), "sugestão de hook")).toBe("");
  });

  // O pesquisador é quem mais sofria com a inversão: com texto digitado ele pesquisava OUTRO
  // assunto e o dossiê chegava sem nenhuma relação com o vídeo que a sala ia superar.
  it("chega ao pesquisador como pauta extra, com a transcrição na mesa", () => {
    const e = montarEntradaPesquisa(ctx({ attachments: modelagem, modoModelagem: true }), {
      transcricao: "o vídeo modelado fala disso",
    });
    expect(e).toContain("ORIENTAÇÃO DO USUÁRIO");
    expect(e).toContain("sugestão de pesquisa");
    expect(e).not.toContain("TEMA DO VÍDEO: cite o caso da Argentina");
  });
});
