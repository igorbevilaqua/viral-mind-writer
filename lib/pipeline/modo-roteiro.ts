import { appDb } from "../db";

const NOME_MODO: Record<string, string> = {
  historia: "história", mecanismo: "mecanismo", demonstracao: "demonstração",
  panorama: "panorama", conselho: "conselho", publi: "publi", misto: "misto",
};

// "história 82%, mecanismo 11% (99 roteiros)": é o que o agente de escolha lê para desempatar.
export function formatarMix(contagem: Record<string, number>): string {
  const total = Object.values(contagem).reduce((a, b) => a + b, 0);
  if (!total) return "";
  const partes = Object.entries(contagem)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([m, n]) => `${NOME_MODO[m] ?? m} ${Math.round((100 * n) / total)}%`);
  return `${partes.join(", ")} (${total} roteiros)`;
}

// Fail-soft: sem tabela ou com erro, mix vazio. O mix só desempata; nunca derruba a geração.
export async function mixDoCliente(clientId: string): Promise<Record<string, number>> {
  const { data, error } = await appDb.from("vm_roteiro_modo").select("modo").eq("cliente_id", clientId);
  if (error) {
    console.error("mix de modos indisponível, seguindo sem", error.message);
    return {};
  }
  const c: Record<string, number> = {};
  for (const r of data ?? []) c[r.modo as string] = (c[r.modo as string] ?? 0) + 1;
  return c;
}

export async function modosDosRoteiros(crmIds: string[]): Promise<Map<string, string>> {
  if (!crmIds.length) return new Map();
  const { data, error } = await appDb.from("vm_roteiro_modo").select("crm_script_id, modo").in("crm_script_id", crmIds);
  if (error) {
    console.error("modos dos roteiros indisponíveis, seguindo sem", error.message);
    return new Map();
  }
  return new Map((data ?? []).map((r) => [r.crm_script_id as string, r.modo as string]));
}
