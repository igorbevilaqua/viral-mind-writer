import { describe, expect, test, vi } from "vitest";

// `decidirAcesso` é pura, mas o módulo carrega os clients do Supabase e o hub (que puxa
// cookies()). Nenhum dos dois é usado aqui — mock só para o import subir.
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
vi.mock("@/lib/hub", () => ({ writerScope: vi.fn() }));

import { decidirAcesso } from "@/lib/autorizacao";

// A decisão de acesso, pura: dono, adm ou negado. O resto do módulo é I/O (resolver o dono) e
// a fronteira das rotas — o que erra em segurança é esta tabela, e é ela que está aqui.
// Referência: plans/seguranca-dono-e-adm.md, Regra 1.

const EU = "u-1";
const OUTRO = "u-2";

describe("decidirAcesso", () => {
  test("dono passa como dono", () => {
    expect(decidirAcesso({ isAdmin: false, userId: EU, ownerId: EU })).toBe("dono");
  });

  test("usuário comum não toca no recurso de outra pessoa", () => {
    expect(decidirAcesso({ isAdmin: false, userId: EU, ownerId: OUTRO })).toBe("negado");
  });

  test("adm passa por tudo — inclusive pelo que é de outra pessoa", () => {
    expect(decidirAcesso({ isAdmin: true, userId: EU, ownerId: OUTRO })).toBe("adm");
  });

  test("adm passa mesmo sem dono e mesmo sem identidade própria", () => {
    expect(decidirAcesso({ isAdmin: true, userId: null, ownerId: null })).toBe("adm");
  });

  // Sessão órfã (user_id null) é a herança de antes da coluna existir. /sessions/[id] já a esconde
  // do não-adm na LEITURA; a escrita não pode ser mais frouxa que a leitura da mesma linha.
  test("dono nulo não pertence a ninguém: usuário comum é negado", () => {
    expect(decidirAcesso({ isAdmin: false, userId: EU, ownerId: null })).toBe("negado");
  });

  test("anônimo é negado, mesmo quando o dono também é nulo — null nunca casa com null", () => {
    expect(decidirAcesso({ isAdmin: false, userId: null, ownerId: null })).toBe("negado");
  });

  test("anônimo é negado num recurso com dono", () => {
    expect(decidirAcesso({ isAdmin: false, userId: null, ownerId: EU })).toBe("negado");
  });

  // String vazia é o que sobra de um `?? ""` mal colocado; ela não pode virar chave de acesso.
  test("identidade vazia não casa com dono vazio", () => {
    expect(decidirAcesso({ isAdmin: false, userId: "", ownerId: "" })).toBe("negado");
  });
});
