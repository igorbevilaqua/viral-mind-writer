import { describe, expect, test } from "vitest";
import { fmtDay, fmtNum, fmtRatio, fmtWhen, ratioTone, tituloPublico } from "@/lib/format";

describe("fmtNum", () => {
  test("abaixo de mil: número exato", () => {
    expect(fmtNum(999)).toBe("999");
  });

  test("milhares: arredondado + k", () => {
    expect(fmtNum(1500)).toBe("2k");
  });

  test("milhões: uma casa decimal + M", () => {
    expect(fmtNum(1_200_000)).toBe("1.2M");
  });

  test("zero", () => {
    expect(fmtNum(0)).toBe("0");
  });
});

// fuso: horários vêm em UTC do Postgres e devem sair em America/Sao_Paulo (-3),
// independente do TZ do processo (Vercel roda em UTC)
describe("fmtWhen / fmtDay em São Paulo", () => {
  test("hora exibida é a de São Paulo, não UTC", () => {
    // 2026-07-31T23:30Z = 20:30 em SP, mesmo dia
    expect(fmtWhen("2026-07-31T23:30:00Z", new Date("2026-07-31T23:50:00Z"))).toBe("hoje 20:30");
  });

  test("00:30Z ainda é 'hoje 21:30' do dia anterior em SP", () => {
    expect(fmtWhen("2026-08-01T00:30:00Z", new Date("2026-08-01T02:00:00Z"))).toBe("hoje 21:30");
  });

  test("virada de dia é às 03:00Z (meia-noite em SP)", () => {
    expect(fmtWhen("2026-08-01T02:00:00Z", new Date("2026-08-01T04:00:00Z"))).toBe("ontem");
  });

  test("menos de 5 min é 'agora'", () => {
    expect(fmtWhen("2026-07-31T12:00:00Z", new Date("2026-07-31T12:03:00Z"))).toBe("agora");
  });

  test("mais antigo: dia/mês no fuso de SP", () => {
    // 2026-08-01T01:00Z = 31/jul 22:00 em SP
    expect(fmtDay("2026-08-01T01:00:00Z")).toBe("31 de jul");
  });
});

// WP-F.2: multiplicador baseline vs real no PublishBox
describe("fmtRatio", () => {
  test("uma casa decimal + x", () => {
    expect(fmtRatio(1.84)).toBe("1.8x");
    expect(fmtRatio(0.5)).toBe("0.5x");
    expect(fmtRatio(1)).toBe("1.0x");
  });
});

describe("ratioTone", () => {
  test("≥1.2 é dourado (inclusive na borda)", () => {
    expect(ratioTone(1.2)).toBe("gold");
    expect(ratioTone(3)).toBe("gold");
  });

  test("<0.8 é âmbar", () => {
    expect(ratioTone(0.79)).toBe("amber");
    expect(ratioTone(0.1)).toBe("amber");
  });

  test("faixa intermediária é neutra (bordas 0.8 e 1.19)", () => {
    expect(ratioTone(0.8)).toBe("neutral");
    expect(ratioTone(1)).toBe("neutral");
    expect(ratioTone(1.19)).toBe("neutral");
  });
});

// O link do roteiro circula em conversa cheia de roteiro: sem o cliente no título, todo
// compartilhamento chegava com o mesmo cabeçalho e ninguém sabia de quem era.
describe("tituloPublico", () => {
  test("cliente vem logo depois da marca, antes da headline", () => {
    expect(tituloPublico({ cliente: "Renato Mendes", headline: "A RED BULL FINGIU TER CLIENTES", data: "19/08/2026" })).toBe(
      "CODEX · Renato Mendes · A RED BULL FINGIU TER CLIENTES · 19/08/2026"
    );
  });

  test("sessão sem cliente continua com título válido", () => {
    expect(tituloPublico({ headline: "SEM CLIENTE", data: "19/08/2026" })).toBe("CODEX · SEM CLIENTE · 19/08/2026");
    expect(tituloPublico({ cliente: "   ", headline: "SÓ ESPAÇO" })).toBe("CODEX · SÓ ESPAÇO");
  });

  test("roteiro sem headline não deixa o título com buraco", () => {
    expect(tituloPublico({ cliente: "Túlio Lichenstein", headline: null, data: "19/08/2026" })).toBe(
      "CODEX · Túlio Lichenstein · Roteiro · 19/08/2026"
    );
  });
});
