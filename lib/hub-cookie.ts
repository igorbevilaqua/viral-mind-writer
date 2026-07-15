// Cache assinado da permissão do hub (evita consultar hub.permissoes a cada request).
// Edge-safe: só Web Crypto, sem imports de next/headers — o middleware importa daqui.
// ponytail: HMAC com a service role key como segredo — server-only e já existe; env dedicada se um dia rotacionarem separado.

export const HUB_COOKIE = "vm-hub-writer";
export const HUB_COOKIE_TTL_S = 300; // revogação propaga em até 5 min

const enc = new TextEncoder();

async function hmacHex(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(process.env.SUPABASE_SERVICE_ROLE_KEY!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// papel: 'membro' | 'admin' | 'none' ('none' cacheia a negativa — usuário sem acesso não martela o banco)
export async function assinarPermissao(userId: string, papel: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + HUB_COOKIE_TTL_S;
  const body = `${userId}.${papel}.${exp}`;
  return `${body}.${await hmacHex(body)}`;
}

// Retorna o papel ('membro' | 'admin' | 'none') ou null se inválido/expirado/de outro usuário.
export async function verificarPermissao(value: string, userId: string): Promise<string | null> {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [uid, papel, exp, sig] = parts;
  if (uid !== userId || Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const expected = await hmacHex(`${uid}.${papel}.${exp}`);
  return constantTimeEqual(sig, expected) ? papel : null;
}
